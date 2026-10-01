import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { isApiError } from "@/shared/api/errors";
import { getMe, getMyAccess, type AccessSummary } from "../api/auth.api";

export const authKeys = {
  all: ["auth"] as const,
  access: () => [...authKeys.all, "access"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

export type SessionState =
  { kind: "anonymous" } | { kind: "archived" } | { kind: "signed-in"; access: AccessSummary };

/** Session read model: anonymous (401), archived (403 ACCOUNT_ARCHIVED) or the access summary. */
export const sessionQuery = queryOptions({
  queryKey: authKeys.access(),
  queryFn: async (): Promise<SessionState> => {
    try {
      return { kind: "signed-in", access: await getMyAccess() };
    } catch (error) {
      if (isApiError(error) && error.status === 401) return { kind: "anonymous" };
      if (isApiError(error) && error.code === "ACCOUNT_ARCHIVED") return { kind: "archived" };
      throw error;
    }
  },
  staleTime: 60_000,
});

export const meQuery = queryOptions({
  queryKey: authKeys.me(),
  queryFn: getMe,
  staleTime: 5 * 60_000,
});

/** Fresh session state for route guards (always revalidated on navigation into a guarded area). */
export function loadSession(queryClient: QueryClient) {
  return queryClient.fetchQuery({ ...sessionQuery, staleTime: 10_000 });
}
