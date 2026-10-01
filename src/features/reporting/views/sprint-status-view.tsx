import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FileDown, Mail, Search } from "lucide-react";
import { useProjects } from "@/features/projects/project-context";
import { GlassPanel } from "@/shared/ui/glass/glass-panel";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { PILL_BUTTON } from "@/shared/lib/cta";
import { TicketDialogSlot } from "@/shared/ui/ticket-dialog-slot";
import type { RagRow } from "../api/reporting.api";
import { RagDot, type RagSort, type RagSortKey } from "../components/sprint-status/rag-parts";
import { RagTable } from "../components/sprint-status/rag-table";
import { useSprintStatus } from "../hooks/use-sprint-status";
import { downloadRagPdf, shareRagByEmail } from "../lib/rag-export";

const STATUS_ORDER = { red: 0, orange: 1, green: 2 } as const;

function compareRows(key: RagSortKey) {
  return (a: RagRow, b: RagRow): number => {
    switch (key) {
      case "title":
        return a.title.localeCompare(b.title);
      case "budget":
        return (a.estimateMinutes ? a.pctSpent : -1) - (b.estimateMinutes ? b.pctSpent : -1);
      case "status":
        return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      case "state":
        return a.stageName.localeCompare(b.stageName);
      case "comments":
        return a.commentCount - b.commentCount;
      default:
        return 0;
    }
  };
}

export function SprintStatusView() {
  const { activeProject } = useProjects();
  const [openTicket, setOpenTicket] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<RagSort>({ key: "status", dir: "asc" });

  const {
    rows,
    sprintName: activeSprintName,
    commentsByTicket,
    summaries,
    summariesLoading,
  } = useSprintStatus(activeProject?.id);

  const toggleSort = (key: RagSortKey) =>
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" },
    );

  const sortedRows = useMemo(() => {
    const sorted = [...rows].sort(compareRows(sort.key));
    return sort.dir === "desc" ? sorted.reverse() : sorted;
  }, [rows, sort]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sortedRows;
    return sortedRows.filter((r) =>
      [r.code, r.title, r.stageName, r.status].some((v) => (v ?? "").toLowerCase().includes(q)),
    );
  }, [sortedRows, search]);

  const sprintName = activeSprintName ?? "Active sprint";
  const reportTitle = `RAG Status Report — ${activeProject?.name ?? ""}`;

  const handleDownloadPdf = () =>
    downloadRagPdf({
      rows,
      reportTitle,
      sprintName,
      projectKey: activeProject?.key,
      summaries,
      commentsByTicket,
    });

  const handleShareEmail = () => shareRagByEmail(rows, reportTitle, sprintName);

  if (!activeProject) {
    return (
      <div className="space-y-6">
        <GlassPanel className="p-6">
          <h1 className="font-display text-2xl font-semibold tracking-tight">RAG Status</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pick or create a project to see sprint health.
          </p>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight">
                RAG Status Report
              </h2>
              <p className="text-sm text-muted-foreground">
                {activeSprintName ? (
                  <>
                    Health of every task in{" "}
                    <span className="text-foreground">{activeSprintName}</span>.
                  </>
                ) : (
                  "No active sprint."
                )}
              </p>
            </div>
          </div>

          {rows.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">No tasks in the active sprint yet.</p>
          ) : (
            <>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search tickets..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="mr-auto flex items-center gap-3 text-xs">
                  {(["green", "orange", "red"] as const).map((s) => (
                    <span key={s} className="flex items-center gap-1.5">
                      <RagDot status={s} />
                      <span className="text-muted-foreground capitalize">
                        {s} · {rows.filter((r) => r.status === s).length}
                      </span>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className={"gap-1.5 " + PILL_BUTTON}
                    onClick={() => void handleDownloadPdf()}
                    disabled={rows.length === 0}
                  >
                    <FileDown className="h-4 w-4" />
                    Download as PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className={"gap-1.5 " + PILL_BUTTON}
                    onClick={handleShareEmail}
                    disabled={rows.length === 0}
                  >
                    <Mail className="h-4 w-4" />
                    Share via email
                  </Button>
                </div>
              </div>
              <RagTable
                rows={filteredRows}
                sort={sort}
                onSort={toggleSort}
                summaries={summaries}
                summariesLoading={summariesLoading}
                commentsByTicket={commentsByTicket}
                onOpenTicket={setOpenTicket}
              />
            </>
          )}
        </div>
      </motion.div>

      <TicketDialogSlot
        ticketId={openTicket}
        open={!!openTicket}
        onOpenChange={(o) => !o && setOpenTicket(null)}
      />
    </div>
  );
}
