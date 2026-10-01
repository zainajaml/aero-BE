import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { GlassPanel } from "@/shared/ui/glass/glass-panel";
import { Button } from "@/shared/ui/button";
import { checkUnsubscribe, confirmUnsubscribe } from "../api/unsubscribe.api";
import { notificationKeys } from "../hooks/notification-queries";

type State = "loading" | "valid" | "invalid" | "already" | "done" | "error";

/** Public one-click unsubscribe page reached from email footers. */
export function UnsubscribeView({ token }: { token: string }) {
  const [confirmed, setConfirmed] = useState<"done" | "error" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // A 404 (unknown/expired token) and any other failure both read as an invalid link.
  const check = useQuery({
    queryKey: notificationKeys.unsubscribe(token),
    enabled: !!token,
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: () => checkUnsubscribe(token),
  });

  const state: State = confirmed
    ? confirmed
    : !token || check.isError
      ? "invalid"
      : check.isPending
        ? "loading"
        : check.data.alreadyUnsubscribed
          ? "already"
          : check.data.valid
            ? "valid"
            : "invalid";

  async function confirm() {
    setSubmitting(true);
    try {
      await confirmUnsubscribe(token);
      setConfirmed("done");
    } catch {
      setConfirmed("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center p-6">
      <GlassPanel className="w-full max-w-md p-8 text-center">
        {state === "loading" && (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p>Checking your link…</p>
          </div>
        )}

        {state === "valid" && (
          <div className="space-y-4">
            <h1 className="font-display text-2xl font-semibold">Unsubscribe</h1>
            <p className="text-sm text-muted-foreground">
              Confirm you'd like to stop receiving these emails.
            </p>
            <Button onClick={() => void confirm()} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm unsubscribe
            </Button>
          </div>
        )}

        {(state === "done" || state === "already") && (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-primary" />
            <h1 className="font-display text-xl font-semibold">You're unsubscribed</h1>
            <p className="text-sm text-muted-foreground">
              You won't receive further emails of this type.
            </p>
          </div>
        )}

        {(state === "invalid" || state === "error") && (
          <div className="flex flex-col items-center gap-3">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="font-display text-xl font-semibold">Link not valid</h1>
            <p className="text-sm text-muted-foreground">
              This unsubscribe link is invalid or has expired.
            </p>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
