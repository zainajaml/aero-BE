import { Download } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { formatHM } from "@/shared/lib/format";
import type { WorkLogPanelState } from "../../hooks/use-work-log-panel";
import {
  buildSummaryCsv,
  buildTicketsWorkedCsv,
  buildWorkLogEntriesCsv,
  downloadCsv,
  exportFilename,
  type ExportContext,
  type ExportTicket,
} from "../../lib/work-log-export";
import { DAY_MS } from "../../lib/work-log-range";

type ExportKind = "entries" | "tickets" | "summary";

const OPTIONS = [
  {
    key: "entries",
    title: "Work log entries",
    hint: "One row per logged entry, with note and ticket details",
  },
  {
    key: "tickets",
    title: "Tickets worked on",
    hint: "Every ticket with logged hours, whoever it is assigned to",
  },
  { key: "summary", title: "Summary", hint: "Totals per day, project and person" },
] as const;

function exportContext(s: WorkLogPanelState): ExportContext {
  const { tz, range } = s;
  const ticketById = new Map<string, ExportTicket>();
  for (const t of s.tickets) {
    const row = s.buildRow(t);
    ticketById.set(t.id, {
      id: t.id,
      code: row.code,
      title: row.title,
      type: row.type,
      priority: row.priority,
      project: row.project,
      sprint: row.sprint,
      stage: row.stage ?? "No stage",
      stageDone: Boolean(row.stageDone),
      assignee: row.assignee,
      dueDate: row.dueDate ?? null,
      updatedAt: row.updatedAt ?? null,
      url: `${typeof window === "undefined" ? "" : window.location.origin}/ticket/${t.id}`,
    });
  }
  const iso = (ms: number) =>
    tz.formatDate(ms, { year: "numeric", month: "2-digit", day: "2-digit" });
  return {
    rangeLabel: s.rangeLabel,
    fromDate: iso(range.from),
    toDate: iso(range.to - DAY_MS),
    projectScopeLabel: s.scopeLabel,
    peopleLabel: s.peopleLabel,
    nameFor: s.nameFor,
    ticketById,
    formatDateTime: (v: string) => tz.formatDateTime(v),
    formatDate: (v: string) =>
      tz.formatDate(new Date(v).getTime(), { year: "numeric", month: "short", day: "numeric" }),
  };
}

/**
 * Exports every work log entry the selected people recorded inside the selected range, plus every
 * ticket those hours landed on — regardless of who the ticket is assigned to.
 */
export function WorkLogExportMenu({ s }: { s: WorkLogPanelState }) {
  const runExport = (kind: ExportKind) => {
    const ctx = exportContext(s);
    const { fromDate, toDate } = ctx;
    // Single person in scope -> file named after them; multiple -> date range.
    const personName =
      s.resourceIds.length === 0
        ? s.selfName
        : s.resourceIds.length === 1
          ? s.nameFor(s.resourceIds[0])
          : null;
    if (kind === "entries") {
      downloadCsv(
        exportFilename("entries", fromDate, toDate, personName),
        buildWorkLogEntriesCsv(s.rangeLogs, ctx),
      );
      return;
    }
    if (kind === "tickets") {
      downloadCsv(
        exportFilename("tickets", fromDate, toDate, personName),
        buildTicketsWorkedCsv(s.rangeLogs, ctx),
      );
      return;
    }
    downloadCsv(
      exportFilename("summary", fromDate, toDate, personName),
      buildSummaryCsv(s.rangeLogs, ctx, s.perDay, (day) =>
        s.tz.formatDate(day, { year: "numeric", month: "short", day: "numeric", weekday: "short" }),
      ),
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto h-8 gap-1.5 rounded-full text-xs font-normal disabled:opacity-100 disabled:cursor-not-allowed"
          disabled={s.loading || s.rangeLogs.length === 0}
          title={s.rangeLogs.length === 0 ? "No time logged in this range" : "Export work log"}
        >
          <Download className="h-3 w-3 opacity-70" />
          Export
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="end">
        <p className="px-2 pb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {s.rangeLabel} · {formatHM(s.totalMinutes)}
        </p>
        {OPTIONS.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => runExport(o.key)}
            className="w-full rounded-md px-2 py-1.5 text-left hover:bg-accent/60"
          >
            <span className="block text-xs font-medium">{o.title}</span>
            <span className="block text-[11px] text-muted-foreground">{o.hint}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
