import { useQuery } from "@tanstack/react-query";
import { isApiError } from "@/shared/api/errors";
import { getBillingReport } from "../api/billing.api";
import {
  asRows,
  type BillingKpis,
  type BillingOptions,
  type ProjectRow,
  type ServiceRow,
  type TrendRow,
} from "../lib/billing";

export type BillingParams = Record<string, string>;

export const billingKeys = {
  all: ["billing"] as const,
  options: () => [...billingKeys.all, "options"] as const,
  report: (params: BillingParams) => [...billingKeys.all, "report", params] as const,
};

/** True when the backend says the billing integration isn't configured (503). */
export const isBillingNotConfigured = (error: unknown) =>
  isApiError(error) && error.code === "BILLING_NOT_CONFIGURED";

const noRetryWhenUnconfigured = (count: number, error: unknown) =>
  !isBillingNotConfigured(error) && count < 1;

export function useBillingOptions() {
  return useQuery({
    queryKey: billingKeys.options(),
    queryFn: async (): Promise<BillingOptions> => {
      const data = await getBillingReport<Partial<BillingOptions> | null>("options");
      return { projects: data?.projects ?? [], services: data?.services ?? [] };
    },
    retry: noRetryWhenUnconfigured,
  });
}

/** KPIs, trend rows and the two summaries for one filter set, fetched together. */
export function useBillingReport(params: BillingParams) {
  return useQuery({
    queryKey: billingKeys.report(params),
    queryFn: async () => {
      const [k, t, s, p] = await Promise.all([
        getBillingReport<BillingKpis | null>("kpis", params),
        getBillingReport<unknown>("trends", params),
        getBillingReport<unknown>("services", params),
        getBillingReport<unknown>("projects", params),
      ]);
      return {
        kpis: k ?? null,
        trends: asRows<TrendRow>(t),
        services: asRows<ServiceRow>(s),
        projects: asRows<ProjectRow>(p),
      };
    },
    retry: noRetryWhenUnconfigured,
  });
}
