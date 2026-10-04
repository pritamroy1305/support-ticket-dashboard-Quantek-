import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type { ListTicketsQuery, PaginationMeta, Ticket, TicketSummary } from "../types/ticket";
import { NotFoundError } from "../utils/errors";
import type { CreateTicketInput, UpdateTicketInput } from "../validators/ticket.validators";

export async function createTicket(input: CreateTicketInput): Promise<Ticket> {
  return prisma.ticket.create({ data: input });
}

/** Search, filters, sorting and pagination all happen in PostgreSQL. */
export async function listTickets(
  query: ListTicketsQuery,
): Promise<{ tickets: Ticket[]; pagination: PaginationMeta }> {
  const { search, status, priority, sort, page, limit } = query;

  const where: Prisma.TicketWhereInput = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { customerEmail: { contains: search, mode: "insensitive" } },
    ];
  }

  const direction = sort === "oldest" ? "asc" : "desc";

  const [tickets, total] = await prisma.$transaction([
    prisma.ticket.findMany({
      where,
      // id is a tie-breaker so pagination stays stable when createdAt values match
      orderBy: [{ createdAt: direction }, { id: direction }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.ticket.count({ where }),
  ]);

  return {
    tickets,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getTicketById(id: string): Promise<Ticket> {
  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) throw new NotFoundError("Ticket not found");
  return ticket;
}

export async function updateTicket(id: string, input: UpdateTicketInput): Promise<Ticket> {
  try {
    return await prisma.ticket.update({ where: { id }, data: input });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new NotFoundError("Ticket not found");
    }
    throw error;
  }
}

/** Always counts the whole table - it never receives search/filter/pagination input. */
export async function getSummary(): Promise<TicketSummary> {
  const grouped = await prisma.ticket.groupBy({ by: ["status"], _count: { _all: true } });
  const countFor = (status: string) => grouped.find((row) => row.status === status)?._count._all ?? 0;

  const open = countFor("OPEN");
  const inProgress = countFor("IN_PROGRESS");
  const resolved = countFor("RESOLVED");
  return { total: open + inProgress + resolved, open, inProgress, resolved };
}
