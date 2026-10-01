import { ChevronDown, ChevronUp, ChevronsUpDown, Sparkle } from "lucide-react";
import { NeonBadge } from "@/shared/ui/glass/neon-badge";
import { TableHead } from "@/shared/ui/table";
import type { CommentSummary } from "../../api/reporting.api";

export type RagSortKey = "title" | "budget" | "status" | "state" | "comments";
export type RagSort = { key: RagSortKey; dir: "asc" | "desc" };
export type RagStatus = "red" | "orange" | "green";

export function RagColGroup() {
  return (
    <colgroup>
      <col className="w-[24%]" />
      <col className="w-[14%]" />
      <col className="w-[12%]" />
      <col className="w-[14%]" />
      <col className="w-[36%]" />
    </colgroup>
  );
}

export function SortableHead({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: {
  label: string;
  sortKey: RagSortKey;
  sort: RagSort;
  onSort: (key: RagSortKey) => void;
  className?: string;
}) {
  const active = sort.key === sortKey;
  const Icon = !active ? ChevronsUpDown : sort.dir === "asc" ? ChevronUp : ChevronDown;
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`-ml-1 flex items-center gap-1 rounded px-1 py-0.5 transition-colors hover:text-foreground ${
          active ? "text-foreground" : ""
        }`}
      >
        {label}
        <Icon className={`h-3.5 w-3.5 ${active ? "opacity-100" : "opacity-40"}`} />
      </button>
    </TableHead>
  );
}

export function NeonBadgeState({ colName }: { colName: string }) {
  return (
    <NeonBadge tone="muted" className="text-[10px]">
      {colName}
    </NeonBadge>
  );
}

export function RagDot({ status, className }: { status: RagStatus; className?: string }) {
  const color =
    status === "red" ? "bg-neon-rose" : status === "orange" ? "bg-neon-amber" : "bg-neon-lime";
  return <span className={`inline-block h-3 w-3 rounded-full ${color} ${className ?? ""}`} />;
}

export function CommentSummaryBlock({ summary }: { summary: CommentSummary }) {
  const sections: { label: string; tone: string; items: string[] }[] = [
    { label: "Issue", tone: "text-neon-rose", items: summary.issue },
    { label: "Solution", tone: "text-neon-lime", items: summary.solution },
    { label: "Next steps", tone: "text-neon-cyan", items: summary.nextSteps },
  ];
  const hasAny = sections.some((s) => s.items.length > 0);
  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground/60">
        <Sparkle className="h-3 w-3" />
        AI summary
      </div>
      {hasAny ? (
        sections
          .filter((s) => s.items.length > 0)
          .map((s) => (
            <div key={s.label}>
              <div className={`text-[11px] font-semibold ${s.tone}`}>{s.label}</div>
              <ul className="mt-0.5 space-y-0.5 text-xs text-muted-foreground/85">
                {s.items.map((it, i) => (
                  <li key={i} className="flex gap-1.5">
                    <span className="text-muted-foreground/40">•</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))
      ) : (
        <p className="text-xs text-muted-foreground/60">No notable points.</p>
      )}
    </div>
  );
}
