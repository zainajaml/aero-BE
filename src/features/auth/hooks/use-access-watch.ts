import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth-context";
import { sessionQuery } from "./auth-queries";

/**
 * True when the signed-in user no longer belongs anywhere while the app is open (their last
 * membership was removed or their identity archived). Re-checked on focus, every 2 minutes and
 * whenever the access event stream reports a change (see useRoleWatch).
 */
export function useAccessWatch(pollMs = 120_000): boolean {
  const { user, signingOut } = useAuth();
  const session = useQuery({
    ...sessionQuery,
    enabled: Boolean(user) && !signingOut,
    refetchInterval: pollMs,
    refetchOnWindowFocus: true,
  });
  if (!user || signingOut || !session.data) return false;
  if (session.data.kind === "archived") return true;
  return session.data.kind === "signed-in" && session.data.access.status !== "active";
}
