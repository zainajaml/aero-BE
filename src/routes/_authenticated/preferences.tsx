import { createFileRoute } from "@tanstack/react-router";
import { PreferencesView } from "@/features/profile/views/preferences-view";

export const Route = createFileRoute("/_authenticated/preferences")({
  component: PreferencesView,
  head: () => ({
    meta: [
      { title: "Preferences — Space Scope" },
      {
        name: "description",
        content:
          "Choose which project, sprint and worklog notifications you receive from Space Scope.",
      },
      { property: "og:title", content: "Preferences — Space Scope" },
      {
        property: "og:description",
        content:
          "Choose which project, sprint and worklog notifications you receive from Space Scope.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
