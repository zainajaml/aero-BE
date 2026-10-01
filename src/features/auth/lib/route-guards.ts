import { redirect } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { loadSession } from "../hooks/auth-queries";
import { consumePostLoginRedirect, setPostLoginRedirect } from "./post-login-redirect";

/** Where a signed-in user belongs, given their access status. */
export function destinationFor(
  status: "active" | "needs_onboarding" | "no_access" | "archived",
): string {
  if (status === "needs_onboarding") return "/onboarding";
  if (status === "active") return consumePostLoginRedirect() ?? "/dashboard";
  return "/no-access";
}

/** For sign-in/sign-up pages: send already signed-in users onward. */
export async function redirectIfSignedIn(queryClient: QueryClient) {
  const session = await loadSession(queryClient);
  if (session.kind === "archived") throw redirect({ to: "/no-access" });
  if (session.kind === "signed-in") throw redirect({ href: destinationFor(session.access.status) });
}

/** The app gate for every page under /_authenticated (mirrors the source beforeLoad). */
export async function requireActiveSession(queryClient: QueryClient, href: string) {
  const session = await loadSession(queryClient);
  if (session.kind === "anonymous") {
    setPostLoginRedirect(href);
    throw redirect({ to: "/login" });
  }
  if (session.kind === "archived") throw redirect({ to: "/no-access" });
  const { status } = session.access;
  if (status === "needs_onboarding") throw redirect({ to: "/onboarding" });
  if (status === "no_access" || status === "archived") throw redirect({ to: "/no-access" });
  return session.access;
}
