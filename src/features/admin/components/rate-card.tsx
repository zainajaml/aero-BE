import { useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { ConfirmDelete } from "@/shared/ui/confirm-delete";
import { useAuth } from "@/features/auth/auth-context";
import { useProjects } from "@/features/projects/project-context";
import { useDeleteRate, useRateCard } from "../hooks/use-rate-card";
import { RateEditorDialog, type RateCardRow, type RateEditorState } from "./rate-editor-dialog";

export function RateCard() {
  const { roles } = useAuth();
  const { activeProject, visibleProjects, accounts, isAllProjects } = useProjects();
  const canManage =
    roles.includes("super_admin") || roles.includes("account_admin") || roles.includes("admin");

  const projectId = activeProject?.id ?? null;
  const projectIds = visibleProjects.map((p) => p.id);

  const { data: rates, isLoading } = useRateCard(projectIds);
  const data = useMemo<RateCardRow[] | undefined>(
    () =>
      rates?.map((r) => {
        const project = visibleProjects.find((p) => p.id === r.projectId);
        const account = accounts.find((a) => a.id === project?.accountId);
        return {
          id: r.id,
          role: r.role,
          location: r.location ?? "",
          hourlyRate: Number(r.hourlyRate),
          projectId: r.projectId,
          projectName: project?.name ?? "Unknown project",
          accountName: account?.name ?? project?.clientAccount ?? "—",
        };
      }),
    [rates, visibleProjects, accounts],
  );

  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<RateEditorState>(null);

  const sortedData = useMemo(() => {
    const rows = [...(data ?? [])];
    rows.sort((a, b) => {
      const accountCmp = a.accountName.localeCompare(b.accountName);
      if (accountCmp !== 0) return accountCmp;
      const projectCmp = a.projectName.localeCompare(b.projectName);
      if (projectCmp !== 0) return projectCmp;
      return a.role.localeCompare(b.role);
    });
    return rows;
  }, [data]);

  const filteredData = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return sortedData;
    return sortedData.filter(
      (r) =>
        r.accountName.toLowerCase().includes(term) ||
        r.projectName.toLowerCase().includes(term) ||
        r.role.toLowerCase().includes(term) ||
        r.location.toLowerCase().includes(term) ||
        r.hourlyRate.toFixed(2).includes(term),
    );
  }, [sortedData, search]);

  const deleteMutation = useDeleteRate();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Filter by member, job title, project, ticket..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-full border-border/60 bg-muted/40 pl-9 pr-4 text-sm focus-visible:bg-background"
          />
        </div>
        {canManage && !isAllProjects && projectId && (
          <Button onClick={() => setEditor({ mode: "create" })}>
            <Plus className="h-4 w-4" />
            Add Rate
          </Button>
        )}
      </div>

      {projectIds.length === 0 ? (
        <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
          No projects available.
        </div>
      ) : isLoading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading rate card…
        </div>
      ) : (
        <Table className="w-full table-fixed [&_td]:truncate [&_td]:py-1 [&_th]:h-7">
          <colgroup>
            <col style={{ width: 200 }} />
            <col style={{ width: 200 }} />
            <col />
            <col style={{ width: 160 }} />
            <col style={{ width: 160 }} />
            {canManage && <col style={{ width: 96 }} />}
          </colgroup>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Hourly rate (USD)</TableHead>
              {canManage && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <span className="text-sm">{row.accountName}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{row.projectName}</span>
                </TableCell>
                <TableCell className="font-medium">{row.role}</TableCell>
                <TableCell>
                  <span className="text-sm">{row.location || "—"}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">${row.hourlyRate.toFixed(2)}</span>
                </TableCell>
                {canManage && (
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditor({ mode: "edit", row })}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <ConfirmDelete
                        onConfirm={() =>
                          deleteMutation.mutate({ projectId: row.projectId, rateId: row.id })
                        }
                        title="Remove role?"
                        description={`Remove "${row.role}" from the rate card?`}
                        trigger={
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        }
                      />
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {(data ?? []).length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={canManage ? 6 : 5}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  No roles defined for any project yet.
                </TableCell>
              </TableRow>
            )}
            {(data ?? []).length > 0 && filteredData.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={canManage ? 6 : 5}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  No rates match your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {editor && projectId && (
        <RateEditorDialog projectId={projectId} state={editor} onClose={() => setEditor(null)} />
      )}
    </div>
  );
}
