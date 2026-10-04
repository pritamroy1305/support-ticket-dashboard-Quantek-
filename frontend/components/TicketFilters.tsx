import { PRIORITIES, SORT_OPTIONS, STATUSES, type Priority, type SortOption, type Status } from "@/types/ticket";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/constants";
import { Input, Select } from "./ui/field";

interface TicketFiltersProps {
  search: string;
  status: Status | "";
  priority: Priority | "";
  sort: SortOption;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: Status | "") => void;
  onPriorityChange: (value: Priority | "") => void;
  onSortChange: (value: SortOption) => void;
}

const SORT_LABELS: Record<SortOption, string> = { newest: "Newest first", oldest: "Oldest first" };

export function TicketFilters(props: TicketFiltersProps) {
  return (
    <div className="grid gap-3 border-b border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto]">
      <Input
        type="search"
        aria-label="Search tickets"
        placeholder="Search by title or customer email..."
        value={props.search}
        onChange={(event) => props.onSearchChange(event.target.value)}
        className="sm:col-span-2 lg:col-span-1"
      />
      <Select
        aria-label="Filter by status"
        value={props.status}
        onChange={(event) => props.onStatusChange(event.target.value as Status | "")}
      >
        <option value="">Status: All</option>
        {STATUSES.map((status) => (
          <option key={status} value={status}>
            {STATUS_LABELS[status]}
          </option>
        ))}
      </Select>
      <Select
        aria-label="Filter by priority"
        value={props.priority}
        onChange={(event) => props.onPriorityChange(event.target.value as Priority | "")}
      >
        <option value="">Priority: All</option>
        {PRIORITIES.map((priority) => (
          <option key={priority} value={priority}>
            {PRIORITY_LABELS[priority]}
          </option>
        ))}
      </Select>
      <Select aria-label="Sort tickets" value={props.sort} onChange={(event) => props.onSortChange(event.target.value as SortOption)}>
        {SORT_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {SORT_LABELS[option]}
          </option>
        ))}
      </Select>
    </div>
  );
}
