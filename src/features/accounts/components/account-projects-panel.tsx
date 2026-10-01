import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Archive, Building2, Folder, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import { useProjects, type Project } from "@/features/projects/project-context";
import { CreateProjectDialog } from "@/features/projects/components/create-project-dialog";
import { EditProjectDialog } from "@/features/projects/components/edit-project-dialog";
import { useArchiveProject } from "@/features/projects/hooks/use-archive-project";
import { useDeleteProject } from "@/features/projects/hooks/use-project-mutations";
import { useTimezone } from "@/features/users/lib/timezone";
import {
  useAccountDetail,
  useArchiverNames,
  useProjectStatsMap,
} from "../hooks/use-account-panel-data";
import { DeleteAccountDialog, EditAccountDialog } from "./account-dialogs";
import { AccountProjectRow } from "./account-project-row";
import { CreateAccountButton } from "./create-account-button";
import { ArchiveProjectDialog, DeleteProjectDialog } from "./project-action-dialogs";

const VIEWS = ["active", "archived", "all"] as const;
type View = (typeof VIEWS)[number];

/**
 * Admin › Accounts & projects. Shows ONLY the currently open account (the one
 * selected in the account switcher) plus the projects that belong to it.
 */
export function AccountProjectsPanel() {
  const tz = useTimezone();
  const queryClient = useQueryClient();
  const { hasAnyRole, projectRoles } = useAuth();
  // hasAnyRole is context-scoped: it resolves account_admin only for the account
  // currently open in the switcher, so management actions follow the active context.
  const {
    accountFilterId,
    accounts,
    visibleProjects,
    archivedProjects,
    isLoading,
    setActiveProjectId,
  } = useProjects();
  const navigate = useNavigate();

  const canManageAccount = hasAnyRole(["super_admin", "account_admin"]);
  const canEditProject = (id: string) => canManageAccount || projectRoles[id] === "admin";
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [archiveProject, setArchiveProject] = useState<Project | null>(null);
  const [view, setView] = useState<View>("active");
  const archiveMut = useArchiveProject(() => setArchiveProject(null));
  const removeProject = useDeleteProject(() => {
    // Member lists drop the deleted project's rows.
    void queryClient.invalidateQueries({ queryKey: ["admin"] });
    setDeleteProject(null);
  });

  const account = accounts.find((a) => a.id === accountFilterId) ?? null;
  const detail = useAccountDetail(accountFilterId);

  // Archived projects are only ever listed for account admins / super admins.
  const accountArchived = canManageAccount
    ? archivedProjects.filter((p) => p.accountId === accountFilterId)
    : [];
  const effectiveView = canManageAccount ? view : "active";
  const listedProjects =
    effectiveView === "active"
      ? visibleProjects
      : effectiveView === "archived"
        ? accountArchived
        : [...visibleProjects, ...accountArchived];
  const totalProjects = visibleProjects.length + accountArchived.length;

  const archiverIds = Array.from(
    new Set(accountArchived.map((p) => p.archivedBy).filter((id): id is string => !!id)),
  );
  const { data: archiverNames = {} } = useArchiverNames(archiverIds);
  const { data: stats } = useProjectStatsMap(listedProjects.map((p) => p.id));

  const openProject = (p: Project) => {
    setActiveProjectId(p.id);
    void navigate({ to: p.projectType === "kanban" ? "/board" : "/backlog" });
  };

  if (!accountFilterId) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Building2 className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No account selected</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick an account in the switcher to manage it here.
        </p>
      </div>
    );
  }

  const accountName = detail?.name ?? account?.name ?? "Account";
  const chip =
    "inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-2.5 py-0.5 text-[11px]";

  return (
    <div className="space-y-5 p-4">
      {/* Account hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-background to-background p-4">
        <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Currently open account
              </p>
              <h2 className="truncate text-xl font-semibold leading-tight">{accountName}</h2>
            </div>
          </div>
          {canManageAccount && (
            <div className="flex shrink-0 items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setEditOpen(true)}
                aria-label="Edit account"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
                aria-label="Delete account"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        <div className="relative mt-3.5 flex flex-wrap items-center gap-2">
          <span className={chip}>
            <span className="text-muted-foreground">ID</span>
            <span className="font-mono">{detail?.slug ?? "—"}</span>
          </span>
          <span className={chip}>
            <span className="text-muted-foreground">Created</span>
            <span className="tabular-nums">
              {detail?.createdAt
                ? tz.formatDate(detail.createdAt, {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "—"}
            </span>
          </span>
          <span className={chip}>
            <span className="text-muted-foreground">Projects</span>
            <span className="font-semibold tabular-nums">{visibleProjects.length}</span>
          </span>
          <span className={chip}>
            <span className="text-muted-foreground">People</span>
            <span className="font-semibold tabular-nums">
              {Object.values(stats ?? {}).reduce((n, s) => n + s.members, 0)}
            </span>
          </span>
        </div>
      </section>

      {/* Projects in this account */}
      <section className="space-y-2">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <div className="flex min-w-0 items-baseline gap-2">
            <h3 className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Projects
            </h3>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums">
              {listedProjects.length}
            </span>
            {canManageAccount && (
              <div
                role="tablist"
                aria-label="Filter projects"
                className="ml-1 inline-flex items-center rounded-full border border-border bg-background/60 p-0.5"
              >
                {VIEWS.map((value) => (
                  <button
                    key={value}
                    role="tab"
                    aria-selected={view === value}
                    onClick={() => setView(value)}
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                      view === value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {value === "active"
                      ? "Active"
                      : value === "archived"
                        ? `Archived${accountArchived.length ? ` (${accountArchived.length})` : ""}`
                        : "All"}
                  </button>
                ))}
              </div>
            )}
          </div>
          {canManageAccount && (
            <div className="flex shrink-0 items-center gap-2">
              <CreateAccountButton />
              <CreateProjectDialog />
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">Loading…</div>
        ) : listedProjects.length === 0 && effectiveView === "archived" ? (
          <div className="rounded-2xl border border-dashed border-border py-8 text-center">
            <div className="mx-auto grid h-9 w-9 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <Archive className="h-4 w-4" />
            </div>
            <h4 className="mt-2 text-sm font-semibold">No archived projects</h4>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Archived projects appear here, ready to view or restore.
            </p>
          </div>
        ) : listedProjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-8 text-center">
            <div className="mx-auto grid h-9 w-9 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Folder className="h-4 w-4" />
            </div>
            <h4 className="mt-2 text-sm font-semibold">No projects yet</h4>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Use <span className="font-medium text-foreground">New project</span> to add the first
              one.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
            {listedProjects.map((p) => (
              <AccountProjectRow
                key={p.id}
                project={p}
                stats={stats?.[p.id]}
                archiverName={p.archivedBy ? archiverNames[p.archivedBy] : undefined}
                canEdit={canEditProject(p.id)}
                canManageAccount={canManageAccount}
                restorePending={archiveMut.isPending}
                onOpen={() => openProject(p)}
                onSelect={() => setActiveProjectId(p.id)}
                onEdit={() => setEditProject(p)}
                onArchive={() => setArchiveProject(p)}
                onRestore={() => archiveMut.mutate({ project: p, archived: false })}
                onDelete={() => setDeleteProject(p)}
              />
            ))}
          </div>
        )}
      </section>

      <EditAccountDialog
        accountId={accountFilterId}
        initialName={accountName}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <DeleteAccountDialog
        accountId={accountFilterId}
        accountName={accountName}
        totalProjects={totalProjects}
        archivedCount={accountArchived.length}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />

      {editProject && (
        <EditProjectDialog
          project={editProject}
          open={!!editProject}
          onOpenChange={(o) => !o && setEditProject(null)}
        />
      )}

      <ArchiveProjectDialog
        project={archiveProject}
        pending={archiveMut.isPending}
        onClose={() => setArchiveProject(null)}
        onConfirm={(project) => archiveMut.mutate({ project, archived: true })}
      />

      <DeleteProjectDialog
        project={deleteProject}
        pending={removeProject.isPending}
        onClose={() => setDeleteProject(null)}
        onConfirm={(project) => removeProject.mutate(project)}
      />
    </div>
  );
}
