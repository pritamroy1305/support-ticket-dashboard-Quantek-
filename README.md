# Support Ticket Dashboard

A full-stack web app for managing customer support tickets.

The frontend is built with Next.js and the backend is a separate Express API. PostgreSQL is used for storing the tickets and Prisma handles the database queries/migrations.

The main goal was to keep the app simple but still handle things like searching, filters, pagination and validation properly from the backend.

## Features

- Create support tickets
- View all tickets from the dashboard
- Summary cards for Total, Open, In Progress and Resolved tickets
- Search tickets using title or customer email
- Search is case-insensitive
- Filter tickets by status
- Filter by priority
- Sort by newest or oldest
- Pagination (10 tickets per page)
- Previous/Next + page numbers
- Ticket details page
- Update ticket status and priority
- Form validation using Zod
- Loading, error and empty states
- Responsive layout for mobile and desktop
- 30 seed tickets
- 25 backend API tests

The summary cards always show numbers from the complete database. So applying a filter or searching something does not change the summary numbers.

## Tech Stack

| Part | Tech |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript |
| Styling | Tailwind CSS 3, shadcn-style components |
| Forms | React Hook Form + Zod |
| Backend | Node.js, Express 5, TypeScript |
| Database | PostgreSQL |
| ORM | Prisma 6 |
| Testing | Vitest + Supertest |

## How it works

The frontend runs on port `3000` and communicates with the Express API running on `4000`.

```text
Next.js (:3000)
      |
      | fetch
      v
Express API (:4000)
      |
      | Prisma
      v
PostgreSQL
```

On backend I separated the logic into routes, controllers, validators and services.

Basic request flow:

```text
route -> controller -> validation -> service -> prisma -> database
```

Controllers mostly deal with the request/response and validation, while database related code stays inside services.

There is also one error handling middleware so API errors follow the same response format.

## Project Structure

```text
backend/
  prisma/
    schema.prisma
    migrations/
    seed.ts

  src/
    routes/
    controllers/
    services/
    validators/
    middleware/
    utils/
    types/
    lib/
    config.ts
    app.ts
    server.ts

  tests/

frontend/
  app/
  components/
  hooks/
  lib/
  types/
```

The frontend API calls are mainly kept inside `lib/api.ts` instead of writing fetch calls in every component.

## Requirements

Before running the project make sure you have:

- Node.js 20+
- PostgreSQL 14+

## Installation

Clone the repository and from the root folder run:

```bash
npm install
```

It will install dependencies for both frontend and backend workspaces.

## Environment Setup

Create backend env:

```bash
cp .env.example backend/.env
```

For frontend create:

```text
frontend/.env.local
```

and add:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

The backend `.env` should contain something like:

```env
DATABASE_URL=your_database_url
TEST_DATABASE_URL=your_test_database_url
BACKEND_PORT=4000
FRONTEND_URL=http://localhost:3000
```

Change the database username/password according to your local PostgreSQL setup.

Important: `TEST_DATABASE_URL` should be a different database and its name should end with `_test`.

This is done so tests don't accidentally delete or modify development data.

## Database Setup

Create two databases:

```bash
createdb support_tickets
createdb support_tickets_test
```

Generate Prisma client:

```bash
npm run db:generate
```

Run migrations:

```bash
npm run db:migrate
```

There are indexes on `status`, `priority`, `createdAt` and `customerEmail`.

## Seed Data

To add sample tickets:

```bash
npm run db:seed
```

This adds 30 tickets.

The data contains:

```text
10 OPEN
10 IN_PROGRESS
10 RESOLVED
```

Different priority combinations are included and the created dates are spread across around 4 weeks.

If tickets already exist then normal seed will skip inserting them again.

To completely reset the tickets:

```bash
npm run db:reseed
```

This deletes the current tickets and inserts the seed data again.

## Running the Project

From root:

```bash
npm run dev
```

Frontend:

```text
http://localhost:3000
```

Backend:

```text
http://localhost:4000
```

You can also run them separately if needed.

Backend:

```bash
npm run dev -w backend
```

Frontend:

```bash
npm run dev -w frontend
```

## API

All successful API responses use:

```json
{
  "success": true,
  "data": {}
}
```

Errors use:

```json
{
  "success": false,
  "error": {
    "message": "Something went wrong"
  }
}
```

Validation errors can also contain `details`.

---

### Create Ticket

```http
POST /api/tickets
```

Example body:

```json
{
  "title": "Unable to login",
  "description": "Customer cannot access their account.",
  "customerEmail": "customer@example.com",
  "priority": "HIGH",
  "status": "OPEN"
}
```

`status` is optional. If it is not provided then `OPEN` is used by default.

Successful creation returns `201`.

For invalid input the API returns `400`.

Example:

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "details": [
      {
        "field": "customerEmail",
        "message": "Invalid email address"
      }
    ]
  }
}
```

---

### Get Tickets

```http
GET /api/tickets
```

Supported query params:

- `search`
- `status`
- `priority`
- `sort`
- `page`
- `limit`

Example:

```text
GET /api/tickets?search=login&status=OPEN&priority=HIGH&sort=newest&page=1&limit=10
```

Status values:

```text
OPEN
IN_PROGRESS
RESOLVED
```

Priority:

```text
LOW
MEDIUM
HIGH
```

Sort:

```text
newest
oldest
```

Default page is `1` and default limit is `10`.

Maximum limit is `50`.

Example response:

```json
{
  "success": true,
  "data": {
    "tickets": [
      {
        "id": "...",
        "title": "...",
        "description": "...",
        "customerEmail": "...",
        "priority": "HIGH",
        "status": "OPEN",
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

Search, filtering, sorting and pagination are all done in database queries.

I didn't fetch all tickets and then filter them on frontend because that wouldn't scale properly once the number of tickets increases.

Search checks both title and customer email.

---

### Ticket Summary

```http
GET /api/tickets/summary
```

Example:

```json
{
  "success": true,
  "data": {
    "total": 30,
    "open": 10,
    "inProgress": 10,
    "resolved": 10
  }
}
```

The summary is calculated separately from the ticket list.

This means:

```text
Search -> summary stays same
Filter -> summary stays same
Pagination -> summary stays same
```

It always represents all tickets in database.

---

### Get Single Ticket

```http
GET /api/tickets/:id
```

Possible responses:

```text
200 - ticket found
400 - invalid id
404 - ticket not found
```

The ticket id is validated as UUID before querying the database.

---

### Update Ticket

```http
PATCH /api/tickets/:id
```

Currently only status and priority are editable.

Example:

```json
{
  "status": "RESOLVED",
  "priority": "MEDIUM"
}
```

You can send either one or both fields.

At least one field has to be provided.

Other fields are rejected because editing title/description/email wasn't part of the requirement.

After update, the API returns the updated ticket and Prisma automatically updates `updatedAt`.

## Frontend

The dashboard shows summary cards first and then the ticket list.

Desktop uses a table layout while mobile switches to cards because the table becomes hard to use on smaller screens.

Search input is debounced so an API request isn't sent after every single key press immediately.

Search, status, priority and sort can all be used together.

When any of them changes, page is reset back to `1`.

Otherwise it was possible to be on something like page 3, apply a filter with only one page of results and get an empty screen.

## Create Ticket Form

The create form uses React Hook Form with Zod.

Validation errors are shown under the fields.

Frontend validation is mainly for better UX. The backend validates the request again because frontend validation can always be bypassed.

Backend validation errors are also mapped back to the form when possible.

## Ticket Details

Each ticket has its own page:

```text
/tickets/[id]
```

From there status and priority can be changed.

After clicking **Save Changes**, the frontend sends a PATCH request.

A success/error toast is shown depending on the result.

The changes are stored in PostgreSQL so refreshing the page doesn't reset anything.

## Loading and Error Handling

I added basic states for API requests.

While loading, the UI shows a loading state.

If no tickets match:

```text
No tickets found.
```

If loading fails:

```text
Unable to load tickets.
```

There is also a Retry option instead of requiring a full page refresh.

## Pagination

Pagination happens on backend.

The frontend only requests the page it currently needs.

Example:

```text
?page=2&limit=10
```

Results are ordered by `createdAt` and then `id`.

The second sort is mainly there so if two tickets have exactly same creation time the pagination order is still consistent.

## Validation

Zod is used for backend validation for:

- create ticket body
- update body
- ticket UUID
- status
- priority
- pagination
- sort
- query parameters

The frontend also uses Zod for the create form.

Backend validation is still treated as the final validation.

## Testing

Run tests with:

```bash
npm test
```

There are 25 API tests written with Vitest and Supertest.

Tests run against `TEST_DATABASE_URL`.

Before running them, Prisma migrations are applied to the test database.

The test setup also checks that:

```text
TEST_DATABASE_URL != DATABASE_URL
```

and the test database name must end with:

```text
_test
```

This is just a safety check because the tests reset data and I didn't want it touching my normal dev database by mistake.

Tests cover things like:

- creating tickets
- empty title
- title longer than allowed
- empty description
- invalid email
- invalid status
- invalid priority
- malformed JSON
- default OPEN status
- status filters
- priority filters
- combined filters
- search by title
- search by email
- case insensitive search
- search + filters
- newest sorting
- oldest sorting
- invalid query params
- pagination metadata
- pagination last page
- no duplicate tickets between pages
- getting single ticket
- invalid UUID
- ticket not found
- updating tickets
- update persistence
- summary counts

## Screenshots

Screenshots are inside:

```text
docs/screenshots/
```

Files:

| Screenshot | What it shows |
|---|---|
| `01-dashboard.png` | Main dashboard |
| `02-search-filters.png` | Search and filters |
| `03-pagination.png` | Second page |
| `04-create-ticket.png` | Create ticket form |
| `05-ticket-details.png` | Ticket details/edit |
| `06-mobile.png` | Mobile version |

I took the screenshots after running the app and adding the seed data.

## Why I used these technologies

### Next.js

Mainly because routing is straightforward with App Router and it works nicely with TypeScript and Tailwind.

I only needed the dashboard route and dynamic ticket details route so Next.js was enough for this.

### Express

I kept Express separate from Next.js instead of putting the API inside Next.

This makes frontend/backend responsibilities more clear and also made the API easier to test independently.

### PostgreSQL

The data is structured and relational, so PostgreSQL made sense here.

It also handles the filtering and sorting queries without needing anything extra.

Search currently uses case-insensitive `ILIKE`.

### Prisma

Used Prisma mainly for typed database queries and migrations.

The project uses Prisma 6 with the `pg` driver adapter and `engineType = "client"`.

### Zod

Used Zod for validating API inputs.

I also used it with React Hook Form on frontend so validation rules are easier to manage.

### Frontend State

I didn't add Redux/Zustand or another state library.

For this size of project normal React state with a small `useAsync` hook was enough.

The hook handles fetching, loading, errors, aborting requests and reload.

## Extending it

If I had to add another ticket field, the main places to update would be:

```text
Prisma schema
backend validator
frontend ticket type
frontend form schema
create ticket form
```

Then a Prisma migration would be required.

For another filter:

```text
list query validator
ticket service
frontend API params
TicketFilters
dashboard state
```

New status or priority values would need updates in the Prisma enums, backend Zod enums and frontend constants/types.

## Assumptions

A few assumptions I made while building it:

- No authentication was required.
- It's a single support team, not multi-tenant.
- Search is substring based.
- Status and priority are the only editable fields after creating a ticket.
- Maximum API page size is 50.

## Things I would improve

There are few things I would add if this was going further than the assignment.

Authentication would be the first one because currently anyone who can access the API can create/update tickets.

There is also no delete functionality right now.

Search uses `ILIKE`, which is totally fine for 30 tickets and smaller datasets. For a much bigger dataset I would probably use PostgreSQL trigram indexes or full-text search.

Frontend automated tests are also missing. Currently the automated test coverage is mainly focused on the backend API.

Another issue is concurrent editing. If two people update the same ticket, the last update wins. I didn't add versioning/optimistic locking for this assignment.

## Time Spent

Approx time:

```text
Setup       - 1 hour
Backend     - 2 hours
Frontend    - 2 hours
Tests       - 1 hour
README/docs - around 30 mins
```
