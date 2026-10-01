import { useState } from "react";
import { KeyRound, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/shared/api/auth-client";
import { requestPasswordReset } from "@/features/auth/api/session.api";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { PasswordInput as BasePasswordInput } from "@/shared/ui/password-input";
import { CTA_BUTTON } from "@/shared/lib/cta";

function PasswordInput({
  value,
  onChange,
  placeholder,
  autoComplete,
  disabled,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <BasePasswordInput
      id={id}
      className="h-8 pr-8 text-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      disabled={disabled}
      maxLength={72}
    />
  );
}

/**
 * Two-step in-app password change: enter the current password, then set a new
 * one. The current password is checked by the server when the change is saved
 * (Better Auth `changePassword`). Users who genuinely forgot their password use
 * the emailed reset link instead (same flow as the sign-in screen).
 */
export function ChangePasswordCard({ email }: { email?: string | null }) {
  const [current, setCurrent] = useState("");
  const [verified, setVerified] = useState(false);
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  const mismatch = confirm.length > 0 && next !== confirm;
  const tooShort = next.length > 0 && next.length < 8;

  function verifyCurrent() {
    if (!email) return;
    if (!current) {
      toast.error("Enter your current password.");
      return;
    }
    // Better Auth only verifies the current password as part of the change itself.
    setVerified(true);
  }

  async function savePassword() {
    if (next.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      toast.error("New passwords do not match.");
      return;
    }
    setSaving(true);
    const { error } = await authClient.changePassword({
      currentPassword: current,
      newPassword: next,
      revokeOtherSessions: true,
    });
    setSaving(false);
    if (error) {
      if (error.code === "INVALID_PASSWORD") {
        setVerified(false);
        toast.error("That current password is incorrect.");
        return;
      }
      toast.error(error.message ?? "Couldn't update password.");
      return;
    }
    setCurrent("");
    setNext("");
    setConfirm("");
    setVerified(false);
    toast.success("Password updated.");
  }

  async function sendReset() {
    if (!email) return;
    setSendingReset(true);
    const result = await requestPasswordReset(email);
    setSendingReset(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Password reset link sent to your email.");
  }

  return (
    <section className="rounded-xl border border-border/50 bg-transparent p-4">
      <header className="flex items-center gap-2">
        <span className="text-neon-violet">
          <KeyRound className="h-3.5 w-3.5" />
        </span>
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Change password
        </h2>
      </header>

      <p className="mt-2 text-xs text-muted-foreground">
        Confirm your current password first. Forgot it? Use the reset link and we&apos;ll email you
        a secure way back in.
      </p>

      <div className="mt-4 max-w-[320px] space-y-3">
        <div className="space-y-1">
          <Label
            htmlFor="current-password"
            className="text-[11px] uppercase tracking-wide text-muted-foreground"
          >
            Current password
          </Label>
          <PasswordInput
            id="current-password"
            value={current}
            onChange={setCurrent}
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={verified}
          />
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={sendReset}
              disabled={sendingReset}
              className="text-xs font-medium text-primary underline-offset-2 hover:underline disabled:opacity-60"
            >
              {sendingReset ? "Sending reset link…" : "Forgot password?"}
            </button>
            {verified ? (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-500">
                <CheckCircle2 className="h-3.5 w-3.5" /> Confirmed
              </span>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-7 rounded-full px-3 text-xs"
                onClick={verifyCurrent}
                disabled={!current}
              >
                Confirm
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <Label
            htmlFor="new-password"
            className="text-[11px] uppercase tracking-wide text-muted-foreground"
          >
            Create new password
          </Label>
          <PasswordInput
            id="new-password"
            value={next}
            onChange={setNext}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            disabled={!verified}
          />
          {tooShort && <p className="text-xs text-destructive">Use at least 8 characters.</p>}
        </div>
        <div className="space-y-1">
          <Label
            htmlFor="confirm-password"
            className="text-[11px] uppercase tracking-wide text-muted-foreground"
          >
            Re-enter new password
          </Label>
          <PasswordInput
            id="confirm-password"
            value={confirm}
            onChange={setConfirm}
            placeholder="Repeat new password"
            autoComplete="new-password"
            disabled={!verified}
          />
          {mismatch && <p className="text-xs text-destructive">Passwords do not match.</p>}
        </div>
        {!verified && (
          <p className="text-[11px] text-muted-foreground/70">
            Confirm your current password above to enable these fields.
          </p>
        )}
        <div className="flex justify-end pt-1">
          <Button
            size="sm"
            onClick={savePassword}
            disabled={!verified || saving || !next || mismatch || tooShort}
            className={CTA_BUTTON}
          >
            {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Update password
          </Button>
        </div>
      </div>
    </section>
  );
}
