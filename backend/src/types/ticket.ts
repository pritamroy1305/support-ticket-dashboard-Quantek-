import type { Priority, Status, Ticket } from "@prisma/client";

export type { Priority, Status, Ticket };

export type SortOption = "newest" | "oldest";

export interface ListTicketsQuery {
  search?: string;
  status?: Status;
  priority?: Priority;
  sort: SortOption;
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TicketSummary {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
}

export interface ErrorDetail {
  field: string;
  message: string;
}
