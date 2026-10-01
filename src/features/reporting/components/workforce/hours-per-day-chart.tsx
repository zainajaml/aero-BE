import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { GlassPanel } from "@/shared/ui/glass/glass-panel";
import type { HoursHistogram } from "../../lib/workforce-histogram";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function HoursPerDayChart({
  histogram,
  rangeLabel,
}: {
  histogram: HoursHistogram;
  rangeLabel: string;
}) {
  return (
    <GlassPanel className="shrink-0 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Hours logged per day</h2>
        <span className="text-xs text-muted-foreground">{rangeLabel}</span>
      </div>
      {histogram.hasData ? (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={histogram.data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              label={{
                value: "Hours",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 11, fill: "var(--muted-foreground)" },
              }}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.3 }}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value, name) => [`${Number(value).toFixed(2)} h`, name]}
            />
            {histogram.persons.map((p, i) => (
              <Bar
                key={p.id}
                dataKey={p.id}
                name={p.name}
                stackId="hours"
                fill={CHART_COLORS[i % CHART_COLORS.length]}
                radius={i === histogram.persons.length - 1 ? [3, 3, 0, 0] : 0}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
          No hours logged in this period.
        </div>
      )}
    </GlassPanel>
  );
}
