import { createFileRoute } from "@tanstack/react-router";
import { ProfileView } from "@/features/profile/views/profile-view";

export const Route = createFileRoute("/_authenticated/profile")({
  validateSearch: (s: Record<string, unknown>) => ({
    tab: typeof s.tab === "string" ? s.tab : undefined,
    view: typeof s.view === "string" ? s.view : undefined,
  }),
  component: function ProfilePage() {
    const { tab, view } = Route.useSearch();
    return <ProfileView tab={tab} view={view} />;
  },
});
