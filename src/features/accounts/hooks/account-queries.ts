import { useQuery } from "@tanstack/react-query";
import { listAdministeredAccounts } from "../api/accounts.api";

export const accountKeys = {
  /** Prefix shared with `projectKeys.accounts` (["accounts", "visible", userId]). */
  all: ["accounts"] as const,
  administered: () => [...accountKeys.all, "administered"] as const,
  people: (ids: string[]) => [...accountKeys.all, "people", ids.join(",")] as const,
};

/** Accounts the caller administers (every account for super admins), with their projects. */
export function useAdministeredAccounts() {
  return useQuery({ queryKey: accountKeys.administered(), queryFn: listAdministeredAccounts });
}
