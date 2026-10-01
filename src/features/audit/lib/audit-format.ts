import type { AuditLogRow, AuditSort } from "../api/audit.api";

export const PAGE_SIZES = [50, 100, 200] as const;

export type SortKey =
  "created_at" | "account" | "project" | "user" | "action" | "table_name" | "field" | "value";
export type SortDir = "asc" | "desc";

/** UI column → server sort key (names are resolved and sorted server-side). */
export const SORT_PARAM: Record<SortKey, AuditSort> = {
  created_at: "createdAt",
  account: "account",
  project: "project",
  user: "user",
  action: "action",
  table_name: "table",
  field: "field",
  value: "value",
};

// Normalize stored action values to a single, consistent past-tense label.
const ACTION_LABEL: Record<string, string> = {
  create: "Created",
  created: "Created",
  insert: "Created",
  read: "Read",
  update: "Updated",
  updated: "Updated",
  delete: "Deleted",
  deleted: "Deleted",
};

export function actionLabel(action: string) {
  return ACTION_LABEL[action.toLowerCase()] ?? action;
}

// Fallback in-app destination per data table, used when a row has no explicit link.
const TABLE_ROUTE: Record<string, string> = {
  tickets: "/board",
  ticket_estimates: "/board",
  ticket_watchers: "/board",
  comments: "/board",
  attachments: "/board",
  work_logs: "/board",
  board_columns: "/board",
  sprints: "/backlog",
  projects: "/admin",
  project_members: "/admin",
  invitations: "/admin",
  user_roles: "/admin",
  profiles: "/dashboard",
};

export function destFor(row: AuditLogRow): string | null {
  if (row.link) return row.link;
  if (row.tableName && TABLE_ROUTE[row.tableName]) return TABLE_ROUTE[row.tableName]!;
  return null;
}
