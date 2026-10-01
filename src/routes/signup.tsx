import { createFileRoute } from "@tanstack/react-router";
import { redirectIfSignedIn } from "@/features/auth/lib/route-guards";
import { SignupView } from "@/features/auth/views/signup-view";

export const Route = createFileRoute("/signup")({
  beforeLoad: ({ context }) => redirectIfSignedIn(context.queryClient),
  head: () => ({
    meta: [
      { title: "Create your account — Space Scope" },
      {
        name: "description",
        content:
          "Create a Space Scope account to set up your workspace, first project and invite your team.",
      },
    ],
  }),
  component: SignupView,
});
