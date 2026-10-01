import { createFileRoute } from "@tanstack/react-router";
import { JiraView } from "@/features/jira/views/jira-view";

export const Route = createFileRoute("/_authenticated/jira")({
  head: () => ({
    meta: [
      { title: "Jira Import | SpaceScope" },
      {
        name: "description",
        content:
          "Connect Atlassian and migrate a Jira project — issues, sprints, comments, work logs and files — into SpaceScope in three steps.",
      },
      { property: "og:title", content: "Jira Import | SpaceScope" },
      {
        property: "og:description",
        content: "Migrate a Jira project into SpaceScope in three guided steps.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JiraView,
});
