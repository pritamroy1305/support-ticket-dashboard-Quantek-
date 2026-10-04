// Mirrors the backend API contract (backend/src/types/ticket.ts + Prisma enums).
export const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
export const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED"] as const;
export const SORT_OPTIONS = ["newest", "oldest"] as const;

export type Priority = (typeof PRIORITIES)[number];
export type Status = (typeof STATUSES)[number];
export type SortOption = (typeof SORT_OPTIONS)[number];

export interface Ticket {
  id: string;
  title: string;
  description: string;
  customerEmail: string;
  priority: Priority;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TicketListData {
  tickets: Ticket[];
  pagination: Pagination;
}

export interface TicketSummary {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
}

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  error: { message: string; details?: ApiErrorDetail[] };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface TicketListParams {
  search: string;
  status: Status | "";
  priority: Priority | "";
  sort: SortOption;
  page: number;
  limit: number;
}

export interface CreateTicketPayload {
  title: string;
  description: string;
  customerEmail: string;
  priority: Priority;
  status: Status;
}

export interface UpdateTicketPayload {
  status?: Status;
  priority?: Priority;
}
