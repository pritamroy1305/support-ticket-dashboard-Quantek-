import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/lib/prisma";
import type { Priority, Status } from "../src/types/ticket";

const app = createApp();

const STATUSES: Status[] = ["OPEN", "IN_PROGRESS", "RESOLVED"];
const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH"];
const FIXTURE_COUNT = 23;
const BASE_TIME = new Date("2026-01-01T00:00:00.000Z").getTime();

/** Deterministic fixtures: 8 OPEN, 8 IN_PROGRESS, 7 RESOLVED; ticket i is created i hours after BASE_TIME. */
function buildFixtures() {
  return Array.from({ length: FIXTURE_COUNT }, (_, i) => {
    const createdAt = new Date(BASE_TIME + i * 60 * 60 * 1000);
    return {
      title: i % 5 === 0 ? `Login issue #${i}` : i % 7 === 0 ? `Payment problem #${i}` : `General question #${i}`,
      description: `Description for ticket ${i}`,
      customerEmail: i === 4 ? "Alice@Acme.test" : `customer${i}@example.com`,
      status: STATUSES[i % 3],
      priority: PRIORITIES[Math.floor(i / 3) % 3],
      createdAt,
      updatedAt: createdAt,
    };
  });
}
const fixtures = buildFixtures();
const countWhere = (predicate: (t: (typeof fixtures)[number]) => boolean) => fixtures.filter(predicate).length;

const validBody = {
  title: "Unable to login",
  description: "Customer cannot access their account.",
  customerEmail: "customer@example.com",
  priority: "HIGH",
};

beforeEach(async () => {
  // DATABASE_URL points at the *_test database here (see vitest.config.ts)
  await prisma.ticket.deleteMany();
  await prisma.ticket.createMany({ data: fixtures });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("POST /api/tickets - validation", () => {
  const invalidCases: Array<[string, Record<string, unknown>, string]> = [
    ["empty title", { ...validBody, title: "   " }, "title"],
    ["title over 120 characters", { ...validBody, title: "x".repeat(121) }, "title"],
    ["empty description", { ...validBody, description: "" }, "description"],
    ["invalid email", { ...validBody, customerEmail: "not-an-email" }, "customerEmail"],
    ["invalid priority", { ...validBody, priority: "URGENT" }, "priority"],
    ["invalid status", { ...validBody, status: "DONE" }, "status"],
  ];

  it.each(invalidCases)("returns 400 for %s", async (_name, body, field) => {
    const res = await request(app).post("/api/tickets").send(body);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe("Validation failed");
    expect(res.body.error.details.map((d: { field: string }) => d.field)).toContain(field);
    expect(await prisma.ticket.count()).toBe(FIXTURE_COUNT);
  });

  it("returns 400 for a malformed JSON body", async () => {
    const res = await request(app).post("/api/tickets").set("Content-Type", "application/json").send("{bad json");
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("creates a ticket with status defaulting to OPEN and returns 201", async () => {
    const res = await request(app).post("/api/tickets").send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ ...validBody, status: "OPEN" });
    expect(await prisma.ticket.count()).toBe(FIXTURE_COUNT + 1);
  });
});

describe("GET /api/tickets - querying", () => {
  it("returns only tickets with the requested status", async () => {
    const res = await request(app).get("/api/tickets?status=OPEN&limit=50");

    expect(res.status).toBe(200);
    expect(res.body.data.tickets.length).toBeGreaterThan(0);
    expect(res.body.data.tickets.every((t: { status: Status }) => t.status === "OPEN")).toBe(true);
    expect(res.body.data.pagination.total).toBe(countWhere((t) => t.status === "OPEN"));
  });

  it("filters by priority and by status + priority together", async () => {
    const res = await request(app).get("/api/tickets?status=RESOLVED&priority=HIGH&limit=50");

    const expected = countWhere((t) => t.status === "RESOLVED" && t.priority === "HIGH");
    expect(res.status).toBe(200);
    expect(res.body.data.pagination.total).toBe(expected);
    expect(
      res.body.data.tickets.every((t: { status: Status; priority: Priority }) => t.status === "RESOLVED" && t.priority === "HIGH"),
    ).toBe(true);
  });

  it("searches titles case-insensitively", async () => {
    const res = await request(app).get("/api/tickets?search=LOGIN&limit=50");

    expect(res.status).toBe(200);
    expect(res.body.data.pagination.total).toBe(countWhere((t) => t.title.toLowerCase().includes("login")));
    expect(res.body.data.tickets.every((t: { title: string }) => /login/i.test(t.title))).toBe(true);
  });

  it("searches customer email case-insensitively", async () => {
    const res = await request(app).get("/api/tickets?search=alice@acme");

    expect(res.body.data.pagination.total).toBe(1);
    expect(res.body.data.tickets[0].customerEmail).toBe("Alice@Acme.test");
  });

  it("combines search with status and priority filters", async () => {
    const res = await request(app).get("/api/tickets?search=login&status=OPEN&priority=LOW&limit=50");

    const expected = countWhere(
      (t) => t.title.toLowerCase().includes("login") && t.status === "OPEN" && t.priority === "LOW",
    );
    expect(res.body.data.pagination.total).toBe(expected);
    expect(expected).toBeGreaterThan(0);
  });

  it("sorts newest first by default and oldest first on request", async () => {
    const newest = await request(app).get("/api/tickets");
    const oldest = await request(app).get("/api/tickets?sort=oldest");

    expect(newest.body.data.tickets[0].createdAt).toBe(fixtures[FIXTURE_COUNT - 1].createdAt.toISOString());
    expect(oldest.body.data.tickets[0].createdAt).toBe(fixtures[0].createdAt.toISOString());
  });

  it("returns 400 for invalid query parameters", async () => {
    for (const qs of ["status=DONE", "priority=URGENT", "sort=random", "page=0", "limit=1000", "page=abc"]) {
      const res = await request(app).get(`/api/tickets?${qs}`);
      expect(res.status, qs).toBe(400);
    }
  });
});

describe("GET /api/tickets - pagination", () => {
  it("returns at most 10 tickets for page=1&limit=10 and exposes pagination metadata", async () => {
    const res = await request(app).get("/api/tickets?page=1&limit=10");

    expect(res.status).toBe(200);
    expect(res.body.data.tickets).toHaveLength(10);
    expect(res.body.data.pagination).toEqual({ page: 1, limit: 10, total: FIXTURE_COUNT, totalPages: 3 });
  });

  it("defaults to page 1 with 10 tickets and returns the remainder on the last page", async () => {
    const first = await request(app).get("/api/tickets");
    const last = await request(app).get("/api/tickets?page=3");

    expect(first.body.data.tickets).toHaveLength(10);
    expect(first.body.data.pagination.page).toBe(1);
    expect(last.body.data.tickets).toHaveLength(FIXTURE_COUNT - 20);
  });

  it("does not repeat tickets across pages", async () => {
    const ids = new Set<string>();
    for (const page of [1, 2, 3]) {
      const res = await request(app).get(`/api/tickets?page=${page}`);
      res.body.data.tickets.forEach((t: { id: string }) => ids.add(t.id));
    }
    expect(ids.size).toBe(FIXTURE_COUNT);
  });
});

describe("GET /api/tickets/:id", () => {
  it("returns a ticket, 404 for an unknown id and 400 for a malformed id", async () => {
    const existing = await prisma.ticket.findFirstOrThrow();

    const found = await request(app).get(`/api/tickets/${existing.id}`);
    expect(found.status).toBe(200);
    expect(found.body.data.id).toBe(existing.id);

    const missing = await request(app).get("/api/tickets/00000000-0000-4000-8000-000000000000");
    expect(missing.status).toBe(404);
    expect(missing.body.error.message).toBe("Ticket not found");

    const malformed = await request(app).get("/api/tickets/not-a-uuid");
    expect(malformed.status).toBe(400);
  });
});

describe("PATCH /api/tickets/:id", () => {
  it("persists status and priority changes and bumps updatedAt", async () => {
    const before = await prisma.ticket.findFirstOrThrow({ where: { status: "OPEN", priority: "LOW" } });

    const res = await request(app).patch(`/api/tickets/${before.id}`).send({ status: "RESOLVED", priority: "MEDIUM" });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: before.id, status: "RESOLVED", priority: "MEDIUM" });

    const after = await prisma.ticket.findUniqueOrThrow({ where: { id: before.id } });
    expect(after.status).toBe("RESOLVED");
    expect(after.priority).toBe("MEDIUM");
    expect(after.updatedAt.getTime()).toBeGreaterThan(before.updatedAt.getTime());
    expect(after.title).toBe(before.title);
  });

  it("returns 404 for an unknown ticket and 400 for invalid input", async () => {
    const existing = await prisma.ticket.findFirstOrThrow();

    const missing = await request(app).patch("/api/tickets/00000000-0000-4000-8000-000000000000").send({ status: "OPEN" });
    expect(missing.status).toBe(404);

    for (const body of [{ status: "DONE" }, { priority: "URGENT" }, {}, { title: "Hacked" }]) {
      const res = await request(app).patch(`/api/tickets/${existing.id}`).send(body);
      expect(res.status, JSON.stringify(body)).toBe(400);
    }
  });
});

describe("GET /api/tickets/summary", () => {
  it("returns counts for the entire database", async () => {
    const res = await request(app).get("/api/tickets/summary");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      total: await prisma.ticket.count(),
      open: await prisma.ticket.count({ where: { status: "OPEN" } }),
      inProgress: await prisma.ticket.count({ where: { status: "IN_PROGRESS" } }),
      resolved: await prisma.ticket.count({ where: { status: "RESOLVED" } }),
    });
    expect(res.body.data.total).toBe(FIXTURE_COUNT);
  });

  it("is not affected by search, filter, sort or pagination parameters", async () => {
    const plain = await request(app).get("/api/tickets/summary");
    const filtered = await request(app).get("/api/tickets/summary?search=payment&status=OPEN&priority=HIGH&sort=oldest&page=2&limit=5");

    expect(filtered.status).toBe(200);
    expect(filtered.body.data).toEqual(plain.body.data);
  });

  it("reflects newly created tickets", async () => {
    await request(app).post("/api/tickets").send(validBody);
    const res = await request(app).get("/api/tickets/summary");
    expect(res.body.data.total).toBe(FIXTURE_COUNT + 1);
    expect(res.body.data.open).toBe(countWhere((t) => t.status === "OPEN") + 1);
  });
});

describe("unknown routes", () => {
  it("returns a consistent 404 error body", async () => {
    const res = await request(app).get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false, error: { message: expect.any(String) } });
  });
});
