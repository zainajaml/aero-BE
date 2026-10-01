/**
 * Tiny external store for the currently active (selected) account id.
 *
 * AuthProvider sits above ProjectProvider, so it cannot read `useProjects()`.
 * ProjectProvider publishes the account filter here and AuthProvider subscribes
 * to it, so account-scoped roles resolve against the account the user actually
 * has open — not merely "the user administers some account somewhere".
 */

export const ACTIVE_ACCOUNT_STORAGE_KEY = "aero-account-filter";

let current: string | null =
  typeof window !== "undefined" ? localStorage.getItem(ACTIVE_ACCOUNT_STORAGE_KEY) : null;

const listeners = new Set<() => void>();

export function getActiveAccountId(): string | null {
  return current;
}

export function setActiveAccountIdStore(id: string | null) {
  if (current === id) return;
  current = id;
  listeners.forEach((l) => l());
}

export function subscribeActiveAccountId(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
