import { queryOptions, useQuery } from "@tanstack/react-query";
import { getPreloginClient, getPublicClient } from "../api/oauth.api";

const oauthKeys = {
  all: ["oauth"] as const,
  prelogin: (clientId: string, oauthQuery: string) =>
    [...oauthKeys.all, "prelogin", clientId, oauthQuery] as const,
  client: (clientId: string) => [...oauthKeys.all, "client", clientId] as const,
};

export const publicClientQuery = (clientId: string) =>
  queryOptions({
    queryKey: oauthKeys.client(clientId),
    queryFn: () => getPublicClient(clientId),
    retry: false,
    staleTime: 60_000,
  });

/** Name of the app asking to connect, shown on the login page (null while unknown). */
export function usePreloginClientName(oauthQuery: string | null): string | null {
  const clientId = oauthQuery ? new URLSearchParams(oauthQuery).get("client_id") : null;
  const { data } = useQuery({
    queryKey: oauthKeys.prelogin(clientId ?? "", oauthQuery ?? ""),
    queryFn: () => getPreloginClient(clientId!, oauthQuery!),
    enabled: Boolean(clientId && oauthQuery),
    retry: false,
    staleTime: Infinity,
  });
  return data?.client_name?.trim() || null;
}
