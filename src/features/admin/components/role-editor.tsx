import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { errorMessage } from "@/shared/api/errors";
import { jobTitlesForRole } from "@/shared/lib/job-titles";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { useProjects } from "@/features/projects/project-context";
import { useRateCardRoles } from "@/features/tickets/hooks/use-rate-card-roles";
import { displayName } from "@/features/users/lib/names";
import { updateUserAccess, type OrgAccount, type OrgProject, type OrgUser } from "../api/admin.api";
import {
  ROLE_OPTIONS,
  assignableRoles,
  isClientRole,
  roleLabel,
  type RoleValue,
} from "../lib/roles";
import { SearchableMultiSelect } from "./searchable-multi-select";

const NO_TITLE = "__none__";

export function RoleEditor({
  user,
  projects,
  accounts,
  clientAdminOnly = false,
  currentUserIsSuperAdmin = false,
  isSuperAdmin = false,
  roleLocked = false,
  globalView = false,
  onSaved,
}: {
  user: OrgUser;
  projects: OrgProject[];
  accounts: OrgAccount[];
  clientAdminOnly?: boolean;
  currentUserIsSuperAdmin?: boolean;
  isSuperAdmin?: boolean;
  roleLocked?: boolean;
  /** Super Admin global view: edit outside the currently open account/project. */
  globalView?: boolean;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { data: rateRoles = [] } = useRateCardRoles(null);
  const [role, setRole] = useState<RoleValue | "">(user.role ?? "");
  const [projectIds, setProjectIds] = useState<string[]>(user.projectIds);
  const [jobTitle, setJobTitle] = useState<string>(user.jobTitle ?? NO_TITLE);
  const [firstName, setFirstName] = useState<string>(user.firstName ?? "");
  const [lastName, setLastName] = useState<string>(user.lastName ?? "");
  const { activeProjectId, isAllProjects, accountFilterId } = useProjects();

  // Non-super admins edit access within the project/account they are already
  // in — the pickers are replaced by a read-only label.
  const lockedProjectId = !globalView && activeProjectId && !isAllProjects ? activeProjectId : null;
  const lockedProject = lockedProjectId
    ? (projects.find((p) => p.id === lockedProjectId) ?? null)
    : null;
  const lockedAccountId = globalView ? null : accountFilterId;
  const lockedAccount = lockedAccountId
    ? (accounts.find((a) => a.id === lockedAccountId) ?? null)
    : null;

  const availableRoles = assignableRoles(clientAdminOnly, currentUserIsSuperAdmin);

  // Always keep the member's current role visible in the dropdown.
  const currentRoleOption = ROLE_OPTIONS.find((o) => o.value === user.role);
  const roleOptions =
    currentRoleOption && !availableRoles.some((o) => o.value === user.role)
      ? [currentRoleOption, ...availableRoles]
      : availableRoles;

  const isAccountAdminRole = role === "account_admin";
  const roleSelected = role !== "";
  const requiresProject = role !== "" && isClientRole(role);

  const effectiveProjectIds = lockedProject ? [lockedProject.id] : projectIds;
  const effectiveAccountIds = lockedAccount ? [lockedAccount.id] : [];

  const mutation = useMutation({
    mutationFn: () =>
      updateUserAccess(user.id, {
        role: role as RoleValue,
        // Account Admin is granted on the account itself (works for accounts with no projects).
        ...(isAccountAdminRole
          ? { accountIds: effectiveAccountIds }
          : { projectIds: effectiveProjectIds }),
        contextProjectId: lockedProjectId,
        contextAccountId: lockedAccountId,
        jobTitle: jobTitle === NO_TITLE ? null : jobTitle,
        ...(isSuperAdmin
          ? { firstName: firstName.trim() || null, lastName: lastName.trim() || null }
          : {}),
      }),
    onSuccess: () => {
      toast.success("Member updated");
      setOpen(false);
      onSaved();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const canSubmit =
    roleSelected &&
    (isAccountAdminRole
      ? effectiveAccountIds.length > 0
      : !requiresProject || effectiveProjectIds.length > 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={!!user.archivedAt}
          title={user.archivedAt ? "Archived users cannot be edited" : "Edit member"}
          className="shrink-0 whitespace-nowrap disabled:cursor-not-allowed disabled:text-muted-foreground disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
        >
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Edit {displayName(user, "user")}</DialogTitle>
          <DialogDescription>Update role and project access.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {isSuperAdmin && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-first-name">First name</Label>
                <Input
                  id="edit-first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-last-name">Last name</Label>
                <Input
                  id="edit-last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label>Role</Label>
            {roleLocked ? (
              <>
                <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  {roleLabel(user.role)}
                </div>
                <p className="text-xs text-muted-foreground">
                  You are the last Account Admin for this account, so your role can't be changed.
                  Assign another Account Admin first.
                </p>
              </>
            ) : (
              <Select value={role || undefined} onValueChange={(v) => setRole(v as RoleValue)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role..." />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          {roleSelected && role !== "super_admin" && (
            <div className="space-y-2">
              <Label>Job title</Label>
              <Select value={jobTitle} onValueChange={setJobTitle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a job title" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_TITLE}>No job title</SelectItem>
                  {(rateRoles.length > 0 ? rateRoles : jobTitlesForRole(role || "viewer")).map(
                    (t: string) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
          {roleSelected && role !== "super_admin" ? (
            isAccountAdminRole ? (
              <div className="space-y-2">
                <Label>Account</Label>
                <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  {lockedAccount?.name ?? "No account selected"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Account Admins gain access to every project inside this account. Switch accounts
                  to change access elsewhere.
                </p>
              </div>
            ) : lockedProject ? (
              <div className="space-y-2">
                <Label>Project</Label>
                <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  {lockedProject.name}
                </div>
                <p className="text-xs text-muted-foreground">
                  This role applies to the project you're currently in. Switch projects to change
                  access elsewhere.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Projects{requiresProject ? "" : " (optional)"}</Label>
                <SearchableMultiSelect
                  items={projects}
                  selected={projectIds}
                  onChange={setProjectIds}
                  placeholder="Filter projects..."
                  emptyText="No projects available."
                />
                <p className="text-xs text-muted-foreground">
                  {requiresProject
                    ? "This role only accesses the projects selected here."
                    : "Super Admins can access every project, but only appear in dropdowns for the projects selected here."}
                </p>
              </div>
            )
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={!canSubmit || mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
