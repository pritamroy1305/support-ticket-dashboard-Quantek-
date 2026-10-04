# Support Ticket Dashboard

## Overview

A small full-stack app for browsing and managing customer support tickets. A Next.js frontend talks to a separate Express REST API, which stores data in PostgreSQL through Prisma. Search, filtering, sorting and pagination all run in the database, and the summary counts always cover the whole dataset.

## Features

- Dashboard with summary cards (Total / Open / In Progress / Resolved) from `GET /api/tickets/summary`; never affected by filters
- Ticket list: table on desktop, cards on mobile
- Debounced backend search (title or customer email, case-insensitive)
- Status and priority filters, newest/oldest sorting, all combinable
- Backend pagination (10 per page), Previous/Next and numbered pages, page resets to 1 when search/filters/sort change
- Create ticket form (React Hook Form + Zod) with inline field errors, including backend validation errors
- Ticket details page `/tickets/[id]` with editable status/priority, "Save Changes", success/error toasts; values persist after refresh
- Loading, empty ("No tickets found."), and error ("Unable to load tickets." + Retry) states
- Centralized API error format, Zod validation, UUID/enum/query validation, 404/400/500 handling
- 30 seeded tickets (10 per status, all status/priority combinations), 25 automated API tests

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 3, shadcn-style components (button, badge, etc.), React Hook Form, Zod |
| Backend | Node.js, Express 5, TypeScript, Zod |
| Database | PostgreSQL, Prisma ORM 6 |
| Testing | Vitest, Supertest |

## Architecture

```
Browser (Next.js, :3000)  --fetch-->  Express API (:4000)  --Prisma-->  PostgreSQL
 components + hooks                    routes -> controllers ->          Ticket table
 lib/api.ts (only fetch caller)        validators (Zod) -> services
```

Requests flow `route -> controller (validates input with Zod) -> service (Prisma queries) -> JSON`. Any thrown error reaches one error-handling middleware that produces the consistent `{ success: false, error }` body.

## Project Structure

```
backend/
  prisma/            schema.prisma, migrations/, seed.ts
  src/
    routes/          URL -> controller mapping
    controllers/     parse/validate request, call service, send response
    services/        all Prisma/database logic
    validators/      Zod schemas (create, update, id, list query)
    middleware/      notFound + central error handler
    utils/, types/, lib/prisma.ts, config.ts, app.ts, server.ts
  tests/             Vitest + Supertest API tests, test-DB safety/setup
frontend/
  app/               pages: / and /tickets/[id]
  components/        dashboard pieces; components/ui = small reusable primitives
  hooks/             useAsync (fetch + abort + reload), useDebounce
  lib/               api client, Zod form schema, constants, utils
  types/             API/domain types (mirror the backend contract)
```

## Prerequisites

- Node.js 20 or newer
- PostgreSQL 14+ running locally (any user/password you like)

## Installation

```bash
npm install              # installs root, backend and frontend workspaces
```

## Environment Variables

Create the real env files from `.env.example` (never commit them):

```bash
cp .env.example backend/.env
echo 'NEXT_PUBLIC_API_URL=http://localhost:4000' > frontend/.env.local
```

Edit `backend/.env` so the credentials match your PostgreSQL.

| Variable | File | Purpose |
|---|---|---|
| `DATABASE_URL` | backend/.env | Development database connection string |
| `TEST_DATABASE_URL` | backend/.env | Separate database for tests. Name must end in `_test` and differ from `DATABASE_URL` |
| `BACKEND_PORT` | backend/.env | Port of the Express API (default 4000) |
| `FRONTEND_URL` | backend/.env | Origin allowed by CORS (default http://localhost:3000) |
| `NEXT_PUBLIC_API_URL` | frontend/.env.local | Base URL of the API used by the browser |

## Database Setup

Create the two databases (adjust user/host as needed), then generate the client and run migrations:

```bash
createdb support_tickets
createdb support_tickets_test
npm run db:generate      # prisma generate
npm run db:migrate       # prisma migrate dev (applies backend/prisma/migrations)
```

Indexes exist on `status`, `priority`, `createdAt` and `customerEmail`.

## Seed Data

```bash
npm run db:seed          # inserts 30 tickets; skipped if tickets already exist
npm run db:reseed        # deletes all tickets and re-inserts the 30
```

Seed data is deterministic: 10 OPEN, 10 IN_PROGRESS, 10 RESOLVED, covering every status/priority combination with creation dates spread over the last ~4 weeks.

## Running the Application

From the repository root:

```bash
npm run dev
```

This starts the API on http://localhost:4000 and the frontend on http://localhost:3000. To run them separately:

```bash
# Terminal 1
npm run dev -w backend
# Terminal 2
npm run dev -w frontend
```

## Running Tests

```bash
npm test
```

The tests use `TEST_DATABASE_URL` (default `.../support_tickets_test`). Before running, Vitest applies migrations to that database (`prisma migrate deploy`), and each test resets and re-creates its own fixtures. Tests refuse to run if the database name does not end in `_test` or equals `DATABASE_URL`, so development data is never touched.

## API Documentation

All responses use `{ "success": true, "data": ... }` or `{ "success": false, "error": { "message", "details?" } }`.

### POST /api/tickets
```json
// request
{ "title": "Unable to login", "description": "Customer cannot access their account.",
  "customerEmail": "customer@example.com", "priority": "HIGH", "status": "OPEN" }
```
`status` is optional (default `OPEN`). Returns **201** with the created ticket, or **400**:
```json
{ "success": false, "error": { "message": "Validation failed",
  "details": [ { "field": "customerEmail", "message": "Invalid email address" } ] } }
```

### GET /api/tickets
Query: `search`, `status` (OPEN|IN_PROGRESS|RESOLVED), `priority` (LOW|MEDIUM|HIGH), `sort` (newest|oldest, default newest), `page` (default 1), `limit` (default 10, max 50).

`GET /api/tickets?search=login&status=OPEN&priority=HIGH&sort=newest&page=1&limit=10`
```json
{ "success": true, "data": {
  "tickets": [ { "id": "...", "title": "...", "description": "...", "customerEmail": "...",
                 "priority": "HIGH", "status": "OPEN", "createdAt": "...", "updatedAt": "..." } ],
  "pagination": { "page": 1, "limit": 10, "total": 25, "totalPages": 3 } } }
```
Invalid query values return **400**.

### GET /api/tickets/summary
```json
{ "success": true, "data": { "total": 30, "open": 10, "inProgress": 10, "resolved": 10 } }
```
Computed with one grouped count over the whole table; no query parameters are read.

### GET /api/tickets/:id
**200** with the full ticket, **404** `Ticket not found`, **400** for a malformed id.

### PATCH /api/tickets/:id
```json
{ "status": "RESOLVED", "priority": "MEDIUM" }
```
Either field may be sent, at least one is required, other fields are rejected. Returns **200** with the updated ticket (`updatedAt` changes automatically), **404** if missing, **400** for invalid input.

## Screenshots

Real screenshots of the running app live in [`docs/screenshots/`](docs/screenshots). Take them after `npm run dev` + `npm run db:seed`:

| File | Shows |
|---|---|
| `01-dashboard.png` | Dashboard with summary counts |
| `02-search-filters.png` | Search + status/priority filters (note summary cards unchanged) |
| `03-pagination.png` | Page 2 of the list |
| `04-create-ticket.png` | Create form, ideally with validation errors |
| `05-ticket-details.png` | Ticket details and edit controls |
| `06-mobile.png` | Mobile layout (browser dev tools, ~390px wide) |

## Extending the Code

- **New ticket field**: add it to `backend/prisma/schema.prisma` -> `npx prisma migrate dev` -> `validators/ticket.validators.ts` -> `frontend/types/ticket.ts`, `lib/schemas.ts`, `CreateTicketDialog.tsx`.
- **New filter**: add it to `listTicketsQuerySchema`, to the `where` object in `services/ticket.service.ts`, then to `TicketListParams`, `lib/api.ts` (`listTickets`), `TicketFilters.tsx` and the `filterKey` in `app/page.tsx`.
- **New status/priority value**: change the Prisma enum, the Zod enums in the validators, and `types/ticket.ts` + `lib/constants.ts` on the frontend.

## Technical Decisions

- **Next.js**: file-based routing for `/` and `/tickets/[id]`, good TypeScript/Tailwind support.
- **Express (separate)**: keeps the API independent from the UI and makes the layers (routes, controllers, services) easy to read and discuss.
- **PostgreSQL**: relational data, native enums, case-insensitive search via `ILIKE`, proper indexes.
- **Prisma 6**: typed queries and migrations. It is used with the `pg` driver adapter and `engineType = "client"`, so no native query-engine binary is needed at runtime (Prisma 6 is used rather than 7 to keep the familiar `url = env(...)` datasource).
- **Zod**: one validation language on both sides; backend is the source of truth, frontend validation is only for UX.
- **Frontend state**: a small `useAsync` hook (abortable fetch + reload) is enough; no state library or SWR.
- **Types**: the frontend mirrors the API contract in `frontend/types/ticket.ts` instead of a shared package, to avoid workspace build complexity.
- **Stable pagination**: results are ordered by `createdAt` then `id`, so equal timestamps cannot duplicate or skip rows across pages.

## Assumptions

- Single-tenant, no authentication; anyone who can reach the API can use it.
- Search is a substring match on title and customer email.
- Only `status` and `priority` are editable after creation, as specified.
- `limit` is capped at 50 to protect the database.

## Known Limitations

- No authentication, deletion, or full-text search (uses `ILIKE`; fine at this scale, would need trigram/full-text indexes for very large tables).
- Frontend has no automated tests; only the API is tested.
- Ticket detail "Save Changes" overwrites with last write (no optimistic locking).

## Testing

`backend/tests/tickets.api.test.ts` (25 tests): validation of every invalid create case (title empty/over 120, empty description, bad email, bad priority/status, malformed JSON), default status and 201, status/priority filters and their combinations, case-insensitive search by title and email, search + filters together, newest/oldest ordering, invalid query params, pagination (max 10, metadata, last page, no duplicates), single ticket 200/404/400, PATCH persistence and `updatedAt`, PATCH 404/400, and summary counts matching the whole database and ignoring filter parameters.



## Time Spent

> **UPDATE BEFORE SUBMITTING:** "Setup 1h, backend 2h, frontend 2h, tests 1h, docs 0.5h".
