import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { LoginView } from "@/features/auth/views/login-view";
import { redirectIfSignedIn } from "@/features/auth/lib/route-guards";
import { usePreloginClientName } from "@/features/oauth/hooks/oauth-queries";
import { readOAuthQuery } from "@/features/oauth/lib/authorization-request";

export const Route = createFileRoute("/login")({
  validateSearch: z.object({ error: z.string().optional() }),
  // During an OAuth authorization the server asks for a (re-)sign-in: always show the form.
  beforeLoad: ({ context, location }) =>
    readOAuthQuery(location.searchStr) ? undefined : redirectIfSignedIn(context.queryClient),
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
    const [oauthQuery] = useState(() => readOAuthQuery());
    const clientName = usePreloginClientName(oauthQuery);
    return (
      <LoginView
        initialError={error}
        oauth={oauthQuery ? { query: oauthQuery, clientName } : undefined}
      />
    );
  },
});
