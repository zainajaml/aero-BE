import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { loadSession } from "@/features/auth/hooks/auth-queries";
import { readOAuthQuery } from "@/features/oauth/lib/authorization-request";
import { ConsentView } from "@/features/oauth/views/consent-view";

export const Route = createFileRoute("/oauth/consent")({
  beforeLoad: async ({ context, location }) => {
    const session = await loadSession(context.queryClient);
    // Signing in with the same signed query continues the authorization back to this page.
    if (session.kind === "anonymous") throw redirect({ href: `/login${location.searchStr}` });
    if (session.kind === "archived") throw redirect({ to: "/no-access" });
  },
  head: () => ({
    meta: [
      { title: "Connect an app — Space Scope" },
      {
        name: "description",
        content: "Approve or deny an external app requesting access to your Space Scope account.",
      },
    ],
  }),
  component: function OAuthConsentPage() {
    const [oauthQuery] = useState(() => readOAuthQuery() ?? window.location.search.slice(1));
    return <ConsentView oauthQuery={oauthQuery} />;
  },
});
