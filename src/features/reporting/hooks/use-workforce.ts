import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTimezone } from "@/features/users/lib/timezone";
import { getUtilization } from "../api/reporting.api";
import { buildHoursHistogram } from "../lib/workforce-histogram";
import { TIME_RANGES, getRangeWindow } from "../lib/workforce-range";
import { reportingKeys } from "./reporting-queries";

/** Range preset state + the server's utilisation for the selected project over that window. */
export function useWorkforce(projectId: string | undefined) {
  const tz = useTimezone();
  const [range, setRange] = useState<string>("this_week");

  const window = useMemo(() => getRangeWindow(range, tz), [range, tz]);
  const from = new Date(window.start).toISOString();
  const to = new Date(window.end).toISOString();
  const rangeLabel = TIME_RANGES.find((r) => r.value === range)?.label ?? "This week";

  const query = useQuery({
    queryKey: reportingKeys.utilization(projectId, from, to),
    enabled: !!projectId,
    queryFn: () => getUtilization(projectId!, from, to),
  });

  const histogram = useMemo(
    () => buildHoursHistogram(query.data, window, tz),
    [query.data, window, tz],
  );

  return { range, setRange, rangeLabel, utilization: query.data, histogram };
}
