"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { CreateTicketDialog } from "@/components/CreateTicketDialog";
import { Pagination } from "@/components/Pagination";
import { SummaryCards } from "@/components/SummaryCards";
import { TicketFilters } from "@/components/TicketFilters";
import { TicketTable } from "@/components/TicketTable";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Spinner } from "@/components/ui/feedback";
import { useAsync } from "@/hooks/useAsync";
import { useDebounce } from "@/hooks/useDebounce";
import { getSummary, listTickets } from "@/lib/api";
import { PAGE_SIZE } from "@/lib/constants";
import type { Priority, SortOption, Status } from "@/types/ticket";

export default function DashboardPage() {
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<Status | "">("");
  const [priority, setPriority] = useState<Priority | "">("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [showCreate, setShowCreate] = useState(false);

  const search = useDebounce(searchInput, 400);

  // The page number is only valid for the filters it was chosen under. When search, filters or
  // sorting change, the key changes and the page falls back to 1 - without an extra request.
  const filterKey = `${search}|${status}|${priority}|${sort}`;
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  const page = pageState.key === filterKey ? pageState.page : 1;
  const setPage = (next: number) => setPageState({ key: filterKey, page: next });

  const tickets = useAsync(
    (signal) => listTickets({ search, status, priority, sort, page, limit: PAGE_SIZE }, signal),
    [search, status, priority, sort, page],
  );
  // No filter inputs on purpose: the summary always covers the whole dataset.
  const summary = useAsync((signal) => getSummary(signal), []);

  const hasActiveFilters = Boolean(search.trim() || status || priority);

  function handleCreated() {
    setPage(1);
    tickets.reload();
    summary.reload();
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Support Ticket Dashboard</h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" aria-hidden />
          Create Ticket
        </Button>
      </header>

      <SummaryCards summary={summary.data} loading={summary.loading} error={summary.error} onRetry={summary.reload} />

      <section aria-label="Tickets" className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <TicketFilters
          search={searchInput}
          status={status}
          priority={priority}
          sort={sort}
          onSearchChange={setSearchInput}
          onStatusChange={setStatus}
          onPriorityChange={setPriority}
          onSortChange={setSort}
        />

        {tickets.loading && !tickets.data ? (
          <Spinner label="Loading tickets..." />
        ) : tickets.error && !tickets.data ? (
          <ErrorState message="Unable to load tickets." detail={tickets.error.message} onRetry={tickets.reload} />
        ) : tickets.data ? (
          <div className={tickets.loading ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={tickets.loading}>
            {tickets.error && (
              <p role="alert" className="border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">
                Unable to load tickets. {tickets.error.message}.{" "}
                <button className="font-medium underline" onClick={tickets.reload}>
                  Retry
                </button>
              </p>
            )}
            {tickets.data.tickets.length === 0 ? (
              <EmptyState
                message="No tickets found."
                hint={hasActiveFilters ? "Try changing your search or filters." : "Create a ticket to get started."}
              />
            ) : (
              <>
                <TicketTable tickets={tickets.data.tickets} />
                <Pagination pagination={tickets.data.pagination} onPageChange={setPage} />
              </>
            )}
          </div>
        ) : null}
      </section>

      {showCreate && <CreateTicketDialog onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
    </main>
  );
}
