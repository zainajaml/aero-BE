import { createFileRoute } from "@tanstack/react-router";
import { requireSuperAdmin } from "@/features/admin/lib/route-guards";
import { SuperAdminView } from "@/features/admin/views/super-admin-view";

export const Route = createFileRoute("/_authenticated/super-admin")({
  beforeLoad: ({ context }) => requireSuperAdmin(context.queryClient),
  head: () => ({ meta: [{ title: "Super Admin · Space Scope" }] }),
  component: SuperAdminView,
});
