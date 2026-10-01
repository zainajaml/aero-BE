import { displayName } from "@/features/users/lib/names";
import type { OrgInvitation, OrgUser, OrgUserList } from "../api/admin.api";
import { roleLabel } from "./roles";

export type SortDir = "asc" | "desc" | null;
export type SortKey = "first" | "last" | "email" | "role" | "job" | "status" | "projects" | null;

export type UserRow = OrgUser & { rowProjectLabel: string; rowKey: string; rowProjectId?: string };
export type InvitationRow = OrgInvitation & { rowProjectLabel: string; rowKey: string };

/** The account/project currently open in the switcher. */
export type ScopeContext = {
  activeProjectId: string | null;
  isAllProjects: boolean;
  accountFilterId: string | null;
  activeAccountId: string | null;
  showAllUsers: boolean;
};

/** Name/label lookups over one listing response. */
export function labelHelpers(data: OrgUserList | undefined) {
  const projectName = (id: string) =>
    data?.projects.find((p) => p.id === id)?.name ?? "Unknown project";
  const accountName = (accountId: string | null) =>
    data?.accounts.find((a) => a.id === accountId)?.name ?? null;
  const accountsOf = (projectIds: string[]) => {
    const names = Array.from(
      new Set(
        projectIds
          .map((pid) => data?.projects.find((p) => p.id === pid)?.accountId)
          .filter((id): id is string => !!id)
          .map((id) => accountName(id))
          .filter((n): n is string => !!n),
      ),
    );
    return names.length ? names.join(", ") : "—";
  };
  const projectsLabel = (u: { projectIds: string[]; role: string | null }) =>
    u.role === "super_admin"
      ? "All projects"
      : u.projectIds.length
        ? u.projectIds.map(projectName).join(", ")
        : "—";
  const accountLabel = (u: { projectIds: string[]; role: string | null }) =>
    u.role === "super_admin" ? "All accounts" : accountsOf(u.projectIds);
  const projectMatchesScope = (pid: string, ctx: ScopeContext) => {
    if (ctx.activeProjectId && !ctx.isAllProjects) return pid === ctx.activeProjectId;
    if (ctx.accountFilterId) {
      const proj = data?.projects.find((p) => p.id === pid);
      return proj?.accountId === ctx.accountFilterId;
    }
    return true;
  };
  return { projectName, accountName, projectsLabel, accountLabel, projectMatchesScope };
}

const nameOf = (u: OrgUser) => displayName(u, "Unknown");

/** Default order is first name then last name; otherwise by the chosen column. */
export function sortUsers(
  users: OrgUser[],
  sortKey: SortKey,
  sortDir: SortDir,
  projectsLabel: (u: OrgUser) => string,
) {
  if (!sortKey || !sortDir) {
    return [...users].sort((a, b) => {
      const cmpFirst = (a.firstName ?? nameOf(a))
        .toLowerCase()
        .localeCompare((b.firstName ?? nameOf(b)).toLowerCase());
      if (cmpFirst !== 0) return cmpFirst;
      return (a.lastName ?? "").toLowerCase().localeCompare((b.lastName ?? "").toLowerCase());
    });
  }
  const dir = sortDir === "asc" ? 1 : -1;
  const value = (u: OrgUser): string => {
    switch (sortKey) {
      case "first":
        return u.firstName ?? nameOf(u);
      case "last":
        return u.lastName ?? "";
      case "email":
        return u.email ?? "";
      case "job":
        return u.jobTitle ?? "";
      case "role":
        return roleLabel(u.role);
      case "status":
        return u.archivedAt ? "Archived" : "Active";
      case "projects":
        return projectsLabel(u);
    }
  };
  return [...users].sort((a, b) => value(a).localeCompare(value(b)) * dir);
}

export function matchesUserSearch(
  u: OrgUser,
  q: string,
  helpers: ReturnType<typeof labelHelpers>,
) {
  return [
    nameOf(u),
    u.email || "",
    u.jobTitle || "",
    roleLabel(u.role),
    helpers.projectsLabel(u),
    helpers.accountLabel(u),
  ].some((v) => v.toLowerCase().includes(q));
}

export function matchesInvitationSearch(
  inv: OrgInvitation,
  q: string,
  helpers: ReturnType<typeof labelHelpers>,
) {
  return [
    inv.email,
    roleLabel(inv.role),
    inv.jobTitle || "",
    helpers.projectsLabel(inv),
    helpers.accountLabel(inv),
  ].some((v) => v.toLowerCase().includes(q));
}

/** One row per user-project combination within the current scope. */
export function expandUsers(
  users: OrgUser[],
  ctx: ScopeContext,
  helpers: ReturnType<typeof labelHelpers>,
  sortKey: SortKey,
  sortDir: SortDir,
): UserRow[] {
  const { activeProjectId, isAllProjects, accountFilterId, activeAccountId, showAllUsers } = ctx;
  const rows: UserRow[] = [];
  for (const u of users) {
    if (u.role === "super_admin") {
      if (!showAllUsers) continue;
      // Super admins implicitly have access to every project. Show them
      // on every scoped board with the current scope's label.
      let label = "All projects";
      if (activeProjectId && !isAllProjects) label = helpers.projectName(activeProjectId);
      else if (accountFilterId) label = helpers.accountName(accountFilterId) ?? "All projects";
      rows.push({ ...u, rowProjectLabel: label, rowKey: u.id });
    } else if (u.projectIds.length === 0) {
      // Account-wide members (e.g. Account Admins) have no project rows but
      // belong to the account currently in context.
      const accountScoped = !!activeAccountId && u.accountIds.includes(activeAccountId);
      if (showAllUsers || accountScoped || ((!activeProjectId || isAllProjects) && !accountFilterId)) {
        rows.push({
          ...u,
          rowProjectLabel: accountScoped ? "All projects" : helpers.projectsLabel(u),
          rowKey: u.id,
        });
      }
    } else {
      for (const pid of u.projectIds) {
        if (!showAllUsers && !helpers.projectMatchesScope(pid, ctx)) continue;
        rows.push({
          ...u,
          rowProjectLabel: helpers.projectName(pid),
          rowKey: `${u.id}:${pid}`,
          rowProjectId: pid,
        });
      }
    }
  }
  if (sortKey === "projects" && sortDir) {
    const dir = sortDir === "asc" ? 1 : -1;
    rows.sort((a, b) => a.rowProjectLabel.localeCompare(b.rowProjectLabel) * dir);
  }
  return rows;
}

export function expandInvitations(
  invitations: OrgInvitation[],
  ctx: ScopeContext,
  helpers: ReturnType<typeof labelHelpers>,
): InvitationRow[] {
  const { activeProjectId, isAllProjects, accountFilterId, activeAccountId } = ctx;
  const rows: InvitationRow[] = [];
  for (const inv of invitations) {
    if (inv.role === "super_admin") {
      rows.push({ ...inv, rowProjectLabel: helpers.projectsLabel(inv), rowKey: inv.id });
    } else if (inv.projectIds.length === 0) {
      // Account-level invitations (Account Admin) belong to the account in context.
      const accountScoped = !!activeAccountId && inv.accountIds.includes(activeAccountId);
      if (accountScoped || ((!activeProjectId || isAllProjects) && !accountFilterId)) {
        rows.push({
          ...inv,
          rowProjectLabel: accountScoped ? "All projects" : helpers.projectsLabel(inv),
          rowKey: inv.id,
        });
      }
    } else {
      for (const pid of inv.projectIds) {
        if (!helpers.projectMatchesScope(pid, ctx)) continue;
        rows.push({ ...inv, rowProjectLabel: helpers.projectName(pid), rowKey: `${inv.id}:${pid}` });
      }
    }
  }
  return rows;
}
