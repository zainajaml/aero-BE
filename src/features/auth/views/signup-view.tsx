import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { PasswordInput } from "@/shared/ui/password-input";
import { resendVerification, signInWithGoogle, signUpWithPassword } from "../api/session.api";
import { AuthCard, GoogleIcon } from "../components/auth-card";
import { signUpSchema, type SignUpValues } from "../schemas/auth.schemas";

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs text-destructive">{message}</p> : null;
}

export function SignupView() {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "" },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await signUpWithPassword(values);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    // Email confirmation is required — onboarding resumes from the confirmation link.
    setSentTo(values.email.trim());
  });

  async function google() {
    setGoogleLoading(true);
    const result = await signInWithGoogle("/onboarding");
    if (!result.ok) {
      toast.error(result.message);
      setGoogleLoading(false);
    }
  }

  async function resend() {
    if (!sentTo) return;
    const result = await resendVerification(sentTo);
    if (result.ok) toast.success("Confirmation email sent again.");
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
      {sentTo ? (
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a confirmation link to {sentTo}. Open it to finish setting up your workspace.
          </p>
          <button
            type="button"
            className="mt-4 text-xs text-muted-foreground hover:underline"
            onClick={resend}
          >
            Didn't get it? Resend
          </button>
        </div>
      ) : (
        <>
          <div className="mb-6 text-center">
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">Create your account</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Set up Space Scope in a couple of minutes.
            </p>
          </div>

          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="first-name">First name</Label>
                <Input
                  id="first-name"
                  autoComplete="given-name"
                  maxLength={50}
                  aria-invalid={!!errors.firstName}
                  {...form.register("firstName")}
                />
                <FieldError message={errors.firstName?.message} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="last-name">Last name</Label>
                <Input
                  id="last-name"
                  autoComplete="family-name"
                  maxLength={50}
                  aria-invalid={!!errors.lastName}
                  {...form.register("lastName")}
                />
                <FieldError message={errors.lastName?.message} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                aria-invalid={!!errors.email}
                {...form.register("email")}
              />
              <FieldError message={errors.email?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="signup-password">Password</Label>
              <PasswordInput
                id="signup-password"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                {...form.register("password")}
              />
              {errors.password ? (
                <FieldError message={errors.password.message} />
              ) : (
                <p className="text-xs text-muted-foreground">At least 8 characters.</p>
              )}
            </div>
            <Button type="submit" className="w-full rounded-xl" disabled={isSubmitting}>
              {isSubmitting ? "Creating account…" : "Create account"}
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
            {googleLoading ? "Working…" : "Sign up with Google"}
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-foreground hover:underline">
              Sign in
            </Link>
          </p>
        </>
      )}
    </AuthCard>
  );
}
