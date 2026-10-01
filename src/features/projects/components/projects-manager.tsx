import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/auth-context";
import { useProjects, type Project } from "@/features/projects/project-context";
import { getProjectStats } from "@/features/projects/api/projects.api";
import { projectKeys } from "@/features/projects/hooks/project-queries";
import { useDeleteProject } from "@/features/projects/hooks/use-project-mutations";
import {
  sortProjects,
  type ProjectRowStat,
  type SortDir,
  type SortKey,
} from "@/features/projects/lib/project-table-sort";
import { useTimezone } from "@/features/users/lib/timezone";
import { CreateProjectDialog } from "./create-project-dialog";
import { EditProjectDialog } from "./edit-project-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Folder, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== col) return <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-40" />;
  if (sortDir === "asc") return <ArrowUp className="ml-1 h-3.5 w-3.5 text-foreground" />;
  return <ArrowDown className="ml-1 h-3.5 w-3.5 text-foreground" />;
}

const COLUMNS: { key: Exclude<SortKey, null>; label: string; right?: boolean }[] = [
  { key: "account", label: "Account" },
  { key: "key", label: "Code" },
  { key: "name", label: "Project name" },
  { key: "type", label: "Type" },
  { key: "status", label: "Status" },
  { key: "sprints", label: "Sprints", right: true },
  { key: "tickets", label: "Tickets", right: true },
  { key: "started", label: "Started" },
  { key: "finished", label: "Finished" },
];

export function ProjectsManager() {
  const {
    visibleProjects: projects,
    accounts,
    isLoading,
    setActiveProjectId,
  } = useProjects();
  const { hasAnyRole } = useAuth();
  const canCreateProjects = hasAnyRole(["super_admin", "account_admin"]);
  const tz = useTimezone();
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const projectIds = projects.map((p) => p.id);
  const { data: statRows } = useQuery({
    queryKey: projectKeys.stats(projectIds),
    enabled: projectIds.length > 0,
    queryFn: () => getProjectStats(projectIds),
  });
  const stats = useMemo(() => {
    const result: Record<string, ProjectRowStat> = {};
    for (const s of statRows ?? []) {
      result[s.projectId] = {
        tickets: s.tickets,
        sprints: s.sprints,
        status: s.activeSprint ? "Active" : s.sprints > 0 ? "Planning" : "No sprints",
        finished: s.lastSprintEndsAt,
      };
    }
    return result;
  }, [statRows]);

  const remove = useDeleteProject(() => setDeleteProject(null));

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : d === "desc" ? null : "asc"));
      if (sortDir === "desc") setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const accountById = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of accounts) map.set(a.id, a.name);
    return map;
  }, [accounts]);

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => {
      const accountName = accountById.get(p.accountId)?.toLowerCase() ?? "";
      return (
        p.name.toLowerCase().includes(q) ||
        p.key.toLowerCase().includes(q) ||
        (p.clientAccount && p.clientAccount.toLowerCase().includes(q)) ||
        accountName.includes(q) ||
        p.projectType.toLowerCase().includes(q)
      );
    });
  }, [projects, searchQuery, accountById]);

  const sortedProjects = useMemo(
    () => sortProjects(filteredProjects, stats, accountById, sortKey, sortDir),
    [filteredProjects, stats, accountById, sortKey, sortDir],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 pl-9"
          />
        </div>
        <div className="flex items-center gap-3">
          {canCreateProjects && projects.length === 0 && !isLoading && (
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Start here — create your first project
            </span>
          )}
          {canCreateProjects && <CreateProjectDialog />}
        </div>
      </div>

      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : projects.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Folder className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Use <span className="font-medium text-foreground">New project</span> above to create
              your first project. You can add more here any time.
            </p>
          </div>
        ) : (
          <Table className="w-full min-w-[1000px] table-fixed [&_td]:truncate [&_td]:py-1.5 [&_th]:h-8 [&_th]:py-1.5">
            <colgroup>
              <col style={{ width: 130 }} />
              <col style={{ width: 70 }} />
              <col style={{ width: 160 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 80 }} />
              <col style={{ width: 80 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 90 }} />
            </colgroup>
            <TableHeader>
              <TableRow>
                {COLUMNS.map((col) => (
                  <TableHead key={col.key} className={col.right ? "text-right" : undefined}>
                    <button
                      onClick={() => handleSort(col.key)}
                      className={
                        col.right
                          ? "ml-auto flex items-center font-medium"
                          : "flex items-center font-medium"
                      }
                    >
                      {col.label} <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />
                    </button>
                  </TableHead>
                ))}
                <TableHead className="text-right">Settings</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProjects.map((p) => {
                const s = stats[p.id];
                return (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm">{accountById.get(p.accountId) ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{p.key}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => setActiveProjectId(p.id)}
                        className="text-left font-medium hover:underline transition-colors"
                      >
                        {p.name}
                        {p.clientAccount && (
                          <span className="block text-xs text-muted-foreground">
                            {p.clientAccount}
                          </span>
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="capitalize text-sm">{p.projectType}</TableCell>
                    <TableCell className="text-sm">
                      {p.projectType === "kanban" ? (
                        <span className="text-muted-foreground">n/a</span>
                      ) : (
                        <span>{s?.status ?? "No sprints"}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.projectType === "kanban" ? (
                        <span className="text-muted-foreground">n/a</span>
                      ) : (
                        (s?.sprints ?? 0)
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{s?.tickets ?? 0}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {tz.formatDate(p.createdAt, {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {s?.finished
                        ? tz.formatDate(s.finished, {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditProject(p)}
                          aria-label={`Edit ${p.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteProject(p)}
                          aria-label={`Delete ${p.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {editProject && (
        <EditProjectDialog
          project={editProject}
          open={!!editProject}
          onOpenChange={(o) => !o && setEditProject(null)}
        />
      )}

      <AlertDialog open={!!deleteProject} onOpenChange={(o) => !o && setDeleteProject(null)}>
        <AlertDialogContent className="glass border-glass-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes <span className="font-medium">{deleteProject?.name}</span>{" "}
              and all of its data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteProject && remove.mutate(deleteProject)}
              disabled={remove.isPending}
            >
              {remove.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
