import { Layers, ListTodo, Rocket } from "lucide-react";
import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { GlassPanel } from "@/shared/ui/glass/glass-panel";
import { formatHM } from "@/shared/lib/format";
import { CHART_COLORS, type ChartRow } from "../../lib/dashboard-charts";
import { CompactTooltip, makeStackedBarShape } from "./chart-parts";

type Series = { rows: ChartRow[]; people: string[] };

const MARGIN = { top: 10, right: 8, left: -16, bottom: 0 };

/** Bar: estimate vs logged hours per ticket (full width). Clicking a bar opens the ticket. */
export function TicketTimeChart({
  data,
  personColor,
  axisColor,
  loggedTotal,
  isKanban,
  onOpenLabel,
}: {
  data: Series;
  personColor: Map<string, string>;
  axisColor: string;
  loggedTotal: number;
  isKanban: boolean;
  onOpenLabel: (label: unknown) => void;
}) {
  return (
    <GlassPanel className="p-5 lg:col-span-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">Time Estimated versus Logged by Ticket</div>
          <div className="text-xs text-muted-foreground">
            Estimate vs logged · {formatHM(loggedTotal)} logged total
          </div>
        </div>
        <Layers className="h-5 w-5 text-muted-foreground" />
      </div>
      {data.rows.length ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data.rows}
            margin={MARGIN}
            className="cursor-pointer"
            onClick={(state) => onOpenLabel(state?.activeLabel)}
          >
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: axisColor }} stroke={axisColor} />
            <YAxis tick={{ fontSize: 11, fill: axisColor }} stroke={axisColor} />
            <Tooltip cursor={{ fill: "#333333" }} position={{ y: 0 }} content={<CompactTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: axisColor }} />
            <Bar
              dataKey="Estimate"
              stackId="estimate"
              fill="var(--chart-estimate)"
              shape={makeStackedBarShape(["Estimate"], "Estimate")}
            />
            {data.people.map((p) => (
              <Bar
                key={p}
                dataKey={p}
                stackId="logged"
                fill={personColor.get(p) ?? CHART_COLORS[0]}
                shape={makeStackedBarShape(data.people, p)}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
          {isKanban
            ? "No tickets to compare yet on the board."
            : "No tickets to compare yet in this sprint."}
        </div>
      )}
    </GlassPanel>
  );
}

/** Histogram: time logged per day, stacked by person. */
export function TimeByDateChart({
  data,
  personColor,
  axisColor,
  loggedTotal,
  isKanban,
}: {
  data: Series;
  personColor: Map<string, string>;
  axisColor: string;
  loggedTotal: number;
  isKanban: boolean;
}) {
  return (
    <GlassPanel className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">Time Logged by Date</div>
          <div className="text-xs text-muted-foreground">
            {isKanban ? "Recent activity" : "Since sprint start"} · {formatHM(loggedTotal)} total
          </div>
        </div>
        <Rocket className="h-5 w-5 text-muted-foreground" />
      </div>
      {data.rows.length ? (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data.rows} margin={MARGIN}>
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: axisColor }} stroke={axisColor} />
            <YAxis tick={{ fontSize: 11, fill: axisColor }} stroke={axisColor} />
            <Tooltip cursor={{ fill: "#333333" }} position={{ y: 0 }} content={<CompactTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: axisColor }} />
            {data.people.map((p) => (
              <Bar
                key={p}
                dataKey={p}
                stackId="logged"
                fill={personColor.get(p) ?? CHART_COLORS[0]}
                shape={makeStackedBarShape(data.people, p)}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
          {isKanban ? "No time logged yet." : "No time logged yet in this sprint."}
        </div>
      )}
    </GlassPanel>
  );
}

/** Bar: tickets by current stage, stacked by individual ticket. */
export function StageChart({
  data,
  axisColor,
  total,
  isKanban,
}: {
  data: { rows: ChartRow[]; keys: string[] };
  axisColor: string;
  total: number;
  isKanban: boolean;
}) {
  return (
    <GlassPanel className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">Tickets by Current Stage</div>
          <div className="text-xs text-muted-foreground">
            Distribution across board · {total} total
          </div>
        </div>
        <ListTodo className="h-5 w-5 text-muted-foreground" />
      </div>
      {data.rows.length ? (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data.rows} margin={MARGIN}>
            <XAxis dataKey="stage" tick={{ fontSize: 11, fill: axisColor }} stroke={axisColor} />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: axisColor }}
              stroke={axisColor}
            />
            <Tooltip
              cursor={{ fill: "#333333" }}
              position={{ y: 0 }}
              content={<CompactTooltip suffix="" />}
            />
            {data.keys.map((k, i) => (
              <Bar
                key={k}
                dataKey={k}
                stackId="stage"
                fill={CHART_COLORS[i % CHART_COLORS.length]}
                shape={makeStackedBarShape(data.keys, k)}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
          {isKanban ? "No tickets on the board." : "No tickets in this sprint."}
        </div>
      )}
    </GlassPanel>
  );
}
