import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { PasswordInput } from "@/shared/ui/password-input";
import {
  requestPasswordReset,
  resendVerification,
  signInWithGoogle,
  signInWithPassword,
} from "../api/session.api";
import { AuthCard, GoogleIcon } from "../components/auth-card";
import { authKeys, loadSession } from "../hooks/auth-queries";
import { destinationFor } from "../lib/route-guards";

export function LoginView({ initialError }: { initialError?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"signin" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const [error, setError] = useState(
    initialError === "google" ? "Google sign-in failed. Please try again." : "",
  );

  async function routeAfterSignIn() {
    await queryClient.invalidateQueries({ queryKey: authKeys.all });
    const session = await loadSession(queryClient);
    if (session.kind !== "signed-in") {
      setError("This account isn't authorized to access Space Scope.");
      return;
    }
    const dest = destinationFor(session.access.status);
    if (dest.startsWith("/") && !dest.includes("?") && !dest.includes("#"))
      navigate({ to: dest, replace: true });
    else window.location.assign(dest);
  }

  async function passwordSignIn(event: React.FormEvent) {
    event.preventDefault();
    setPwLoading(true);
    setError("");
    setUnverified(false);
    const result = await signInWithPassword(email, password);
    if (!result.ok) {
      setPwLoading(false);
      setUnverified(result.code === "EMAIL_NOT_VERIFIED");
      setError(result.message);
      return;
    }
    await routeAfterSignIn();
    setPwLoading(false);
  }

  async function google() {
    setGoogleLoading(true);
    const result = await signInWithGoogle("/login");
    if (!result.ok) {
      toast.error(result.message);
      setGoogleLoading(false);
    }
  }

  async function sendReset(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) {
      toast.error("Enter your email address first.");
      return;
    }
    setResetLoading(true);
    const result = await requestPasswordReset(email);
    setResetLoading(false);
    if (!result.ok && result.code === "RATE_LIMITED") {
      toast.error(result.message);
      return;
    }
    // Same answer whether or not the account exists.
    toast.success("If that account exists, a password reset link is on its way.");
    setMode("signin");
  }

  async function resend() {
    const result = await resendVerification(email, "/login");
    if (result.ok) toast.success("Confirmation email sent. Check your inbox.");
    else toast.error(result.message);
  }

  return (
    <AuthCard
      footer={
        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:underline">
            ← Back to home
          </Link>
        </p>
      }
    >
      <div className="mb-6 text-center">
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          {mode === "forgot" ? "Reset your password" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "forgot"
            ? "Enter your email and we'll send you a reset link."
            : "Sign in to continue to Space Scope."}
        </p>
      </div>

      {mode === "forgot" ? (
        <form onSubmit={sendReset} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="reset-email">Email</Label>
            <Input
              id="reset-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <Button type="submit" className="w-full rounded-xl" disabled={resetLoading}>
            {resetLoading ? "Sending…" : "Send reset link"}
          </Button>
          <button
            type="button"
            className="text-center text-xs text-muted-foreground hover:underline"
            onClick={() => setMode("signin")}
          >
            ← Back to sign in
          </button>
        </form>
      ) : (
        <>
          <form onSubmit={passwordSignIn} className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:underline"
                  onClick={() => setMode("forgot")}
                >
                  Forgot password?
                </button>
              </div>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}{" "}
                {unverified && (
                  <button type="button" className="underline" onClick={resend}>
                    Resend link
                  </button>
                )}
              </p>
            )}
            <Button type="submit" className="w-full rounded-xl" disabled={pwLoading}>
              {pwLoading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl"
            onClick={google}
            disabled={googleLoading}
          >
            <GoogleIcon />
            {googleLoading ? "Working…" : "Continue with Google"}
          </Button>
        </>
      )}
    </AuthCard>
  );
}
