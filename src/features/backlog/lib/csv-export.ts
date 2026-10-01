import { formatDHM } from "@/shared/lib/format";
import type { BacklogColumn, BacklogTicket } from "./backlog-types";
import { orderManualTickets } from "./ticket-sort";

export interface CsvContext {
  formatDateTime: (value: string) => string;
  columnMap: Map<string, BacklogColumn>;
  backlogColumn: BacklogColumn | undefined;
  epicNamesByTicket: Map<string, string[]>;
  assigneeName: (userId: string) => string;
  ticketCost: (ticketId: string) => number;
}

const csvEscape = (v: string): string => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** Downloads the tickets of one sprint (or the backlog) as CSV. */
export function exportTicketsCsv(name: string, items: BacklogTicket[], ctx: CsvContext) {
  const header = [
    "Created",
    "Title",
    "Type",
    "Priority",
    "Epic",
    "Stage",
    "Estimated time",
    "Estimated cost (USD)",
    "Logged",
    "Assigned",
  ];
  const rows: string[][] = [header];
  for (const t of orderManualTickets(items)) {
    const col = t.columnId ? ctx.columnMap.get(t.columnId) : ctx.backlogColumn;
    rows.push([
      ctx.formatDateTime(t.createdAt),
      t.title,
      t.type,
      t.priority,
      (ctx.epicNamesByTicket.get(t.id) ?? []).join("; "),
      col?.name ?? "",
      formatDHM(t.estimateMinutes),
      ctx.ticketCost(t.id).toFixed(2),
      formatDHM(t.loggedMinutes ?? 0),
      t.assigneeId ? ctx.assigneeName(t.assigneeId) : "",
    ]);
  }
  const csv = rows.map((r) => r.map((c) => csvEscape(String(c ?? ""))).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name.toLowerCase().replace(/\s+/g, "-")}-tickets-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
