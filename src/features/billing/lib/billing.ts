export type TimeRange = "7d" | "14d" | "30d" | "90d" | "this_month" | "6m" | "this_year";

export const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "14d", label: "Last 14 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "this_month", label: "This month" },
  { value: "6m", label: "Last 6 months" },
  { value: "this_year", label: "This year" },
];

/** Upstream billing API payloads (snake_case: the billing service's own format). */
export interface BillingOptions {
  projects: { gcp_project_id: string; gcp_project_name: string }[];
  services: string[];
}

export interface BillingKpis {
  total_gross_cost: number;
  total_credits: number;
  total_net_cost: number;
  promo_credits: number;
}

export type TrendRow = {
  period_date?: string;
  group_key?: string;
  gross_cost?: number | string;
  net_cost?: number | string;
};
export type ServiceRow = {
  service_description?: string;
  service?: string;
  gross_cost?: number | string;
};
export type ProjectRow = {
  gcp_project_id?: string;
  gcp_project_name?: string;
  gross_cost?: number | string;
  total_credits?: number | string;
  net_cost?: number | string;
};

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Compute startDate / endDate (YYYY-MM-DD) for a time range. */
export function computeDateRange(range: TimeRange): { startDate: string; endDate: string } {
  const today = new Date();
  const end = toIso(today);
  const minusDays = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return toIso(d);
  };

  switch (range) {
    case "7d":
      return { startDate: minusDays(7), endDate: end };
    case "14d":
      return { startDate: minusDays(14), endDate: end };
    case "30d":
      return { startDate: minusDays(30), endDate: end };
    case "90d":
      return { startDate: minusDays(90), endDate: end };
    case "this_month":
      return {
        startDate: toIso(new Date(today.getFullYear(), today.getMonth(), 1)),
        endDate: end,
      };
    case "6m": {
      const d = new Date(today);
      d.setMonth(d.getMonth() - 6);
      return { startDate: toIso(d), endDate: end };
    }
    case "this_year":
      return { startDate: toIso(new Date(today.getFullYear(), 0, 1)), endDate: end };
    default:
      return { startDate: minusDays(30), endDate: end };
  }
}

export function formatAud(value: number | null | undefined): string {
  return (value ?? 0).toLocaleString("en-AU", { style: "currency", currency: "AUD" });
}

/** Accepts either a bare array or `{ data: [...] }`. */
export function asRows<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  const data = (payload as { data?: unknown } | null)?.data;
  return Array.isArray(data) ? (data as T[]) : [];
}

export const CHART_COLORS = [
  "#00E5FF",
  "#8A2BE2",
  "#FF007A",
  "#00FF87",
  "#FF9900",
  "#FFD700",
  "#00BFFF",
  "#FF4500",
  "#9400D3",
  "#00FA9A",
  "#DC143C",
  "#1E90FF",
  "#ADFF2F",
  "#FF1493",
  "#7B68EE",
];
