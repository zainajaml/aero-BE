import type { TicketSummary } from "@/features/tickets/api/tickets.api";
import type { TicketAssignee } from "@/features/tickets/components/ticket-card";

/** A ticket as the board renders it: the summary plus the assignee card for TicketCard. */
export type BoardTicket = TicketSummary & { assignee: TicketAssignee | null };

export type SortKey = "manual" | "default" | "epic" | "priority" | "number" | "name";

export const SORT_OPTIONS: { value: SortKey; label: string; hint?: string }[] = [
  { value: "manual", label: "Manual", hint: "Drag tickets to reorder" },
  { value: "default", label: "Created" },
  { value: "epic", label: "Epic" },
  { value: "priority", label: "Priority" },
  { value: "number", label: "Ticket number" },
  { value: "name", label: "Ticket name" },
];

export const TICKET_TYPES = ["task", "bug", "story", "epic"] as const;
export const TICKET_PRIORITIES = ["urgent", "high", "medium", "low"];

export interface BoardFilters {
  search: string;
  stages: string[];
  types: string[];
  priorities: string[];
  reporters: string[];
}

export const EMPTY_BOARD_FILTERS: BoardFilters = {
  search: "",
  stages: [],
  types: [],
  priorities: [],
  reporters: [],
};
