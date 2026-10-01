import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { PasswordInput } from "@/shared/ui/password-input";
import { resetPassword } from "../api/session.api";
import { AuthCard } from "../components/auth-card";
import { newPasswordSchema, type NewPasswordValues } from "../schemas/auth.schemas";

/** Reads the single-use reset token once, then removes it from the address bar and history. */
function useResetToken(initial: string | undefined): string | null {
  const [token] = useState(() => initial ?? null);
  useEffect(() => {
    if (initial) window.history.replaceState(null, "", window.location.pathname);
  }, [initial]);
  return token;
}

export function ResetPasswordView({
  token: tokenFromUrl,
  error,
}: {
  token?: string;
  error?: string;
}) {
  const navigate = useNavigate();
  const token = useResetToken(tokenFromUrl);
  const ready = Boolean(token) && !error;
  const form = useForm<NewPasswordValues>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: "", confirm: "" },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async ({ password }) => {
    if (!token) return;
    const result = await resetPassword(token, password);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Password updated. Please sign in.");
    navigate({ to: "/login", replace: true });
  });

  return (
    <AuthCard>
      <div className="mb-6 text-center">
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Set a new password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {ready
            ? "Choose a new password for your account."
            : error
              ? "This reset link is invalid or has expired. Request a new one from the sign-in page."
              : "Open this page from the reset link in your email."}
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="new-password">New password</Label>
          <PasswordInput
            id="new-password"
            autoComplete="new-password"
            disabled={!ready}
            {...form.register("password")}
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <PasswordInput
            id="confirm-password"
            autoComplete="new-password"
            disabled={!ready}
            {...form.register("confirm")}
          />
          {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
        </div>
        <Button type="submit" className="w-full rounded-xl" disabled={isSubmitting || !ready}>
          {isSubmitting ? "Updating…" : "Update password"}
        </Button>
      </form>
    </AuthCard>
  );
}
