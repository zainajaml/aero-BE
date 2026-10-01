import { motion } from "framer-motion";
import { CheckCircle2, Clock, Gauge, Layers, ListTodo, type LucideIcon } from "lucide-react";
import { GlassPanel } from "@/shared/ui/glass/glass-panel";
import { cn } from "@/shared/lib/utils";
import type { Sprint } from "../../api/reporting.api";
import { formatCloseDelta, formatShortDate, type CloseInfo } from "../../lib/dashboard-charts";

type Stat = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  iconColor: string;
  valueColor?: string;
};

export function DashboardStatCards({
  isKanban,
  counts,
  selectedSprint,
  closeInfo,
  loggedTotal,
  estimatedTotal,
  offsetMin,
}: {
  isKanban: boolean;
  counts: { open: number; closed: number; total: number };
  selectedSprint: Sprint | null;
  closeInfo: CloseInfo;
  loggedTotal: number;
  estimatedTotal: number;
  offsetMin: number;
}) {
  const scope = isKanban ? "Across the board" : "In this sprint";
  const stats: Stat[] = [
    {
      label: "Open tickets",
      value: String(counts.open),
      detail: scope,
      icon: ListTodo,
      iconColor: "text-neon-cyan",
    },
    {
      label: "Closed tickets",
      value: String(counts.closed),
      detail: scope,
      icon: CheckCircle2,
      iconColor: "text-neon-lime",
    },
    {
      label: "Total tickets",
      value: String(counts.total),
      detail: scope,
      icon: Layers,
      iconColor: "text-neon-violet",
    },
    ...(isKanban
      ? []
      : [
          {
            label: "Sprint Time Left",
            value: formatCloseDelta(closeInfo),
            detail: selectedSprint?.endsAt
              ? `Est Close: ${formatShortDate(new Date(selectedSprint.endsAt).getTime(), offsetMin)}`
              : "No sprint end date",
            icon: Clock,
            iconColor: "text-neon-amber",
            valueColor:
              closeInfo !== null && closeInfo.deltaHours < 0
                ? "var(--neon-rose)"
                : "var(--neon-lime)",
          },
          {
            label: "Effort Used",
            value:
              estimatedTotal > 0 ? `${Math.round((loggedTotal / estimatedTotal) * 100)}%` : "—",
            detail: `${Math.round(loggedTotal / 60)}h of ${Math.round(estimatedTotal / 60)}h`,
            icon: Gauge,
            iconColor: "text-neon-amber",
            valueColor: loggedTotal > estimatedTotal ? "var(--neon-rose)" : "var(--neon-lime)",
          },
        ]),
  ];

  return (
    <div className={`grid gap-4 sm:grid-cols-2 ${isKanban ? "lg:grid-cols-3" : "lg:grid-cols-5"}`}>
      {stats.map((s, i) => {
        const Icon = s.icon;
        return (
          <motion.div
            key={s.label}
            className="min-w-0"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 * i }}
          >
            <GlassPanel className="flex h-[108px] flex-col justify-between overflow-hidden p-4">
              <div
                className="line-clamp-2 text-xs font-medium text-muted-foreground leading-snug"
                title={`${s.label} · ${s.detail}`}
              >
                {s.label} · {s.detail}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon className={cn("h-5 w-5", s.iconColor)} />
                </div>
                <div
                  className="font-display text-lg font-semibold tracking-tight"
                  title={`${s.value} ${s.label}`}
                  style={s.valueColor ? { color: s.valueColor } : undefined}
                >
                  {s.value}
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        );
      })}
    </div>
  );
}
