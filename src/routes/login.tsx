import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { LoginView } from "@/features/auth/views/login-view";
import { redirectIfSignedIn } from "@/features/auth/lib/route-guards";

export const Route = createFileRoute("/login")({
  validateSearch: z.object({ error: z.string().optional() }),
  beforeLoad: ({ context }) => redirectIfSignedIn(context.queryClient),
  head: () => ({
    meta: [
      { title: "Sign in — Space Scope" },
      {
        name: "description",
        content: "Sign in to Space Scope to plan sprints, track time and report progress.",
      },
    ],
  }),
  component: function LoginPage() {
    const { error } = Route.useSearch();
    return <LoginView initialError={error} />;
  },
});
