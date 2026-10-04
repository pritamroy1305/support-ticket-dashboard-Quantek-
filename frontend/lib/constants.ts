import type { Priority, Status } from "@/types/ticket";

export const PAGE_SIZE = 10;

export const STATUS_LABELS: Record<Status, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};
