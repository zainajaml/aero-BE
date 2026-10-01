/**
 * CSV export for My Work Log.
 *
 * Two Jira-style exports:
 *  - Work log entries: one row per logged entry (the "worklog" report).
 *  - Tickets worked on: one row per ticket that received time in the range,
 *    regardless of who the ticket is assigned to.
 */
import { formatHM } from "@/shared/lib/format";

const csvEscape = (v: unknown): string => {
  const s = String(v ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function downloadCsv(filename: string, rows: (string | number)[][]): void {
  const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface ExportLog {
  id: string;
  userId: string;
  ticketId: string;
  loggedAt: string;
  minutes: number | null;
  note?: string | null;
  resourceType?: string | null;
}

export interface ExportTicket {
  id: string;
  code: string;
  title: string;
  type: string;
  priority: string;
  project: string;
  sprint: string;
  stage: string;
  stageDone: boolean;
  assignee: string;
  dueDate: string | null;
  updatedAt: string | null;
  url: string;
}

export interface ExportContext {
  /** Human label of the exported date range. */
  rangeLabel: string;
  /** ISO dates (yyyy-mm-dd) of the range bounds, inclusive. */
  fromDate: string;
  toDate: string;
  projectScopeLabel: string;
  peopleLabel: string;
  nameFor: (userId: string) => string;
  ticketById: Map<string, ExportTicket>;
  /** Formats an epoch ms / ISO timestamp in the user's active timezone. */
  formatDateTime: (value: string) => string;
  formatDate: (value: string) => string;
}

const metaRows = (ctx: ExportContext, title: string): (string | number)[][] => [
  [title],
  ["Date range", `${ctx.fromDate} to ${ctx.toDate}`, ctx.rangeLabel],
  ["Projects", ctx.projectScopeLabel],
  ["People", ctx.peopleLabel],
  ["Generated", new Date().toISOString()],
  [],
];

/** One row per work log entry, grouped per person with per-person totals. */
export function buildWorkLogEntriesCsv(
  logs: ExportLog[],
  ctx: ExportContext,
): (string | number)[][] {
  const rows: (string | number)[][] = metaRows(ctx, "SpaceScope — work log entries");
  rows.push([
    "Ticket key",
    "Ticket title",
    "Assignee",
    "Logged by",
    "Time logged",
    "Hours",
  ]);

  const byPerson = new Map<string, ExportLog[]>();
  for (const l of logs) {
    const list = byPerson.get(l.userId) ?? [];
    list.push(l);
    byPerson.set(l.userId, list);
  }

  const grandTotals: [string, number][] = [];
  for (const [userId, personLogs] of byPerson.entries()) {
    const personName = ctx.nameFor(userId);
    rows.push([]);
    rows.push([personName]);
    let personTotal = 0;
    const sorted = [...personLogs].sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
    for (const l of sorted) {
      const t = ctx.ticketById.get(l.ticketId);
      const minutes = l.minutes ?? 0;
      personTotal += minutes;
      rows.push([
        t?.code ?? "",
        t?.title ?? "",
        t?.assignee ?? "",
        personName,
        formatHM(minutes),
        (minutes / 60).toFixed(2),
      ]);
    }
    rows.push(["Total", "", "", personName, formatHM(personTotal), (personTotal / 60).toFixed(2)]);
    grandTotals.push([personName, personTotal]);
  }

  rows.push([]);
  rows.push(["Totals per person"]);
  for (const [name, m] of grandTotals) {
    rows.push(["", "", "", name, formatHM(m), (m / 60).toFixed(2)]);
  }
  return rows;
}

/** Per person: one row per ticket that person logged time on, with per-person totals. */
export function buildTicketsWorkedCsv(
  logs: ExportLog[],
  ctx: ExportContext,
): (string | number)[][] {
  // ticketId -> userId -> minutes
  const byPerson = new Map<string, Map<string, number>>();
  for (const l of logs) {
    const perTicket = byPerson.get(l.userId) ?? new Map<string, number>();
    perTicket.set(l.ticketId, (perTicket.get(l.ticketId) ?? 0) + (l.minutes ?? 0));
    byPerson.set(l.userId, perTicket);
  }

  const rows: (string | number)[][] = metaRows(ctx, "SpaceScope — tickets worked on");
  rows.push([
    "Ticket key",
    "Ticket title",
    "Assignee",
    "Logged by",
    "Time logged",
    "Hours",
  ]);

  const grandTotals: [string, number][] = [];
  for (const [userId, perTicket] of byPerson.entries()) {
    const personName = ctx.nameFor(userId);
    rows.push([]);
    rows.push([personName]);
    let personTotal = 0;
    const ordered = Array.from(perTicket.entries()).sort((a, b) => b[1] - a[1]);
    for (const [ticketId, minutes] of ordered) {
      const t = ctx.ticketById.get(ticketId);
      personTotal += minutes;
      rows.push([
        t?.code ?? "",
        t?.title ?? "",
        t?.assignee ?? "",
        personName,
        formatHM(minutes),
        (minutes / 60).toFixed(2),
      ]);
    }
    rows.push(["Total", "", "", personName, formatHM(personTotal), (personTotal / 60).toFixed(2)]);
    grandTotals.push([personName, personTotal]);
  }

  rows.push([]);
  rows.push(["Totals per person"]);
  for (const [name, m] of grandTotals) {
    rows.push(["", "", "", name, formatHM(m), (m / 60).toFixed(2)]);
  }
  return rows;
}

/** Per-day and per-project and per-person summary, in one file. */
export function buildSummaryCsv(
  logs: ExportLog[],
  ctx: ExportContext,
  perDay: { day: number; minutes: number }[],
  formatDay: (day: number) => string,
): (string | number)[][] {
  const rows: (string | number)[][] = metaRows(ctx, "SpaceScope — work log summary");

  rows.push(["Per day"]);
  rows.push(["Date", "Time logged", "Hours"]);
  for (const d of perDay) {
    rows.push([formatDay(d.day), formatHM(d.minutes), (d.minutes / 60).toFixed(2)]);
  }
  rows.push([]);

  const byProject = new Map<string, number>();
  const byPerson = new Map<string, number>();
  for (const l of logs) {
    const p = ctx.ticketById.get(l.ticketId)?.project ?? "Unknown project";
    byProject.set(p, (byProject.get(p) ?? 0) + (l.minutes ?? 0));
    byPerson.set(l.userId, (byPerson.get(l.userId) ?? 0) + (l.minutes ?? 0));
  }

  rows.push(["Per project"]);
  rows.push(["Project", "Time logged", "Hours"]);
  for (const [name, m] of Array.from(byProject.entries()).sort((a, b) => b[1] - a[1])) {
    rows.push([name, formatHM(m), (m / 60).toFixed(2)]);
  }
  rows.push([]);

  rows.push(["Per person"]);
  rows.push(["Person", "Time logged", "Hours"]);
  for (const [uid, m] of Array.from(byPerson.entries()).sort((a, b) => b[1] - a[1])) {
    rows.push([ctx.nameFor(uid), formatHM(m), (m / 60).toFixed(2)]);
  }

  return rows;
}

/**
 * File name: named after the single person in scope when exactly one person
 * is selected; when multiple people are in scope, named by the date range.
 */
export const exportFilename = (
  kind: string,
  fromDate: string,
  toDate: string,
  personName?: string | null,
): string => {
  const datePart = `${fromDate}_to_${toDate}`;
  const personPart = personName
    ? personName.trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "")
    : "";
  return personPart
    ? `work-log-${personPart}-${kind}-${datePart}.csv`
    : `work-log-${kind}-${datePart}.csv`;
};
