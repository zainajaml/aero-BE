import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { CHART_COLORS, formatAud, type TrendRow } from "../lib/billing";

export function BillingTrendChart({
  trends,
  costMetric,
  granularity,
  groupBy,
  loading,
}: {
  trends: TrendRow[];
  costMetric: "gross" | "net";
  granularity: string;
  groupBy: string;
  loading: boolean;
}) {
  const groupKeys = useMemo(
    () => Array.from(new Set(trends.map((r) => String(r?.group_key ?? "Other")).filter(Boolean))),
    [trends],
  );

  const chartData = useMemo(() => {
    const byDate = new Map<string, Record<string, string | number>>();
    for (const row of trends) {
      const date = String(row?.period_date ?? "");
      if (!date) continue;
      const key = String(row?.group_key ?? "Other");
      const value = Number((costMetric === "gross" ? row?.gross_cost : row?.net_cost) ?? 0);
      const entry = byDate.get(date) ?? { date };
      entry[key] = Number(entry[key] ?? 0) + value;
      byDate.set(date, entry);
    }
    return Array.from(byDate.values()).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }, [trends, costMetric]);

  return (
    <Card className="bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          Spend Trend ({granularity}) • Grouped by {groupBy}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[360px]">
        {loading ? (
          <div className="grid h-full place-items-center text-sm text-muted-foreground">
            Loading spend data…
          </div>
        ) : chartData.length === 0 ? (
          <div className="grid h-full place-items-center text-sm text-muted-foreground">
            No spend data for this range.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid stroke="#2A2B30" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                stroke="currentColor"
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="currentColor"
                className="text-muted-foreground"
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                formatter={(v) => formatAud(Number(v))}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {groupKeys.map((key, i) => (
                <Bar
                  key={key}
                  dataKey={key}
                  stackId="a"
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
