import { api, unwrap } from "@/shared/api/client";
import type { operations } from "@/shared/api/schema.gen";

export type BillingReportName = operations["getBillingReport"]["parameters"]["path"]["report"];

/**
 * One GCP billing report via the backend proxy (super admins). The payload is the upstream billing
 * API's own shape (opaque to our contract), so it is typed at the call site. A 503
 * BILLING_NOT_CONFIGURED ApiError means the integration isn't set up.
 */
export const getBillingReport = <T>(
  report: BillingReportName,
  params: Record<string, string> = {},
) =>
  unwrap(
    api.GET("/api/v1/billing/{report}", {
      // The route forwards arbitrary query parameters; the generated type has none.
      params: { path: { report }, query: params as never },
    }),
  ) as Promise<T>;
