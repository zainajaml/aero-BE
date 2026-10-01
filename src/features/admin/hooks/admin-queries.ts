import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/auth-context";
import { authKeys } from "@/features/auth/hooks/auth-queries";
import { projectKeys } from "@/features/projects/hooks/project-queries";
import { auditKeys } from "@/features/audit/hooks/audit-queries";
import { listOrgUsers, listUserOpenTickets } from "../api/admin.api";

export const adminKeys = {
  all: ["admin"] as const,
  users: (userId: string | undefined, accountId: string | null, projectId: string | null = null) =>
    [...adminKeys.all, "users", userId, accountId, projectId] as const,
  openTickets: (userId: string) => [...adminKeys.all, "open-tickets", userId] as const,
};

/** User management listing for the account open in the switcher (null = the caller's full scope). */
export function useOrgUsers(accountId: string | null, enabled = true) {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: adminKeys.users(user?.id, accountId),
    queryFn: () => listOrgUsers({ accountId }),
    enabled: enabled && Boolean(user) && !loading,
  });
}

/** Open tickets of a user plus possible new assignees (archive hand-over prompt). */
export function useUserOpenTickets(userId: string, enabled: boolean) {
  return useQuery({
    queryKey: adminKeys.openTickets(userId),
    queryFn: () => listUserOpenTickets(userId),
    enabled: enabled && !!userId,
  });
}

/**
 * Refreshes everything a membership/role change can affect: admin lists, project people and the
 * audit trail; the caller's own session/access too when they changed themselves.
 */
export function useInvalidateAdmin() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return (targetUserId?: string) => {
    void queryClient.invalidateQueries({ queryKey: adminKeys.all });
    void queryClient.invalidateQueries({ queryKey: projectKeys.all });
    void queryClient.invalidateQueries({ queryKey: auditKeys.all });
    if (targetUserId && targetUserId === user?.id)
      void queryClient.invalidateQueries({ queryKey: authKeys.all });
  };
}
