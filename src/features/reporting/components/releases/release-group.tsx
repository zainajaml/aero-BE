import type { ReactNode } from "react";
import { NeonBadge } from "@/shared/ui/glass/neon-badge";
import { TYPE_TONE } from "@/shared/lib/format";
import type { TicketReportRow } from "../../api/reporting.api";
import { typeAction } from "../../lib/releases-csv";

export function ReleaseGroup({
  title,
  icon,
  tickets,
  onOpen,
}: {
  title: string;
  icon: ReactNode;
  tickets: TicketReportRow[];
  onOpen: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        {icon}
        {title}
        <span className="text-xs text-muted-foreground">({tickets.length})</span>
      </div>
      {tickets.length === 0 ? (
        <p className="text-xs text-muted-foreground">None.</p>
      ) : (
        <ul className="space-y-1.5">
          {tickets.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onOpen(t.id)}
                className="flex w-full items-start gap-2 rounded-md px-1 py-0.5 text-left text-sm transition-colors hover:bg-muted/50"
              >
                <NeonBadge
                  tone={TYPE_TONE[t.type] ?? "muted"}
                  className="mt-0.5 shrink-0 font-mono text-[9px] uppercase"
                >
                  {t.code}
                </NeonBadge>
                <span>
                  <span className="text-muted-foreground">{typeAction(t.type)}: </span>
                  {t.title}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
