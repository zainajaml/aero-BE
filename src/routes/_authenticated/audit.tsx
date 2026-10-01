import { createFileRoute } from "@tanstack/react-router";
import { requireAuditAccess } from "@/features/admin/lib/route-guards";
import { AuditView } from "@/features/audit/views/audit-view";

export const Route = createFileRoute("/_authenticated/audit")({
  beforeLoad: ({ context }) => requireAuditAccess(context.queryClient),
  component: () => <AuditView />,
});
