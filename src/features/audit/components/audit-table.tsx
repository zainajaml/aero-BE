import { useNavigate } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { cn } from "@/shared/lib/utils";
import { useTimezone } from "@/features/users/lib/timezone";
import type { AuditLogRow } from "../api/audit.api";
import { actionLabel, destFor, type SortDir, type SortKey } from "../lib/audit-format";

const COLUMNS: { key: SortKey; label: string; w: string }[] = [
  { key: "created_at", label: "Date & Time", w: "210px" },
  { key: "account", label: "Account", w: "120px" },
  { key: "project", label: "Project", w: "140px" },
  { key: "user", label: "User", w: "140px" },
  { key: "action", label: "Action", w: "100px" },
  { key: "table_name", label: "Type", w: "180px" },
  { key: "field", label: "Field", w: "120px" },
  { key: "value", label: "Value", w: "260px" },
];
const TABLE_MIN_W = 1270;

function ColGroup() {
  return (
    <colgroup>
      {COLUMNS.map((c) => (
        <col key={c.key} style={{ width: c.w }} />
      ))}
    </colgroup>
  );
}

function SortIcon({ k, sortKey, sortDir }: { k: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== k) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />;
  return sortDir === "asc" ? (
    <ArrowUp className="h-3.5 w-3.5" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5" />
  );
}

export function AuditTable({
  rows,
  isLoading,
  filtered,
  sortKey,
  sortDir,
  onSort,
}: {
  rows: AuditLogRow[];
  isLoading: boolean;
  filtered: boolean;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const navigate = useNavigate();
  const tz = useTimezone();

  const fmt = (d: string) =>
    `${tz
      .formatDateTime(d, { hour: "numeric", minute: "2-digit" })
      .replace(/, (?=\d{1,2}:\d{2})/, " ")} ${tz.tz}`;

  const goTo = (link: string | null) => {
    if (link) void navigate({ to: link });
  };

  return (
    <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
      <div className="w-full" style={{ minWidth: `${TABLE_MIN_W}px` }}>
        <div className="sticky top-0 z-10 bg-background">
          <Table containerClassName="overflow-visible" className="w-full table-fixed [&_th]:h-7">
            <ColGroup />
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {COLUMNS.map((col) => (
                  <TableHead key={col.key}>
                    <button
                      onClick={() => onSort(col.key)}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-foreground"
                    >
                      {col.label}
                      <SortIcon k={col.key} sortKey={sortKey} sortDir={sortDir} />
                    </button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
          </Table>
        </div>
        <Table containerClassName="overflow-visible" className="w-full table-fixed [&_td]:py-1">
          <ColGroup />
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                  No audit entries{filtered ? " match this filter" : " yet"}.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const dest = destFor(row);
                return (
                  <TableRow
                    key={row.id}
                    onClick={() => goTo(dest)}
                    className={cn(dest && "cursor-pointer")}
                  >
                    <TableCell className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                      {fmt(row.createdAt)}
                    </TableCell>
                    <TableCell className="truncate text-sm">{row.accountName ?? "—"}</TableCell>
                    <TableCell className="truncate text-sm">
                      {row.projectId ? (row.projectName ?? "Unknown project") : "—"}
                    </TableCell>
                    <TableCell className="truncate text-sm font-medium">{row.userName}</TableCell>
                    <TableCell className="truncate text-sm text-foreground">
                      {actionLabel(row.action)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm font-mono">
                      {row.tableName ? (
                        <span className="inline-flex items-center gap-1">
                          {row.tableName}
                          {dest && <ExternalLink className="h-3 w-3 opacity-50" />}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="break-words whitespace-normal text-sm text-muted-foreground leading-snug">
                      {row.field || "—"}
                    </TableCell>
                    <TableCell className="break-words whitespace-normal text-sm leading-snug">
                      {row.value || "—"}
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
