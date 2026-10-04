import type { ApiError } from "@/lib/api";
import type { TicketSummary } from "@/types/ticket";
import { cn } from "@/lib/utils";

interface SummaryCardsProps {
  summary: TicketSummary | null;
  loading: boolean;
  error: ApiError | null;
  onRetry: () => void;
}

export function SummaryCards({ summary, loading, error, onRetry }: SummaryCardsProps) {
  const cards = [
    { label: "Total Tickets", value: summary?.total, accent: "text-slate-900" },
    { label: "Open", value: summary?.open, accent: "text-blue-600" },
    { label: "In Progress", value: summary?.inProgress, accent: "text-amber-600" },
    { label: "Resolved", value: summary?.resolved, accent: "text-green-600" },
  ];

  return (
    <section aria-label="Ticket summary">
      {error && (
        <p role="alert" className="mb-2 text-sm text-red-600">
          Unable to load summary.{" "}
          <button className="font-medium underline" onClick={onRetry}>
            Retry
          </button>
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className={cn("mt-1 text-3xl font-semibold tabular-nums", card.accent)}>
              {loading && !summary ? <span className="inline-block h-8 w-12 animate-pulse rounded bg-slate-100" /> : (card.value ?? "-")}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
