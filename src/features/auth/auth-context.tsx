import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/shared/api/auth-client";
import { onApiError } from "@/shared/api/client";
import type { AppRole, Me } from "./api/auth.api";
import { authKeys, meQuery, sessionQuery } from "./hooks/auth-queries";
import { getActiveAccountId, subscribeActiveAccountId } from "./lib/active-account-store";
import { getActiveProjectId, subscribeActiveProjectId } from "./lib/active-project-store";

export type { AppRole };

interface AuthState {
  user: Me | null;
  /** Effective roles for the active project (account-wide roles win). */
  roles: AppRole[];
  /** Account-level roles from user_roles, ignoring the active project. */
  globalRoles: AppRole[];
  /** Role per project id, from project memberships. */
  projectRoles: Record<string, AppRole>;
  /** Account ids the user administers. */
  adminAccountIds: string[];
  /** Visible project id → account id. */
  projectAccounts: Record<string, string>;
  loading: boolean;
  /** True from the moment sign-out starts until the page navigates away. */
  signingOut: boolean;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
  refreshRoles: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

/**
 * Effective role resolution (unchanged from the source app), in priority order:
 *  1. super_admin — global, always wins.
 *  2. account_admin — only while the open account is one the user administers.
 *  3. the project role for the active project.
 * There is deliberately no fallback to stale account-level roles.
 */
export function resolveEffectiveRoles(input: {
  globalRoles: AppRole[];
  adminAccountIds: string[];
  projectRoles: Record<string, AppRole>;
  projectAccounts: Record<string, string>;
  activeProjectId: string | null;
  activeAccountId: string | null;
}): AppRole[] {
  if (input.globalRoles.includes("super_admin")) return ["super_admin"];
  const activeAccountId =
    (input.activeProjectId ? input.projectAccounts[input.activeProjectId] : undefined) ??
    input.activeAccountId ??
    undefined;
  if (activeAccountId) {
    if (input.adminAccountIds.includes(activeAccountId)) return ["account_admin"];
  } else if (input.adminAccountIds.length === 1) {
    return ["account_admin"];
  }
  const projectRole = input.activeProjectId ? input.projectRoles[input.activeProjectId] : undefined;
  return projectRole ? [projectRole] : [];
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const session = useQuery(sessionQuery);
  const signedIn = session.data?.kind === "signed-in";
  const me = useQuery({ ...meQuery, enabled: signedIn });
  const [signingOut, setSigningOut] = useState(false);

  const activeProjectId = useSyncExternalStore(
    subscribeActiveProjectId,
    getActiveProjectId,
    () => null,
  );
  const activeAccountId = useSyncExternalStore(
    subscribeActiveAccountId,
    getActiveAccountId,
    () => null,
  );

  const access = session.data?.kind === "signed-in" ? session.data.access : null;
  const globalRoles = useMemo(() => access?.globalRoles ?? [], [access]);
  const adminAccountIds = useMemo(() => access?.adminAccountIds ?? [], [access]);
  const projectRoles = useMemo(() => access?.projectRoles ?? {}, [access]);
  const projectAccounts = useMemo(() => access?.projectAccounts ?? {}, [access]);

  const roles = useMemo(
    () =>
      resolveEffectiveRoles({
        globalRoles,
        adminAccountIds,
        projectRoles,
        projectAccounts,
        activeProjectId,
        activeAccountId,
      }),
    [globalRoles, adminAccountIds, projectRoles, projectAccounts, activeProjectId, activeAccountId],
  );

  const signOut = useCallback(async () => {
    setSigningOut(true);
    await queryClient.cancelQueries();
    queryClient.clear();
    await authClient.signOut().catch(() => undefined);
    window.location.href = "/login";
  }, [queryClient]);

  // A 401 anywhere means the session ended (expired or revoked): drop cached data and re-evaluate.
  useEffect(
    () =>
      onApiError((error) => {
        if (error.status === 401 && session.data?.kind === "signed-in") {
          queryClient.clear();
          void queryClient.invalidateQueries({ queryKey: authKeys.all });
        }
      }),
    [queryClient, session.data?.kind],
  );

  const value: AuthState = {
    user: me.data ?? null,
    roles,
    globalRoles,
    projectRoles,
    adminAccountIds,
    projectAccounts,
    loading: session.isPending || (signedIn && me.isPending),
    signingOut,
    signOut,
    hasRole: (role) => roles.includes(role),
    hasAnyRole: (wanted) => wanted.some((role) => roles.includes(role)),
    refreshRoles: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
