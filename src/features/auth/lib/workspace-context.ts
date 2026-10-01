import { ACTIVE_ACCOUNT_STORAGE_KEY, setActiveAccountIdStore } from "./active-account-store";
import { ACTIVE_PROJECT_STORAGE_KEY, setActiveProjectIdStore } from "./active-project-store";

function persist(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable: the in-memory store still switches */
  }
}

/** Points the account/project switchers at a freshly joined project or workspace. */
export function switchWorkspaceContext(projectId?: string | null, accountId?: string | null) {
  if (accountId) {
    persist(ACTIVE_ACCOUNT_STORAGE_KEY, accountId);
    setActiveAccountIdStore(accountId);
  }
  if (projectId) {
    persist(ACTIVE_PROJECT_STORAGE_KEY, projectId);
    setActiveProjectIdStore(projectId);
  }
}
