import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authKeys } from "@/features/auth/hooks/auth-queries";
import { moveProject } from "@/features/projects/api/projects.api";
import { projectKeys } from "@/features/projects/hooks/project-queries";
import { errorMessage } from "@/shared/api/errors";
import { createAccount, deleteAccount, updateAccount } from "../api/accounts.api";
import { accountKeys } from "./account-queries";

/** Accounts, projects and the caller's admin scope can all change with an account write. */
export function invalidateAccountScope(queryClient: QueryClient, { auth = false } = {}) {
  void queryClient.invalidateQueries({ queryKey: accountKeys.all });
  void queryClient.invalidateQueries({ queryKey: projectKeys.all });
  if (auth) void queryClient.invalidateQueries({ queryKey: authKeys.all });
}

export function useCreateAccount(onCreated: (account: { id: string; name: string }) => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; slug: string | null }) => createAccount(input),
    onSuccess: (account) => {
      toast.success("Account created");
      // Non-super creators become admins of the new account.
      invalidateAccountScope(queryClient, { auth: true });
      onCreated(account);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}

export function useUpdateAccount(accountId: string | null, onDone: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: { name?: string; slug?: string }) => updateAccount(accountId!, patch),
    onSuccess: () => {
      toast.success("Account updated");
      invalidateAccountScope(queryClient);
      onDone();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}

export function useDeleteAccount(
  accountId: string | null,
  {
    force,
    successMessage,
    onDone,
  }: { force: boolean; successMessage: () => string; onDone?: () => void },
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteAccount(accountId!, force),
    onSuccess: () => {
      toast.success(successMessage());
      invalidateAccountScope(queryClient, { auth: true });
      onDone?.();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}

export function useMoveProject(project: { id: string; name: string }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (accountId: string) => moveProject(project.id, accountId),
    onSuccess: () => {
      toast.success(`Moved "${project.name}"`);
      invalidateAccountScope(queryClient, { auth: true });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}
