/**
 * Tiny external store for the currently active project id.
 *
 * AuthProvider sits above ProjectProvider in the tree, so it cannot use
 * `useProjects()` to learn which project is active. This store bridges the two:
 * ProjectProvider publishes the active project, AuthProvider subscribes to it in
 * order to resolve project-scoped roles.
 */

export const ACTIVE_PROJECT_STORAGE_KEY = "aero-active-project";

let current: string | null =
  typeof window !== "undefined" ? localStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY) : null;

const listeners = new Set<() => void>();

export function getActiveProjectId(): string | null {
  return current;
}

export function setActiveProjectIdStore(id: string | null) {
  if (current === id) return;
  current = id;
  listeners.forEach((l) => l());
}

export function subscribeActiveProjectId(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
