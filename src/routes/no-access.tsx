import { createFileRoute, redirect } from "@tanstack/react-router";
import { loadSession } from "@/features/auth/hooks/auth-queries";
import { NoAccessView } from "@/features/auth/views/no-access-view";

export const Route = createFileRoute("/no-access")({
  beforeLoad: async ({ context }) => {
    const session = await loadSession(context.queryClient);
    if (session.kind === "anonymous") throw redirect({ to: "/login" });
    if (session.kind === "signed-in" && session.access.status === "active")
      throw redirect({ to: "/dashboard" });
    return { archived: session.kind === "archived" };
  },
  head: () => ({
    meta: [
      { title: "No project access — Space Scope" },
      {
        name: "description",
        content:
          "Your Space Scope account has no active project access. Contact your account administrator to be invited back.",
      },
    ],
  }),
  component: function NoAccessPage() {
    const { archived } = Route.useRouteContext();
    return <NoAccessView archived={archived} />;
  },
});
