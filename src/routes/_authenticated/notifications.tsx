import { createFileRoute } from "@tanstack/react-router";
import { NotificationsView } from "@/features/notifications/views/notifications-view";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsView,
  head: () => ({
    meta: [
      { title: "Notifications — Space Scope" },
      {
        name: "description",
        content: "A record of emails and SMS notifications sent to your project recipients.",
      },
      { property: "og:title", content: "Notifications — Space Scope" },
      {
        property: "og:description",
        content: "A record of emails and SMS notifications sent to your project recipients.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
