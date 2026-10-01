import { createFileRoute } from "@tanstack/react-router";
import { requireAdminAccess } from "@/features/admin/lib/route-guards";
import { AdminView } from "@/features/admin/views/admin-view";

export const Route = createFileRoute("/_authenticated/admin")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
  beforeLoad: ({ context }) => requireAdminAccess(context.queryClient),
  component: AdminPage,
});

function AdminPage() {
  const { tab } = Route.useSearch();
  return <AdminView tab={tab} />;
}
