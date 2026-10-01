import { useAuth } from "@/features/auth/auth-context";
import { useOptionalProjects } from "@/features/projects/project-context";

/**
 * Viewers have strictly read-only access: they may see every screen in the
 * projects they belong to, but must never be offered create / edit / delete
 * affordances. Mirrors the `NOT is_project_viewer(...)` guards in RLS, so the
 * UI never invites an action the database will reject.
 *
 * Archived projects are read-only for everyone (enforced in the database too).
 * Pass a project id to check that project; otherwise the active project is used.
 */
export function useCanWrite(projectId?: string | null): boolean {
  const { hasAnyRole } = useAuth();
  const archived = useProjectArchived(projectId);
  return !hasAnyRole(["viewer"]) && !archived;
}

/** True when the given (or active) project is archived. */
export function useProjectArchived(projectId?: string | null): boolean {
  const ctx = useOptionalProjects();
  if (!ctx) return false;
  const id = projectId === undefined ? ctx.activeProjectId : projectId;
  if (!id) return false;
  return !!ctx.allProjects.find((p) => p.id === id)?.archivedAt;
}

export const VIEW_ONLY_MSG = "You have view-only access — changes are not allowed.";
export const ARCHIVED_MSG = "This project is archived — restore it to make changes.";
