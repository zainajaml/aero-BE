import type { ReactNode } from "react";
import { roleLabel } from "@/shared/lib/role-labels";

export function SectionLabel({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-1 h-4 w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
      <div>
        <h3 className="text-xs font-semibold text-foreground">{title}</h3>
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}

export function ProjectRow({
  name,
  projectKey,
  type,
  createdAt,
  members,
  sprints,
  tickets,
  accountName,
  role,
  formatDate,
}: {
  name: string;
  projectKey: string;
  type: string;
  createdAt: string;
  members?: number;
  sprints?: number;
  tickets?: number;
  accountName?: string;
  role?: string;
  formatDate: (d: string, o?: Intl.DateTimeFormatOptions) => string;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 bg-background/40 p-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted font-mono text-[10px] font-semibold uppercase">
          {projectKey.slice(0, 3)}
        </div>
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-medium">{name}</span>
            {role && (
              <span className="shrink-0 rounded-full bg-muted px-1.5 py-0 text-[10px] font-medium text-muted-foreground">
                {roleLabel(role)}
              </span>
            )}
          </div>
          <div className="truncate text-[11px] capitalize text-muted-foreground">
            {accountName && <span className="normal-case">{accountName} · </span>}
            {type} · started{" "}
            <span className="tabular-nums">
              {formatDate(createdAt, { day: "2-digit", month: "short", year: "numeric" })}
            </span>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center">
        <Metric label="members" value={members ?? 0} />
        <Metric label="sprints" value={type === "kanban" ? "n/a" : (sprints ?? 0)} />
        <Metric label="tickets" value={tickets ?? 0} />
      </div>
    </div>
  );
}

export function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="w-[74px] shrink-0 text-right text-[11px] text-muted-foreground last:w-[70px]">
      <span className="font-semibold tabular-nums text-foreground">{value}</span> {label}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
}: {
  icon: ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border py-8 text-center">
      <div className="mx-auto grid h-9 w-9 place-items-center rounded-2xl bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-2 text-sm font-semibold">{title}</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
