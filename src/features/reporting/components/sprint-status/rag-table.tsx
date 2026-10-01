import { Loader2, MessageSquare } from "lucide-react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/shared/ui/table";
import { formatHM } from "@/shared/lib/format";
import type { CommentSummary, RagRow, TicketComment } from "../../api/reporting.api";
import { commentPoints } from "../../lib/rag-text";
import {
  CommentSummaryBlock,
  NeonBadgeState,
  RagColGroup,
  RagDot,
  SortableHead,
  type RagSort,
  type RagSortKey,
} from "./rag-parts";

export function RagTable({
  rows,
  sort,
  onSort,
  summaries,
  summariesLoading,
  commentsByTicket,
  onOpenTicket,
}: {
  rows: RagRow[];
  sort: RagSort;
  onSort: (key: RagSortKey) => void;
  summaries: Record<string, CommentSummary | null>;
  summariesLoading: boolean;
  commentsByTicket: Record<string, TicketComment[]>;
  onOpenTicket: (id: string) => void;
}) {
  return (
    <div className="mt-3 flex min-h-0 flex-1 flex-col pb-1">
      <Table className="table-fixed">
        <RagColGroup />
        <TableHeader className="bg-transparent">
          <TableRow>
            <SortableHead label="Ticket" sortKey="title" sort={sort} onSort={onSort} />
            <SortableHead label="Time Budget" sortKey="budget" sort={sort} onSort={onSort} />
            <SortableHead label="Status" sortKey="status" sort={sort} onSort={onSort} />
            <SortableHead label="Sprint state" sortKey="state" sort={sort} onSort={onSort} />
            <SortableHead label="Comment summary" sortKey="comments" sort={sort} onSort={onSort} />
          </TableRow>
        </TableHeader>
      </Table>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Table className="table-fixed">
          <RagColGroup />
          <TableBody>
            {rows.map((r) => {
              const summary = summaries[r.ticketId];
              return (
                <TableRow key={r.ticketId}>
                  <TableCell className="align-top">
                    <button
                      type="button"
                      onClick={() => onOpenTicket(r.ticketId)}
                      className="text-left transition-colors"
                    >
                      <div className="font-mono text-[10px] uppercase text-muted-foreground">
                        {r.code}
                      </div>
                      <div className="font-medium">{r.title}</div>
                    </button>
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="font-mono text-sm tabular-nums">
                      {formatHM(r.loggedMinutes)} /{" "}
                      {r.estimateMinutes ? formatHM(r.estimateMinutes) : "—"}
                    </div>
                    {r.estimateMinutes ? (
                      <div
                        className={
                          r.pctSpent > 100
                            ? "font-semibold text-neon-rose"
                            : "font-semibold text-neon-lime"
                        }
                      >
                        {r.pctSpent}%
                      </div>
                    ) : (
                      <div className="text-muted-foreground">—</div>
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="flex items-center gap-2">
                      <RagDot status={r.status} />
                      <span className="capitalize text-muted-foreground">{r.status}</span>
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <NeonBadgeState colName={r.stageName} />
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {r.commentCount} comment{r.commentCount === 1 ? "" : "s"}
                    </div>
                    {r.commentCount === 0 ? (
                      <p className="mt-1 text-xs text-muted-foreground/60">No comments</p>
                    ) : summary ? (
                      <CommentSummaryBlock summary={summary} />
                    ) : summariesLoading ? (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground/60">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Summarising…
                      </div>
                    ) : (
                      <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground/80">
                        {commentPoints(commentsByTicket[r.ticketId] ?? []).map((p, i) => (
                          <li key={i} className="flex gap-1.5">
                            <span className="text-muted-foreground/50">•</span>
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
