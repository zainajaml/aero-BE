import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/shared/api/auth-client";
import { errorMessage } from "@/shared/api/errors";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { PasswordInput } from "@/shared/ui/password-input";
import { signInWithGoogle, signInWithPassword } from "@/features/auth/api/session.api";
import { AuthCard, GoogleIcon } from "@/features/auth/components/auth-card";
import { authKeys, loadSession, meQuery } from "@/features/auth/hooks/auth-queries";
import { switchWorkspaceContext } from "@/features/auth/lib/workspace-context";
import {
  acceptInvitation,
  acceptInvitationWithPassword,
  lookupInvitation,
} from "../api/invitations.api";
import { forgetInviteToken, rememberInviteToken, takeInviteToken } from "../lib/pending-token";

type Status =
  | "loading"
  | "sign-up"
  | "sign-in"
  | "accepting"
  | "wrong-account"
  | "already-accepted"
  | "done"
  | "error";

type InviteInfo = {
  email: string;
  roleLabel: string;
  projectName: string | null;
  projectId: string | null;
  accountId: string | null;
  userExists: boolean;
};

export function AcceptView({ token: tokenFromUrl }: { token?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [token] = useState(() => takeInviteToken(tokenFromUrl));
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const ran = useRef(false);

  function goToApp(projectName?: string | null) {
    forgetInviteToken();
    setStatus("done");
    toast.success(
      projectName
        ? `You've successfully joined ${projectName}.`
        : "You've successfully joined Space Scope.",
    );
    setTimeout(() => navigate({ to: "/dashboard", replace: true }), 900);
  }

  async function acceptSignedIn(fallback: InviteInfo | null) {
    setStatus("accepting");
    try {
      const result = await acceptInvitation(token);
      const projectId = result.projectId ?? fallback?.projectId ?? null;
      const accountId = result.accountId ?? fallback?.accountId ?? null;
      const projectName = result.projectName ?? fallback?.projectName ?? null;
      switchWorkspaceContext(projectId, accountId);
      await queryClient.invalidateQueries({ queryKey: authKeys.all });
      if (result.alreadyAccepted) {
        setInfo((previous) =>
          previous ? { ...previous, projectId, accountId, projectName } : previous,
        );
        setStatus("already-accepted");
        return;
      }
      goToApp(projectName);
    } catch (error) {
      setStatus("error");
      setMessage(errorMessage(error, "Failed to accept the invitation."));
    }
  }

  async function handleSignUp(event: React.FormEvent) {
    event.preventDefault();
    if (!info) return;
    if (password.length < 8) return void toast.error("Password must be at least 8 characters.");
    if (password !== confirm) return void toast.error("Passwords do not match.");
    setSubmitting(true);
    try {
      await acceptInvitationWithPassword({ token, password, firstName, lastName });
      const signedIn = await signInWithPassword(info.email, password);
      if (!signedIn.ok) throw new Error(signedIn.message);
      switchWorkspaceContext(info.projectId, info.accountId);
      await queryClient.invalidateQueries({ queryKey: authKeys.all });
      goToApp(info.projectName);
    } catch (error) {
      toast.error(errorMessage(error, "Could not create your account."));
      setSubmitting(false);
    }
  }

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault();
    if (!info) return;
    setSubmitting(true);
    const signedIn = await signInWithPassword(info.email, password);
    if (!signedIn.ok) {
      toast.error(signedIn.message);
      setSubmitting(false);
      return;
    }
    await acceptSignedIn(info);
  }

  async function google() {
    rememberInviteToken(token);
    const result = await signInWithGoogle("/accept");
    if (!result.ok) toast.error(result.message);
  }

  async function signOutAndRetry() {
    await authClient.signOut().catch(() => undefined);
    queryClient.clear();
    setSignedInEmail(null);
    setPassword("");
    setConfirm("");
    setStatus(info?.userExists ? "sign-in" : "sign-up");
  }

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    void (async () => {
      if (!token) {
        setStatus("error");
        setMessage("This invitation link is missing or invalid.");
        return;
      }
      let details;
      try {
        details = await lookupInvitation(token);
      } catch (error) {
        setStatus("error");
        setMessage(errorMessage(error));
        return;
      }
      if (!details.valid || !details.email) {
        setStatus("error");
        setMessage(
          details.expired
            ? "This invitation has expired. Ask an admin to resend it."
            : "This invitation is no longer valid.",
        );
        return;
      }
      const nextInfo: InviteInfo = {
        email: details.email,
        roleLabel: details.roleLabel ?? "",
        projectName: details.projectName ?? null,
        projectId: details.projectId ?? null,
        accountId: details.accountId ?? null,
        userExists: Boolean(details.userExists),
      };
      setInfo(nextInfo);

      const session = await loadSession(queryClient);
      const me = session.kind === "signed-in" ? await queryClient.fetchQuery(meQuery) : null;
      const matches = me?.email.trim().toLowerCase() === nextInfo.email.trim().toLowerCase();
      if (me && matches) return acceptSignedIn(nextInfo);
      if (me && !matches) {
        setSignedInEmail(me.email);
        setStatus("wrong-account");
        return;
      }
      if (details.alreadyAccepted) {
        switchWorkspaceContext(nextInfo.projectId, nextInfo.accountId);
        setStatus(nextInfo.userExists ? "sign-in" : "already-accepted");
        return;
      }
      setStatus(nextInfo.userExists ? "sign-in" : "sign-up");
    })();
    // The flow runs once per page load for the captured token.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const googleButton = (
    <>
      <div className="my-1 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <Button type="button" variant="outline" className="w-full rounded-xl" onClick={google}>
        <GoogleIcon />
        Continue with Google
      </Button>
    </>
  );

  return (
    <AuthCard>
      {(status === "loading" || status === "accepting") && (
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {status === "accepting" ? "Accepting your invitation…" : "Checking your invitation…"}
          </p>
        </div>
      )}

      {status === "sign-up" && info && (
        <div className="flex flex-col gap-5">
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight">You're invited to Space Scope</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your account for <span className="font-medium">{info.email}</span> to join
              {info.projectName ? (
                <>
                  {" "}
                  <span className="font-medium">{info.projectName}</span>
                </>
              ) : null}{" "}
              as a <span className="font-medium">{info.roleLabel}</span>.
            </p>
          </div>
          <form onSubmit={handleSignUp} className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="invited-email">Email</Label>
              <Input id="invited-email" value={info.email} disabled />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="first-name">First name</Label>
                <Input
                  id="first-name"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="last-name">Last name</Label>
                <Input
                  id="last-name"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">Password</Label>
              <PasswordInput
                id="new-password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <PasswordInput
                id="confirm-password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter your password"
                required
              />
            </div>
            <Button type="submit" className="w-full rounded-xl" disabled={submitting}>
              {submitting ? "Creating account…" : "Create account & join"}
            </Button>
          </form>
          {googleButton}
        </div>
      )}

      {status === "sign-in" && info && (
        <div className="flex flex-col gap-5">
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Accept your invitation</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in as <span className="font-medium">{info.email}</span> to join
              {info.projectName ? (
                <>
                  {" "}
                  <span className="font-medium">{info.projectName}</span>
                </>
              ) : null}
              .
            </p>
          </div>
          <form onSubmit={handleSignIn} className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full rounded-xl" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in & accept"}
            </Button>
          </form>
          {googleButton}
        </div>
      )}

      {status === "wrong-account" && info && (
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <h1 className="text-xl font-semibold tracking-tight">Wrong account</h1>
          <p className="text-sm text-muted-foreground">
            This invitation was sent to <span className="font-medium">{info.email}</span>
            {signedInEmail ? (
              <>
                , but you're signed in as <span className="font-medium">{signedInEmail}</span>
              </>
            ) : null}
            . Sign in with the invited email to accept it.
          </p>
          <Button type="button" className="w-full rounded-xl" onClick={signOutAndRetry}>
            Sign in as {info.email}
          </Button>
        </div>
      )}

      {status === "already-accepted" && (
        <div className="flex flex-col items-center gap-4 text-center">
          <CheckCircle2 className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight">
            This invitation has already been accepted
          </h1>
          <p className="text-sm text-muted-foreground">
            {info?.projectName
              ? `You already have access to ${info.projectName}.`
              : "You already have access to this workspace."}
          </p>
          <Button
            type="button"
            className="w-full rounded-xl"
            onClick={() => navigate({ to: "/dashboard", replace: true })}
          >
            Open project
          </Button>
        </div>
      )}

      {status === "done" && (
        <div className="flex flex-col items-center gap-4 text-center">
          <CheckCircle2 className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight">Invitation accepted</h1>
          <p className="text-sm text-muted-foreground">Taking you to your workspace…</p>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <h1 className="text-xl font-semibold tracking-tight">Couldn't accept invitation</h1>
          <p className="text-sm text-muted-foreground">{message}</p>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => navigate({ to: "/login" })}
          >
            Go to sign in
          </Button>
        </div>
      )}
    </AuthCard>
  );
}
