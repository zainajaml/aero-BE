import { appUrl, authClient } from "@/shared/api/auth-client";

/** Result of an auth protocol call: a user-facing message on failure, plus the machine code. */
export type AuthResult = { ok: true } | { ok: false; code: string; message: string };

type BetterAuthError = { status?: number; code?: string; message?: string } | null | undefined;

const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Incorrect email or password.",
  EMAIL_NOT_VERIFIED: "Please confirm your email first — we can resend the link.",
  ACCOUNT_ARCHIVED: "This account has been archived and can no longer sign in.",
  USER_ALREADY_EXISTS: "An account already exists for this email. Please sign in instead.",
  PASSWORD_TOO_SHORT: "Password must be at least 8 characters.",
  INVALID_TOKEN: "This link is invalid or has expired. Request a new one.",
};

function toResult(error: BetterAuthError, fallback: string): AuthResult {
  if (!error) return { ok: true };
  const code = error.code ?? (error.status === 429 ? "RATE_LIMITED" : `HTTP_${error.status ?? 0}`);
  const message =
    MESSAGES[code] ??
    (error.status === 429
      ? "Too many attempts. Please wait a moment and try again."
      : error.message || fallback);
  return { ok: false, code, message };
}

export async function signInWithPassword(email: string, password: string): Promise<AuthResult> {
  const { error } = await authClient.signIn.email({ email: email.trim(), password });
  return toResult(error, "Couldn't sign you in.");
}

/** Result of a sign-in that continues an OAuth authorization: where the browser goes next. */
export type RedirectResult =
  { ok: true; url: string } | { ok: false; code: string; message: string };

function toRedirect(
  data: { url?: string } | null,
  error: BetterAuthError,
  fallback: string,
): RedirectResult {
  const result = toResult(error, fallback);
  if (!result.ok) return result;
  if (!data?.url) return { ok: false, code: "NO_REDIRECT", message: fallback };
  return { ok: true, url: data.url };
}

/**
 * Email sign-in during an MCP/OAuth authorization. `oauthQuery` is the signed query of the login
 * page, sent unchanged; the server answers with the next step of the authorization.
 */
export async function signInWithPasswordForAuthorization(
  email: string,
  password: string,
  oauthQuery: string,
): Promise<RedirectResult> {
  const { data, error } = await authClient.$fetch<{ url?: string }>("/sign-in/email", {
    method: "POST",
    body: { email: email.trim(), password, oauth_query: oauthQuery },
  });
  return toRedirect(data, error as BetterAuthError, "Couldn't sign you in.");
}

/** Google sign-in during an MCP/OAuth authorization; resolves to Google's sign-in URL. */
export async function signInWithGoogleForAuthorization(
  oauthQuery: string,
): Promise<RedirectResult> {
  const { data, error } = await authClient.$fetch<{ url?: string }>("/sign-in/social", {
    method: "POST",
    body: {
      provider: "google",
      callbackURL: appUrl("/login"),
      errorCallbackURL: appUrl("/login?error=google"),
      oauth_query: oauthQuery,
    },
  });
  return toRedirect(data, error as BetterAuthError, "Google sign-in failed.");
}

export async function signUpWithPassword(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  const { error } = await authClient.signUp.email({
    email: input.email.trim(),
    password: input.password,
    name: `${input.firstName.trim()} ${input.lastName.trim()}`.trim(),
    callbackURL: appUrl("/onboarding"),
  });
  return toResult(error, "Could not create your account.");
}

/** Starts Google sign-in; the browser leaves the app and returns to `returnPath`. */
export async function signInWithGoogle(returnPath: string): Promise<AuthResult> {
  const { error } = await authClient.signIn.social({
    provider: "google",
    callbackURL: appUrl(returnPath),
    errorCallbackURL: appUrl("/login?error=google"),
  });
  return toResult(error, "Google sign-in failed.");
}

export async function requestPasswordReset(email: string): Promise<AuthResult> {
  const { error } = await authClient.requestPasswordReset({
    email: email.trim(),
    redirectTo: appUrl("/reset-password"),
  });
  return toResult(error, "Couldn't send reset email.");
}

export async function resetPassword(token: string, newPassword: string): Promise<AuthResult> {
  const { error } = await authClient.resetPassword({ token, newPassword });
  return toResult(error, "Couldn't update your password.");
}

export async function resendVerification(
  email: string,
  returnPath = "/onboarding",
): Promise<AuthResult> {
  const { error } = await authClient.sendVerificationEmail({
    email: email.trim(),
    callbackURL: appUrl(returnPath),
  });
  return toResult(error, "Couldn't resend the confirmation email.");
}
