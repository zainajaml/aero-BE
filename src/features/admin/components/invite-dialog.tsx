import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, UserPlus } from "lucide-react";
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
import { CreateProjectDialog } from "@/features/projects/components/create-project-dialog";
import { projectKeys } from "@/features/projects/hooks/project-queries";
import { useProjects } from "@/features/projects/project-context";
import { useRateCardRoles } from "@/features/tickets/hooks/use-rate-card-roles";
import { createInvitation, resendInvitation } from "@/features/invitations/api/invitations.api";
import type { OrgAccount, OrgProject } from "../api/admin.api";
import { adminKeys, useInvalidateAdmin } from "../hooks/admin-queries";
import { assignableRoles, isClientRole, type RoleValue } from "../lib/roles";
import { SearchableMultiSelect } from "./searchable-multi-select";

const NO_TITLE = "__none__";

type ProjectOption = Pick<OrgProject, "id" | "name" | "accountId">;

export function InviteDialog({
  projects,
  accounts,
  clientAdminOnly = false,
  currentUserIsSuperAdmin = false,
  inviteLimitReached = false,
}: {
  projects: ProjectOption[];
  accounts: OrgAccount[];
  clientAdminOnly?: boolean;
  currentUserIsSuperAdmin?: boolean;
  inviteLimitReached?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RoleValue | "">("");
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const [createdProjects, setCreatedProjects] = useState<ProjectOption[]>([]);
  const [jobTitle, setJobTitle] = useState<string>(NO_TITLE);
  const [emailError, setEmailError] = useState<string | null>(null);
  const qc = useQueryClient();
  const invalidateAdmin = useInvalidateAdmin();
  const [duplicate, setDuplicate] = useState<{
    invitationId: string;
    email: string;
    projectName: string | null;
  } | null>(null);
  const { data: rateRoles = [] } = useRateCardRoles(null);
  const { activeProjectId, isAllProjects, accountFilterId } = useProjects();

  // Projects are always scoped to the account currently open — never fall back
  // to projects from another account.
  const allProjects = [...projects];
  for (const project of createdProjects) {
    if (!allProjects.some((existing) => existing.id === project.id)) allProjects.push(project);
  }
  const scopedProjects = accountFilterId
    ? allProjects.filter((p) => p.accountId === accountFilterId)
    : [];

  // Account/project admins invite into the project & account they are already
  // in — there is nothing to choose, so the pickers are replaced by a label.
  const lockedProjectId =
    !currentUserIsSuperAdmin && activeProjectId && !isAllProjects ? activeProjectId : null;
  const lockedProject = lockedProjectId
    ? (scopedProjects.find((p) => p.id === lockedProjectId) ?? null)
    : null;
  const lockedAccountId = accountFilterId;
  const lockedAccount = lockedAccountId
    ? (accounts.find((a) => a.id === lockedAccountId) ?? null)
    : null;

  const availableRoles = assignableRoles(clientAdminOnly, currentUserIsSuperAdmin);

  const isAccountAdminRole = role === "account_admin";
  const roleSelected = role !== "";
  const requiresProject = role !== "" && isClientRole(role);

  const effectiveProjectIds = lockedProject ? [lockedProject.id] : projectIds;
  const effectiveAccountIds = lockedAccount ? [lockedAccount.id] : [];

  // For account_admin the account scope is sent explicitly, so the invite works
  // even when the account has no projects yet.
  const resolvedProjectIds = isAccountAdminRole ? [] : effectiveProjectIds;

  // Project-level roles need at least one project inside the current account.
  const noProjectsInAccount = scopedProjects.length === 0;
  const blockedForNoProject = requiresProject && noProjectsInAccount;

  const mutation = useMutation({
    mutationFn: () =>
      createInvitation({
        email,
        role: role as RoleValue,
        projectIds: resolvedProjectIds,
        accountIds: isAccountAdminRole ? effectiveAccountIds : [],
        jobTitle: jobTitle === NO_TITLE ? null : jobTitle,
      }),
    onSuccess: (res) => {
      if (res.duplicate) {
        setDuplicate({ invitationId: res.invitation.id, email, projectName: res.projectName });
        return;
      }
      toast.success(
        res.emailQueued
          ? `Invitation sent to ${email}`
          : `Invitation created for ${email} (email pending)`,
      );
      setEmail("");
      setProjectIds([]);
      setRole("");
      setJobTitle(NO_TITLE);
      setOpen(false);
      setDuplicate(null);
      invalidateAdmin();
    },
    onError: (e) => {
      // Email-specific problems (already a member, already invited, invalid
      // address) are shown inline under the field, not as a toast.
      const msg = errorMessage(e) || "Something went wrong.";
      if (/email|member|invit/i.test(msg)) setEmailError(msg);
      else toast.error(msg);
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => resendInvitation(duplicate!.invitationId),
    onSuccess: (res) => {
      toast.success(
        res.emailQueued
          ? `Invitation resent to ${res.email}`
          : `Resend queued for ${res.email} (email pending)`,
      );
      setDuplicate(null);
      setOpen(false);
      invalidateAdmin();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  // Changing the target clears the pending-invite notice so the form can submit.
  useEffect(() => {
    setDuplicate(null);
    setEmailError(null);
  }, [email, role, projectIds]);

  const canSubmit =
    !!email &&
    roleSelected &&
    !blockedForNoProject &&
    (isAccountAdminRole
      ? effectiveAccountIds.length > 0
      : !requiresProject || effectiveProjectIds.length > 0);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          // Drop locally-tracked projects so deleted ones can never linger.
          setCreatedProjects([]);
          void qc.invalidateQueries({ queryKey: adminKeys.all });
          void qc.invalidateQueries({ queryKey: projectKeys.all });
        }
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button disabled={inviteLimitReached}>
          <UserPlus className="h-4 w-4" />
          Invite user
        </Button>
      </DialogTrigger>
      <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Invite a user</DialogTitle>
          <DialogDescription>
            They'll receive an email invitation and be asked to sign up if needed.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="person@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!emailError || !!duplicate}
              className={
                emailError || duplicate
                  ? "border-destructive focus-visible:ring-destructive"
                  : undefined
              }
            />
            {(emailError || duplicate) && (
              <p className="text-xs text-destructive mt-1.5">
                {emailError ||
                  `Already invited${
                    duplicate?.projectName ? ` to ${duplicate.projectName}` : ""
                  }. Resend below.`}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-role">Role</Label>
            <Select value={role || undefined} onValueChange={(v) => setRole(v as RoleValue)}>
              <SelectTrigger id="invite-role">
                <SelectValue placeholder="Select a role..." />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-job-title">Job title</Label>
            <Select value={jobTitle} onValueChange={setJobTitle}>
              <SelectTrigger id="invite-job-title">
                <SelectValue />
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
          <div className="space-y-2">
            {isAccountAdminRole ? (
              <>
                <Label>Account</Label>
                <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm">
                  {lockedAccount?.name ?? "No account selected"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Account Admins have access to all projects within this account.
                </p>
              </>
            ) : blockedForNoProject ? (
              <>
                <Label>Project</Label>
                <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  Create a project before inviting users with project-level access.
                </div>
                <CreateProjectDialog
                  onCreated={(project) => {
                    setCreatedProjects((current) => [...current, project]);
                    setProjectIds([project.id]);
                  }}
                  trigger={
                    <Button variant="outline" size="sm" className="mt-1">
                      <Plus className="h-4 w-4" />
                      Create project
                    </Button>
                  }
                />
              </>
            ) : lockedProject ? (
              <>
                <Label>Project</Label>
                <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm">
                  {lockedProject.name}
                </div>
                <p className="text-xs text-muted-foreground">
                  They'll be invited to the project you're currently in. Switch projects to invite
                  someone elsewhere.
                </p>
              </>
            ) : (
              <>
                <Label>Projects</Label>
                <SearchableMultiSelect
                  items={scopedProjects}
                  selected={projectIds}
                  onChange={setProjectIds}
                  placeholder="Filter projects..."
                  emptyText="No projects in this account."
                />
                <p className="text-xs text-muted-foreground">
                  This role only accesses the projects selected here.
                </p>
              </>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          {duplicate ? (
            <Button onClick={() => resendMutation.mutate()} disabled={resendMutation.isPending}>
              {resendMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Resend invitation
            </Button>
          ) : (
            <Button onClick={() => mutation.mutate()} disabled={!canSubmit || mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Send invitation
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
