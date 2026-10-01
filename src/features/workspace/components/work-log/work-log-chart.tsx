import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatHM } from "@/shared/lib/format";
import type { WorkLogPanelState } from "../../hooks/use-work-log-panel";

type TooltipItem = {
  dataKey?: string | number;
  value?: number | string;
  color?: string;
  payload?: Record<string, number | string | string[]>;
};

function ChartTooltip({
  active,
  payload,
  label,
  chartPeople,
}: {
  active?: boolean;
  payload?: TooltipItem[];
  label?: string | number;
  chartPeople: { id: string; name: string }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      className="rounded-lg border border-border bg-popover p-2.5 shadow-sm"
      style={{ fontSize: 12 }}
    >
      <p className="mb-1.5 font-semibold text-foreground">{label}</p>
      <div className="space-y-1.5">
        {payload.map((item, idx) => {
          const personId = String(item.dataKey ?? "");
          const person = chartPeople.find((p) => p.id === personId);
          const hours = Number(item.value ?? 0);
          const tickets = (item.payload?.[`${personId}_tickets`] as string[] | undefined) ?? [];
          return (
            <div key={idx}>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm" style={{ background: item.color }} />
                <span className="font-medium text-foreground">{person?.name ?? "Unknown"}</span>
                <span className="ml-auto pl-3 text-xs tabular-nums text-muted-foreground">
                  {formatHM(Math.round(hours * 60))}
                </span>
              </div>
              {tickets.length > 0 && (
                <p className="mt-0.5 max-w-[220px] truncate text-[11px] text-muted-foreground">
                  {tickets.join(", ")}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Time logged by date — stacked per selected person; clicking a bar filters the tickets. */
export function WorkLogChart({ s }: { s: WorkLogPanelState }) {
  const { chartPeople, dayFilter } = s;
  return (
    <div className="mt-4 rounded-xl border border-border/50 bg-card/30 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold">Time logged by date</h4>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {s.rangeLabel} · {formatHM(s.totalMinutes)} total ·{" "}
            {dayFilter === null
              ? "click a bar to filter the tickets below"
              : "click the same bar again to clear"}
          </p>
        </div>
        {/* Legend */}
        <div className="flex flex-wrap items-center justify-end gap-3">
          {chartPeople.map((p, i) => (
            <span
              key={p.id}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
            >
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ background: `var(--chart-bar-${(i % 6) + 1})` }}
              />
              {p.name}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-3 h-[220px] min-w-0 w-full">
        {s.loading ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={s.chartData}
              margin={{ top: 4, right: 4, left: -18, bottom: 0 }}
              barCategoryGap="30%"
              className="cursor-pointer"
              onClick={(state) => {
                const index = Number(state?.activeTooltipIndex);
                const day = Number.isInteger(index) ? s.chartData[index]?.day : undefined;
                if (typeof day !== "number") return;
                s.setDayFilter((prev) => (prev === day ? null : day));
              }}
            >
              <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.4} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickFormatter={(v: number) => (v === 0 ? "0" : `${Math.round(v)}h`)}
              />
              <Tooltip
                cursor={{ fill: "var(--accent)", opacity: 0.25 }}
                content={<ChartTooltip chartPeople={chartPeople} />}
              />
              {chartPeople.map((p, i) => (
                <Bar
                  key={p.id}
                  dataKey={p.id}
                  stackId="hours"
                  fill={`var(--chart-bar-${(i % 6) + 1})`}
                  radius={i === chartPeople.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                  maxBarSize={28}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
