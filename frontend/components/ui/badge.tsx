import type { Priority, Status } from "@/types/ticket";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const base = "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset";

const statusStyles: Record<Status, string> = {
  OPEN: "bg-blue-50 text-blue-700 ring-blue-200",
  IN_PROGRESS: "bg-amber-50 text-amber-700 ring-amber-200",
  RESOLVED: "bg-green-50 text-green-700 ring-green-200",
};

const priorityStyles: Record<Priority, string> = {
  LOW: "bg-slate-100 text-slate-700 ring-slate-200",
  MEDIUM: "bg-orange-50 text-orange-700 ring-orange-200",
  HIGH: "bg-red-50 text-red-700 ring-red-200",
};

export function StatusBadge({ status }: { status: Status }) {
  return <span className={cn(base, statusStyles[status])}>{STATUS_LABELS[status]}</span>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={cn(base, priorityStyles[priority])}>{PRIORITY_LABELS[priority]}</span>;
}
