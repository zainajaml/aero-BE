import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
import { config } from "@/shared/config/env";
import { useAuth, type AppRole } from "../auth-context";

/** Routes only these roles may stay on if permissions change mid-session. */
const ROUTE_GUARDS: Array<{ prefix: string; roles: AppRole[] }> = [
  { prefix: "/super-admin", roles: ["super_admin"] },
  { prefix: "/admin", roles: ["super_admin", "account_admin", "admin"] },
];

/**
 * Keeps an open session's permissions in sync with the server. The backend pushes `changed` events
 * on /me/access-events (role, membership or archive changes); a slow poll and refocus remain as a
 * safety net. The server always enforces permissions — this only keeps the UI honest.
 */
export function useRoleWatch(pollMs = 120_000) {
  const { user, signingOut, roles, refreshRoles, loading } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const path = useRouterState({ select: (state) => state.location.pathname });
  const refreshRef = useRef(refreshRoles);
  refreshRef.current = refreshRoles;

  useEffect(() => {
    if (!user || signingOut) return;
    let refreshing = false;
    let queued: false | { notify: boolean } = false;

    const apply = async (notify: boolean) => {
      if (refreshing) {
        queued = { notify: notify || (queued ? queued.notify : false) };
        return;
      }
      refreshing = true;
      try {
        // Roles first, so pages refetch under the new permission context.
        await refreshRef.current();
        if (notify) {
          await queryClient.invalidateQueries({ refetchType: "active" });
          await router.invalidate();
          toast.info("Your permissions were updated.");
        }
      } finally {
        refreshing = false;
      }
      if (queued) {
        const next = queued;
        queued = false;
        await apply(next.notify);
      }
    };

    const events = new EventSource(`${config.apiUrl}/api/v1/me/access-events`, {
      withCredentials: true,
    });
    events.addEventListener("changed", () => void apply(true));
    const interval = window.setInterval(() => void apply(false), pollMs);
    const onFocus = () => void apply(false);
    window.addEventListener("focus", onFocus);
    return () => {
      events.close();
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [user, signingOut, pollMs, queryClient, router]);

  // Downgraded off a restricted page: leave instead of sitting on a broken view.
  useEffect(() => {
    if (!user || signingOut || loading) return;
    const guard = ROUTE_GUARDS.find((g) => path.startsWith(g.prefix));
    if (!guard || guard.roles.some((role) => roles.includes(role))) return;
    toast.error("You no longer have access to that page.");
    void router.navigate({ to: "/dashboard" });
  }, [path, roles, user, signingOut, loading, router]);
}
