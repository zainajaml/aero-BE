import { createFileRoute } from "@tanstack/react-router";
import { MyWorkView } from "@/features/workspace/views/my-work-view";

export const Route = createFileRoute("/_authenticated/my-work")({
  validateSearch: (s: Record<string, unknown>) => ({
    tab: typeof s.tab === "string" ? s.tab : undefined,
  }),
  component: function MyWorkPage() {
    const { tab } = Route.useSearch();
    return <MyWorkView tab={tab} />;
  },
  head: () => ({
    meta: [
      { title: "My Work — Space Scope" },
      {
        name: "description",
        content:
          "Your accounts, projects and work log in one place across every Space Scope workspace you belong to.",
      },
      { property: "og:title", content: "My Work — Space Scope" },
      {
        property: "og:description",
        content:
          "Your accounts, projects and work log in one place across every Space Scope workspace you belong to.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
