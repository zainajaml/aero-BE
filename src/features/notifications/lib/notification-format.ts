import type { NotificationRow } from "../api/notifications.api";

export const PAGE_SIZES = [50, 100, 200] as const;

export type SortKey =
  "createdAt" | "type" | "ticket" | "title" | "createdBy" | "details" | "status";
export type SortDir = "asc" | "desc";

/** Human-readable label from a template name, e.g. "comment-mention" → "Comment Mention". */
export function humanizeTemplate(name: string) {
  return name.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export const FAILED_STATUSES = new Set(["dlq", "failed", "bounced", "complained"]);

/** Delivery outcome shown to admins, collapsed into four plain-language states. */
export function statusMeta(status: string) {
  const s = (status || "").toLowerCase();
  if (FAILED_STATUSES.has(s)) {
    return {
      label: s === "bounced" ? "Bounced" : s === "complained" ? "Complained" : "Failed",
      tone: "border-destructive/40 bg-destructive/10 text-destructive",
      failed: true,
    };
  }
  if (s === "suppressed") {
    return {
      label: "Suppressed",
      tone: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
      failed: false,
    };
  }
  if (s === "sent") {
    return {
      label: "Sent",
      tone: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      failed: false,
    };
  }
  return {
    label: "Queued",
    tone: "border-border bg-muted text-muted-foreground",
    failed: false,
  };
}

/** Rank used when sorting by status: problems first. */
function statusRank(status: string) {
  const s = (status || "").toLowerCase();
  if (FAILED_STATUSES.has(s)) return 0;
  if (s === "suppressed") return 1;
  if (s === "sent") return 3;
  return 2;
}

/** "Details" column text: invitations read "<email> was invited", otherwise the subject. */
export function detailsText(row: Pick<NotificationRow, "templateName" | "recipient" | "subject">) {
  if (row.templateName === "invite") return `${row.recipient} was invited`;
  return row.subject?.trim() || null;
}

/** Sorts the rows of the current page (the server always returns newest first). */
export function sortRows(rows: NotificationRow[], key: SortKey, dirName: SortDir) {
  const dir = dirName === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (key === "createdAt")
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
    if (key === "type")
      return humanizeTemplate(a.templateName).localeCompare(humanizeTemplate(b.templateName)) * dir;
    if (key === "ticket") return (a.ticketCode ?? "").localeCompare(b.ticketCode ?? "") * dir;
    if (key === "title") return (a.ticketTitle ?? "").localeCompare(b.ticketTitle ?? "") * dir;
    if (key === "details") return (detailsText(a) ?? "").localeCompare(detailsText(b) ?? "") * dir;
    if (key === "status") return (statusRank(a.status) - statusRank(b.status)) * dir;
    return (a.author ?? "").localeCompare(b.author ?? "") * dir;
  });
}
