import { createFileRoute } from "@tanstack/react-router";
import { BillingView } from "@/features/billing/views/billing-view";

export const Route = createFileRoute("/_authenticated/billing")({
  component: BillingView,
  head: () => ({
    meta: [
      { title: "GCP Billing Report — Space Scope" },
      {
        name: "description",
        content:
          "Track GCP gross spend, net cost, credits and per-project breakdowns in native AUD.",
      },
      { property: "og:title", content: "GCP Billing Report — Space Scope" },
      {
        property: "og:description",
        content:
          "Track GCP gross spend, net cost, credits and per-project breakdowns in native AUD.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
