import { useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Archive, Loader2, Trash2 } from "lucide-react";
import { errorMessage } from "@/shared/api/errors";
import { Button } from "@/shared/ui/button";
import { ConfirmDelete } from "@/shared/ui/confirm-delete";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { useProjects } from "@/features/projects/project-context";
import { displayName } from "@/features/users/lib/names";
import {
  removeUserAccess,
  updateUserAccess,
  type OrgUser,
  type OrgUserList,
  type UpdateUserAccessRequest,
} from "../../api/admin.api";
import { useInvalidateAdmin, useOrgUsers } from "../../hooks/admin-queries";
import { ROLE_OPTIONS, isClientRole, roleLabel, type RoleValue } from "../../lib/roles";
import { labelHelpers } from "../../lib/user-rows";

/**
 * Body for the inline role select: carries the user's current projects/accounts so the change
 * keeps their access (an empty body would strip it). Returns an error message when the new role
 * needs a scope the user does not have yet.
 */
function roleChangeBody(
  u: OrgUser,
  role: RoleValue,
  data: OrgUserList | undefined,
): UpdateUserAccessRequest | string {
  if (role === "account_admin") {
    const accountIds = u.accountIds.length
      ? u.accountIds
      : Array.from(
          new Set(
            u.projectIds
              .map((pid) => data?.projects.find((p) => p.id === pid)?.accountId)
              .filter((id): id is string => !!id),
          ),
        );
    if (accountIds.length === 0) return "Select an account for the Account Admin role.";
    return { role, accountIds };
  }
  if (isClientRole(role) && u.projectIds.length === 0)
    return "Client roles require at least one project";
  return { role, projectIds: u.projectIds };
}

/** Super Admin › Users: every user in the workspace (filtered by the open account/project). */
export function SuperUsersPanel() {
  const { activeProjectId, isAllProjects, accountFilterId } = useProjects();
  const { data, isLoading } = useOrgUsers(null);
  const invalidate = useInvalidateAdmin();
  const helpers = useMemo(() => labelHelpers(data), [data]);

  const updateRole = useMutation({
    mutationFn: async ({ user, role }: { user: OrgUser; role: RoleValue }) => {
      const body = roleChangeBody(user, role, data);
      if (typeof body === "string") throw new Error(body);
      await updateUserAccess(user.id, body);
    },
    onSuccess: (_r, { user }) => {
      toast.success("Role updated");
      invalidate(user.id);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  // Super admins may hard-delete footprint-free users; others only lose their access.
  const remove = useMutation({
    mutationFn: (userId: string) => removeUserAccess(userId),
    onSuccess: (_r, userId) => {
      toast.success("User removed");
      invalidate(userId);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const users = useMemo(() => {
    const list = data?.users ?? [];
    const filtered = list.filter((u) => {
      // Super admins always visible (workspace-wide access)
      if (u.role === "super_admin") return true;
      if (activeProjectId && !isAllProjects) return u.projectIds.includes(activeProjectId);
      if (accountFilterId) {
        return u.projectIds.some(
          (pid) => data?.projects.find((p) => p.id === pid)?.accountId === accountFilterId,
        );
      }
      return true;
    });
    return [...filtered].sort((a, b) => {
      const c = helpers
        .accountLabel(a)
        .toLowerCase()
        .localeCompare(helpers.accountLabel(b).toLowerCase());
      if (c !== 0) return c;
      return (a.firstName ?? a.email ?? "").localeCompare(b.firstName ?? b.email ?? "");
    });
  }, [data, helpers, activeProjectId, isAllProjects, accountFilterId]);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="shrink-0">
        <h2 className="font-display text-lg font-semibold">Users</h2>
        <p className="text-sm text-muted-foreground">
          View every user in the workspace. Change roles or remove users entirely. Use the Admin
          section to invite new users.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading users…
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
          <div className="min-w-[1080px]">
            <Table
              containerClassName="overflow-visible"
              className="w-full table-fixed [&_td]:py-1 [&_th]:h-7 [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-background"
            >
              <colgroup>
                <col style={{ width: "180px", minWidth: "180px" }} />
                <col style={{ width: "180px", minWidth: "180px" }} />
                <col style={{ width: "140px", minWidth: "140px" }} />
                <col style={{ width: "220px", minWidth: "220px" }} />
                <col style={{ width: "150px", minWidth: "150px" }} />
                <col style={{ width: "130px", minWidth: "130px" }} />
                <col style={{ width: "80px", minWidth: "80px" }} />
              </colgroup>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-44">Role</TableHead>
                  <TableHead>Job title</TableHead>
                  <TableHead className="w-16 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="truncate text-sm text-muted-foreground">
                      {helpers.accountLabel(u)}
                    </TableCell>
                    <TableCell className="truncate text-sm text-muted-foreground">
                      {helpers.projectsLabel(u)}
                    </TableCell>
                    <TableCell className="truncate font-medium">{displayName(u, "—")}</TableCell>
                    <TableCell className="truncate text-sm text-muted-foreground">
                      {u.email || "—"}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={u.role ?? ""}
                        onValueChange={(v) => updateRole.mutate({ user: u, role: v as RoleValue })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="—">{roleLabel(u.role)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="truncate text-sm text-muted-foreground">
                      {u.jobTitle || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <ConfirmDelete
                        title={u.hasActivity ? "Archive user?" : "Delete user?"}
                        description={
                          u.hasActivity
                            ? `${displayName(u, u.email ?? "This user")} has activity in the workspace, so they can only be archived — access is removed but their history stays visible.`
                            : `${displayName(u, u.email ?? "This user")} has no records, so their account will be permanently deleted.`
                        }
                        onConfirm={() => remove.mutate(u.id)}
                        trigger={
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            {u.hasActivity ? (
                              <Archive className="h-4 w-4" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-6 text-center text-sm text-muted-foreground"
                    >
                      No users yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
