import { useMemo, useState } from "react";
import {
  AlertCircle,
  Award,
  Calendar,
  DollarSign,
  Layers,
  Server,
  TrendingDown,
} from "lucide-react";
import { errorMessage } from "@/shared/api/errors";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { BillingBreakdowns } from "../components/billing-breakdowns";
import { KpiCard, MultiSelect, ToggleGroupInline } from "../components/billing-controls";
import { BillingTrendChart } from "../components/billing-trend-chart";
import {
  isBillingNotConfigured,
  useBillingOptions,
  useBillingReport,
} from "../hooks/billing-queries";
import { TIME_RANGES, computeDateRange, formatAud, type TimeRange } from "../lib/billing";

/** Friendly state when the backend has no billing integration configured (503). */
function BillingNotConfigured() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Server className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">Billing report isn't set up yet</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Once the GCP billing export is connected, spend, credits and per-project costs will appear
        here.
      </p>
    </div>
  );
}

export function BillingView() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [groupBy, setGroupBy] = useState<"service" | "project">("service");
  const [granularity, setGranularity] = useState<"daily" | "monthly">("daily");
  const [costMetric, setCostMetric] = useState<"gross" | "net">("gross");
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const params = useMemo(() => {
    const { startDate, endDate } = computeDateRange(timeRange);
    return {
      startDate,
      endDate,
      groupBy,
      granularity,
      projects: selectedProjects.length > 0 ? selectedProjects.join(",") : "all",
      services: selectedServices.length > 0 ? selectedServices.join(",") : "all",
    };
  }, [timeRange, selectedProjects, selectedServices, groupBy, granularity]);

  const optionsQuery = useBillingOptions();
  const report = useBillingReport(params);
  const options = optionsQuery.data ?? { projects: [], services: [] };
  const kpis = report.data?.kpis ?? null;

  const notConfigured =
    isBillingNotConfigured(optionsQuery.error) || isBillingNotConfigured(report.error);
  const failure = report.error ?? optionsQuery.error;
  const error = failure ? errorMessage(failure) : null;

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              GCP Billing Report
            </h1>
            <p className="text-xs text-muted-foreground">
              Data synced from GCP BigQuery • Native AUD
            </p>
          </div>
        </div>
        {!notConfigured && (
          <ToggleGroupInline
            value={costMetric}
            onChange={setCostMetric}
            options={[
              { value: "gross", label: "Gross Spend" },
              { value: "net", label: "Net Spend" },
            ]}
          />
        )}
      </div>

      {notConfigured ? (
        <BillingNotConfigured />
      ) : (
        <>
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Couldn't load billing data. {error}</span>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
            <ToggleGroupInline
              label="Group by"
              value={groupBy}
              onChange={setGroupBy}
              options={[
                { value: "service", label: "Service" },
                { value: "project", label: "Project" },
              ]}
            />
            <ToggleGroupInline
              label="Interval"
              value={granularity}
              onChange={setGranularity}
              options={[
                { value: "daily", label: "Daily" },
                { value: "monthly", label: "Monthly" },
              ]}
            />
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
                <SelectTrigger className="h-9 w-[168px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_RANGES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <MultiSelect
              label="Projects"
              selected={selectedProjects}
              onChange={setSelectedProjects}
              items={options.projects.map((p) => ({
                value: p.gcp_project_id,
                label: p.gcp_project_name || p.gcp_project_id,
                sub: p.gcp_project_id,
              }))}
            />
            <MultiSelect
              label="Services"
              selected={selectedServices}
              onChange={setSelectedServices}
              items={options.services.map((s) => ({ value: s, label: s }))}
            />
          </div>

          {/* KPIs */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="Gross Spend"
              value={formatAud(parseFloat(String(kpis?.total_gross_cost || 0)))}
              subtitle="Cost Before Discounts"
              icon={Layers}
            />
            <KpiCard
              title="Net Cost"
              value={formatAud(
                Math.abs(parseFloat(String(kpis?.total_net_cost || 0))) < 0.01
                  ? 0
                  : parseFloat(String(kpis?.total_net_cost || 0)),
              )}
              subtitle="Actual Out-of-Pocket Spend"
              icon={DollarSign}
              iconClass="text-emerald-500"
            />
            <KpiCard
              title="Total Credits / Savings"
              value={formatAud(Math.abs(parseFloat(String(kpis?.total_credits || 0))))}
              subtitle="CUD, SUD & Promotions"
              icon={TrendingDown}
              iconClass="text-emerald-500"
            />
            <KpiCard
              title="Promotional Credits"
              value={formatAud(Math.abs(parseFloat(String(kpis?.promo_credits || 0))))}
              subtitle="Free Tier / Coupons Applied"
              icon={Award}
              iconClass="text-purple-500"
            />
          </div>

          <BillingTrendChart
            trends={report.data?.trends ?? []}
            costMetric={costMetric}
            granularity={granularity}
            groupBy={groupBy}
            loading={report.isLoading}
          />

          <BillingBreakdowns
            servicesSummary={report.data?.services ?? []}
            projectsSummary={report.data?.projects ?? []}
          />
        </>
      )}
    </div>
  );
}
