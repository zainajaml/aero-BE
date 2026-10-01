import { createFileRoute, redirect } from "@tanstack/react-router";
import { loadSession } from "@/features/auth/hooks/auth-queries";
import { OnboardingView } from "@/features/onboarding/views/onboarding-view";

export const Route = createFileRoute("/onboarding")({
  beforeLoad: async ({ context }) => {
    const session = await loadSession(context.queryClient);
    if (session.kind === "anonymous") throw redirect({ to: "/signup" });
    if (session.kind === "archived") throw redirect({ to: "/no-access" });
    // A returning member must never be trapped in the wizard.
    if (session.access.status === "active") {
      throw redirect({ to: "/dashboard" });
    }
  },
  head: () => ({
    meta: [
      { title: "Set up your workspace — Space Scope" },
      {
        name: "description",
        content: "Create your Space Scope workspace, add your first project and invite your team.",
      },
    ],
  }),
  component: OnboardingView,
});
