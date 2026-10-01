import type { SprintReportRow, TicketReportRow } from "../api/reporting.api";

export function csvEscape(v: string): string {
  if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

/** Release-note verb for a ticket type. */
export function typeAction(type: string) {
  if (type === "bug") return "Fixed";
  if (type === "task" || type === "story") return "Added";
  return "Shipped";
}

/** Builds the release-notes CSV (same columns and escaping as the original page). */
export function buildReleaseCsv(
  sprintList: SprintReportRow[],
  ticketsBySprint: Record<string, TicketReportRow[]>,
  formatEndDate: (iso: string) => string,
): string {
  const header = ["Date", "Ticket ID", "Type", "Description", "Sprint"];
  const rows: string[][] = [header];
  for (const sprint of sprintList) {
    const date = sprint.endsAt ? formatEndDate(sprint.endsAt) : "";
    const tickets = ticketsBySprint[sprint.id] ?? [];
    for (const t of tickets) {
      rows.push([date, t.code, t.type, t.title, sprint.name]);
    }
  }
  return rows.map((r) => r.map((c) => csvEscape(String(c ?? ""))).join(",")).join("\n");
}

export function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const today = () => new Date().toISOString().slice(0, 10);

export const allReleaseNotesFilename = () => `release-notes-all-${today()}.csv`;

export const sprintReleaseNotesFilename = (sprintName: string) =>
  `release-notes-${sprintName.toLowerCase().replace(/\s+/g, "-")}-${today()}.csv`;
