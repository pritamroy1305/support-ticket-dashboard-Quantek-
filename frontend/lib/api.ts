import type {
  ApiErrorDetail,
  ApiResponse,
  CreateTicketPayload,
  Ticket,
  TicketListData,
  TicketListParams,
  TicketSummary,
  UpdateTicketPayload,
} from "@/types/ticket";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details: ApiErrorDetail[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** The only place that calls fetch. Unwraps the { success, data } envelope or throws ApiError. */
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init.headers },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError("Unable to reach the server", 0);
  }

  let body: ApiResponse<T> | null = null;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    // non-JSON response
  }

  if (!body || !body.success) {
    const failure = body && !body.success ? body.error : null;
    throw new ApiError(failure?.message ?? `Request failed (${res.status})`, res.status, failure?.details);
  }
  return body.data;
}

export function listTickets(params: TicketListParams, signal?: AbortSignal): Promise<TicketListData> {
  const query = new URLSearchParams();
  if (params.search.trim()) query.set("search", params.search.trim());
  if (params.status) query.set("status", params.status);
  if (params.priority) query.set("priority", params.priority);
  query.set("sort", params.sort);
  query.set("page", String(params.page));
  query.set("limit", String(params.limit));
  return request<TicketListData>(`/api/tickets?${query.toString()}`, { signal });
}

export function getSummary(signal?: AbortSignal): Promise<TicketSummary> {
  return request<TicketSummary>("/api/tickets/summary", { signal });
}

export function getTicket(id: string, signal?: AbortSignal): Promise<Ticket> {
  return request<Ticket>(`/api/tickets/${encodeURIComponent(id)}`, { signal });
}

export function createTicket(payload: CreateTicketPayload): Promise<Ticket> {
  return request<Ticket>("/api/tickets", { method: "POST", body: JSON.stringify(payload) });
}

export function updateTicket(id: string, payload: UpdateTicketPayload): Promise<Ticket> {
  return request<Ticket>(`/api/tickets/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(payload) });
}
