import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { UserAvatar } from "@/features/users/components/user-avatar";
import { formatHM } from "@/shared/lib/format";
import { roleLabel } from "@/shared/lib/role-labels";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import {
  COLUMNS,
  projectCount,
  ticketLabel,
  type SortDir,
  type SortKey,
  type UtilizationMember,
} from "../../lib/workforce-table";

const MIN_W = "990px";

function UtilBar({ value }: { value: number }) {
  return (
    <span
      className={`text-right font-mono text-xs ${value > 100 ? "text-green-500" : "text-foreground"}`}
    >
      {value.toFixed(2)}%
    </span>
  );
}

function ColGroup() {
  return (
    <colgroup>
      {COLUMNS.map((c) => (
        <col key={c.key} style={{ width: c.w }} />
      ))}
    </colgroup>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />;
  return dir === "asc" ? (
    <ArrowUp className="h-3.5 w-3.5" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5" />
  );
}

export function UtilizationTable({
  members,
  totalMembers,
  availableMin,
  sortKey,
  sortDir,
  onSort,
  onOpenTicket,
}: {
  members: UtilizationMember[];
  totalMembers: number;
  availableMin: number;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  onOpenTicket: (id: string) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-x-auto">
      <Table className="w-full table-fixed" style={{ minWidth: MIN_W }}>
        <ColGroup />
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {COLUMNS.map((col) => (
              <TableHead key={col.key} className={col.align}>
                <button
                  onClick={() => onSort(col.key)}
                  className={`inline-flex items-center gap-1.5 font-medium transition-colors hover:text-foreground ${
                    col.align === "text-right" ? "ml-auto" : ""
                  }`}
                >
                  {col.label}
                  <SortIcon active={sortKey === col.key} dir={sortDir} />
                </button>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
      </Table>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <Table className="w-full table-fixed" style={{ minWidth: MIN_W }}>
          <ColGroup />
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={COLUMNS.length}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  {totalMembers === 0
                    ? "No spaceman team members found."
                    : "No members match this filter."}
                </TableCell>
              </TableRow>
            ) : (
              members.map((m) => {
                const projects = projectCount(m);
                return (
                  <TableRow key={m.userId} className="hover:bg-card/30">
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-0">
                        <UserAvatar
                          path={m.avatarUrl}
                          name={m.displayName}
                          className="h-8 w-8"
                          fallbackClassName="text-xs"
                        />
                        <span className="truncate text-sm font-medium">{m.displayName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="truncate text-sm text-muted-foreground">
                      {m.jobTitle || "-"}
                    </TableCell>
                    <TableCell className="truncate text-sm text-muted-foreground">
                      {roleLabel(m.role)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {projects} project{projects === 1 ? "" : "s"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {m.tickets.length === 0 ? (
                        <span>-</span>
                      ) : (
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                          {m.tickets.map((tl) => (
                            <button
                              key={tl.ticketId}
                              type="button"
                              onClick={() => onOpenTicket(tl.ticketId)}
                              className="font-mono text-xs text-foreground underline-offset-2 transition hover:underline"
                            >
                              {ticketLabel(tl)}
                            </button>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm tabular-nums text-muted-foreground">
                      {formatHM(availableMin)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold tabular-nums">
                      {formatHM(m.loggedMinutes)}
                    </TableCell>
                    <TableCell className="text-right">
                      <UtilBar value={m.utilization} />
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
