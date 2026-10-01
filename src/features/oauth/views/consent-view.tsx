import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ShieldAlert } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { isApiError, errorMessage } from "@/shared/api/errors";
import { AuthCard } from "@/features/auth/components/auth-card";
import { submitConsent } from "../api/oauth.api";
import { publicClientQuery } from "../hooks/oauth-queries";
import { parseAuthorizationRequest } from "../lib/authorization-request";

const EXPIRED =
  "This authorization link has expired. Go back to the app and start connecting again.";

const loginUrl = (oauthQuery: string) => `/login?${oauthQuery}`;

function Message({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <AuthCard>
      <div className="flex flex-col items-center gap-3 text-center">
        <ShieldAlert className="h-8 w-8 text-destructive" aria-hidden />
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p role="alert" className="text-sm text-muted-foreground">
          {children}
        </p>
      </div>
    </AuthCard>
  );
}

/** OAuth 2.1 consent screen: approve or deny an MCP client (Claude, etc.) acting as the user. */
export function ConsentView({ oauthQuery }: { oauthQuery: string }) {
  const request = parseAuthorizationRequest(oauthQuery);
  const [busy, setBusy] = useState<"approve" | "deny" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(request.expired);
  const client = useQuery({
    ...publicClientQuery(request.clientId ?? ""),
    enabled: Boolean(request.clientId) && !request.expired,
  });
  const signedOut = isApiError(client.error) && client.error.status === 401;

  useEffect(() => {
    if (signedOut) window.location.replace(loginUrl(oauthQuery));
  }, [signedOut, oauthQuery]);

  if (!request.clientId) {
    return (
      <Message title="Invalid authorization link">
        This link is missing the app it is for. Go back to the app and start connecting again.
      </Message>
    );
  }
  if (expired) return <Message title="Link expired">{EXPIRED}</Message>;
  if (client.error) {
    if (signedOut) return null;
    if (isApiError(client.error) && client.error.status === 404) {
      return (
        <Message title="Unknown app">
          The app asking to connect is not registered with Space Scope, or has been disabled.
        </Message>
      );
    }
    return (
      <Message title="Something went wrong">
        Could not load this authorization request: {errorMessage(client.error)}
      </Message>
    );
  }

  const clientName = client.data?.client_name?.trim() || "An app";

  async function decide(accept: boolean) {
    setBusy(accept ? "approve" : "deny");
    setError(null);
    try {
      window.location.href = await submitConsent(accept, oauthQuery);
    } catch (failure) {
      setBusy(null);
      if (isApiError(failure) && failure.status === 401) {
        window.location.replace(loginUrl(oauthQuery));
      } else if (isApiError(failure) && failure.code === "invalid_signature") {
        setExpired(true);
      } else {
        setError(errorMessage(failure));
      }
    }
  }

  return (
    <AuthCard>
      <div className="mb-6 text-center">
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          {client.isPending ? "Connect an app" : `Connect ${clientName} to Space Scope`}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {client.isPending ? "Loading…" : "Review what this app is asking for."}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-border bg-background/40 p-4 text-sm">
          <p className="text-muted-foreground">You will be sent back to</p>
          <p className="mt-1 break-all font-mono text-base font-semibold">
            {request.redirectHost ?? "an unknown address"}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Only continue if you started this connection and recognise this address. App names are
            chosen by the app itself.
          </p>
        </div>

        <p className="text-sm text-muted-foreground">
          {clientName} is asking to use Space Scope as you. It can read the accounts and projects
          you already have access to, and create tickets on your behalf. It cannot do anything your
          Space Scope account cannot do.
        </p>

        {request.scopes.length > 0 && (
          <ul className="flex flex-col gap-2 text-sm">
            {request.scopes.map(({ scope, description }) => (
              <li key={scope} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span>{description}</span>
              </li>
            ))}
          </ul>
        )}

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-xl"
            disabled={busy !== null || client.isPending}
            onClick={() => decide(false)}
          >
            {busy === "deny" ? "Denying…" : "Deny"}
          </Button>
          <Button
            type="button"
            className="flex-1 rounded-xl"
            disabled={busy !== null || client.isPending}
            onClick={() => decide(true)}
          >
            {busy === "approve" ? "Approving…" : "Approve"}
          </Button>
        </div>
      </div>
    </AuthCard>
  );
}
