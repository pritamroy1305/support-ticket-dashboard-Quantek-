import type { Pagination as PaginationMeta } from "@/types/ticket";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

/** Returns page numbers with gaps collapsed to null, e.g. [1, null, 4, 5, 6, null, 12]. */
function getPageItems(current: number, total: number): Array<number | null> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const items: Array<number | null> = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) items.push(null);
    items.push(page);
  });
  return items;
}

export function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { page, limit, total, totalPages } = pagination;
  if (total === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <nav aria-label="Pagination" className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 p-4 sm:flex-row">
      <p className="text-sm text-slate-500">
        Showing {from}-{to} of {total}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-1">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        {getPageItems(page, totalPages).map((item, index) =>
          item === null ? (
            <span key={`gap-${index}`} className="px-1 text-slate-400">
              ...
            </span>
          ) : (
            <Button
              key={item}
              size="sm"
              variant={item === page ? "primary" : "outline"}
              aria-current={item === page ? "page" : undefined}
              className={cn("min-w-8")}
              onClick={() => onPageChange(item)}
            >
              {item}
            </Button>
          ),
        )}
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </nav>
  );
}
