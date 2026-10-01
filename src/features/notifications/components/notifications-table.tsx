import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, RotateCcw, Ticket } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import type { NotificationRow } from "../api/notifications.api";
import {
  detailsText,
  humanizeTemplate,
  statusMeta,
  type SortDir,
  type SortKey,
} from "../lib/notification-format";

// table-fixed: these widths are the layout contract, so the sum must match the
// table's min-width (1120px) or columns start colliding on narrow viewports.
const columns = [
  { key: "createdAt" as const, label: "Date & Time", w: "200px" },
  { key: "type" as const, label: "Type", w: "148px" },
  { key: "ticket" as const, label: "Ticket", w: "100px" },
  { key: "title" as const, label: "Title", w: "190px" },
  { key: "createdBy" as const, label: "Created By", w: "120px" },
  { key: "details" as const, label: "Details", w: "222px" },
  { key: "status" as const, label: "Status", w: "140px" },
];

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />;
  return dir === "asc" ? (
    <ArrowUp className="h-3.5 w-3.5" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5" />
  );
}

type Props = {
  rows: NotificationRow[];
  isLoading: boolean;
  hasFilter: boolean;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  onSelect: (row: NotificationRow) => void;
  onOpenTicket: (ticketId: string) => void;
  canRetry: boolean;
  retryingId: string | null;
  onRetry: (row: NotificationRow) => void;
  fmt: (d: string) => string;
};

export function NotificationsTable({
  rows,
  isLoading,
  hasFilter,
  sortKey,
  sortDir,
  onSort,
  onSelect,
  onOpenTicket,
  canRetry,
  retryingId,
  onRetry,
  fmt,
}: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-auto">
        <Table containerClassName="overflow-visible" className="w-full min-w-[1120px] table-fixed">
          <colgroup>
            {columns.map((c) => (
              <col key={c.key} style={{ width: c.w }} />
            ))}
          </colgroup>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow className="hover:bg-transparent">
              {columns.map((col) => (
                <TableHead key={col.key}>
                  <button
                    onClick={() => onSort(col.key)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-foreground"
                  >
                    {col.label}
                    <SortIcon active={sortKey === col.key} dir={sortDir} />
                  </button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  Loading…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  No notifications{hasFilter ? " match this filter" : " yet"}.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const details = detailsText(row);
                const meta = statusMeta(row.status);
                return (
                  <TableRow key={row.id} onClick={() => onSelect(row)} className="cursor-pointer">
                    <TableCell className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                      {fmt(row.createdAt)}
                    </TableCell>
                    <TableCell className="truncate text-sm text-foreground">
                      {humanizeTemplate(row.templateName)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {row.ticketId ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenTicket(row.ticketId as string);
                          }}
                          className="inline-flex items-center gap-1 font-medium text-foreground hover:text-foreground"
                        >
                          {row.ticketCode ?? "View ticket"}
                          <Ticket className="h-3 w-3" />
                        </button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell
                      className="max-w-[1px] truncate text-sm text-foreground"
                      title={row.ticketTitle ?? undefined}
                    >
                      {row.ticketTitle ?? <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="truncate text-sm text-foreground">
                      {row.author ?? <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell
                      className="max-w-[1px] truncate text-sm text-foreground"
                      title={details ?? undefined}
                    >
                      {details ?? <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${meta.tone}`}
                          title={meta.failed && row.errorMessage ? row.errorMessage : undefined}
                        >
                          {meta.label}
                        </span>
                        {meta.failed && canRetry && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Resend this notification"
                            aria-label="Resend this notification"
                            disabled={retryingId === row.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onRetry(row);
                            }}
                            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                          >
                            {retryingId === row.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RotateCcw className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
