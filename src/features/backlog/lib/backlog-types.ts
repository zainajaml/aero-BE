import type { TicketSummary } from "@/features/tickets/api/tickets.api";
import type { BoardColumn, Sprint } from "@/features/tickets/api/planning.api";

export type BacklogTicket = TicketSummary;
export type BacklogSprint = Sprint;
export type BacklogColumn = BoardColumn;

export type SortKey =
  "default" | "manual" | "epic" | "priority" | "complexity" | "number" | "name" | "stage";

export type SortDir = "asc" | "desc";

export const SORT_OPTIONS: { value: SortKey; label: string; hint?: string }[] = [
  { value: "manual", label: "Manual", hint: "Drag tickets to reorder" },
  { value: "default", label: "Created" },
  { value: "epic", label: "Epic" },
  { value: "priority", label: "Priority" },
  { value: "complexity", label: "Complexity" },
  { value: "number", label: "Ticket number" },
  { value: "name", label: "Ticket name" },
  { value: "stage", label: "Stage" },
];

/** Matches the space-y-3 gap between sprint panels. */
export const SPRINT_GAP = 12;

/** Height of one ticket row (incl. gap), used for the live drag preview offset. */
export const ROW_PREVIEW_HEIGHT = 56;

/** Tickets can never be assigned into a sprint that has already been completed. */
export const COMPLETED_SPRINT_MSG = "You cannot assign tickets to completed sprints";
