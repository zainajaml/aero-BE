import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/auth-context";
import { getProjectStats, listAccounts } from "@/features/projects/api/projects.api";
import { projectKeys } from "@/features/projects/hooks/project-queries";
import { displayName } from "@/features/users/lib/names";
import { listVisiblePeople } from "../api/accounts.api";
import { accountKeys } from "./account-queries";

/** Full account row (slug, created date) of the open account; shares the project context's cache. */
export function useAccountDetail(accountId: string | null) {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: projectKeys.accounts(user?.id),
    enabled: !!user,
    queryFn: listAccounts,
  });
  return query.data?.find((a) => a.id === accountId) ?? null;
}

/** Ticket/sprint/member counts per project, keyed by project id. */
export function useProjectStatsMap(projectIds: string[]) {
  return useQuery({
    queryKey: projectKeys.stats(projectIds),
    enabled: projectIds.length > 0,
    queryFn: () => getProjectStats(projectIds),
    select: (rows) => Object.fromEntries(rows.map((r) => [r.projectId, r])),
  });
}

/** Display names of the people who archived projects (id → name). */
export function useArchiverNames(ids: string[]) {
  return useQuery({
    queryKey: accountKeys.people(ids),
    enabled: ids.length > 0,
    queryFn: () => listVisiblePeople(ids),
    select: (people) => {
      const out: Record<string, string> = {};
      for (const p of people) {
        const name = displayName({ ...p, email: null }, "");
        if (name) out[p.id] = name;
      }
      return out;
    },
  });
}
