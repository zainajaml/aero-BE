import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, ChevronDown, ChevronRight, Search } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import { useProjects } from "@/features/projects/project-context";
import { useTimezone } from "@/features/users/lib/timezone";
import { Input } from "@/shared/ui/input";
import { getMyWorkspace } from "../api/workspace.api";
import { workspaceKeys } from "../hooks/workspace-queries";
import { EmptyState, ProjectRow, SectionLabel } from "./workspace-rows";
/**
 * Profile › My Accounts & Projects — a read-only overview of everything the
 * signed-in user has scope over, independent of the account currently open:
 *  - Accounts they administer (account_admin), each with its projects.
 *  - Individual projects they were added to (project admin, developer, …) in
 *    accounts they do NOT administer, listed separately with their role.
 * A user can legitimately have both, so both sections render when non-empty.
 */
export function MyAccountsPanel() {
  const tz = useTimezone();
  const { accountFilterId } = useProjects();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useQuery({
    queryKey: workspaceKeys.mine(user?.id),
    queryFn: getMyWorkspace,
  });

  const accounts = useMemo(() => data?.accounts ?? [], [data]);
  const soloProjects = useMemo(() => data?.projects ?? [], [data]);

  const q = query.trim().toLowerCase();

  const filteredAccounts = useMemo(() => {
    if (!q) return accounts;
    return accounts
      .map((a) => ({
        ...a,
        projects: a.projects.filter(
          (p) => p.name.toLowerCase().includes(q) || p.key.toLowerCase().includes(q),
        ),
      }))
      .filter((a) => a.name.toLowerCase().includes(q) || a.projects.length > 0);
  }, [accounts, q]);

  const filteredSolo = useMemo(() => {
    if (!q) return soloProjects;
    return soloProjects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.key.toLowerCase().includes(q) ||
        p.accountName.toLowerCase().includes(q),
    );
  }, [soloProjects, q]);

  const hasAccounts = accounts.length > 0;

  const totalProjects = accounts.reduce((n, a) => n + a.projects.length, 0) + soloProjects.length;
  const nothing = filteredAccounts.length === 0 && filteredSolo.length === 0;

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-stretch gap-5">
          {hasAccounts && (
            <div className="flex flex-col">
              <span className="text-base font-semibold leading-none tabular-nums text-foreground">
                {accounts.length}
              </span>
              <span className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                Account{accounts.length === 1 ? "" : "s"}
              </span>
            </div>
          )}
          {hasAccounts && <span className="w-px bg-border" aria-hidden="true" />}
          <div className="flex flex-col">
            <span className="text-base font-semibold leading-none tabular-nums text-foreground">
              {totalProjects}
            </span>
            <span className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
              Project{totalProjects === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {totalProjects + accounts.length > 1 && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={hasAccounts ? "Search accounts or projects..." : "Search projects..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8 w-56 pl-8 text-xs"
            />
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
      ) : nothing ? (
        <EmptyState
          icon={<Building2 className="h-5 w-5" />}
          title={
            query
              ? "Nothing matches your search"
              : hasAccounts
                ? "No accounts or projects yet"
                : "No projects yet"
          }
          hint={
            query
              ? "Try a different name or project key."
              : "Accounts you administer and projects you're added to will appear here."
          }
        />
      ) : (
        <div className="space-y-5">
          {filteredAccounts.length > 0 && (
            <div className="space-y-4">
              <SectionLabel
                title="Accounts you administer"
                hint="Full account scope, including every project inside."
              />
              {filteredAccounts.map((a) => {
                const isOpen = !collapsed[a.id];
                const isActive = a.id === accountFilterId;
                return (
                  <section
                    key={a.id}
                    className="divide-y divide-border overflow-hidden rounded-2xl border border-border"
                  >
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 bg-background/40 p-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)]">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                          <Building2 className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium">{a.name}</span>
                            {isActive && (
                              <span className="rounded-full bg-primary/15 px-1.5 py-0 text-[10px] font-medium uppercase tracking-wide text-primary">
                                Open
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span className="tabular-nums">
                              {a.projects.length} project{a.projects.length === 1 ? "" : "s"}
                            </span>
                            <span>•</span>
                            <span>
                              Created{" "}
                              <span className="tabular-nums">
                                {tz.formatDate(a.createdAt, {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center justify-end gap-0.5">
                        <button
                          type="button"
                          onClick={() => setCollapsed((c) => ({ ...c, [a.id]: isOpen }))}
                          className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          aria-label={isOpen ? "Collapse projects" : "Expand projects"}
                        >
                          {isOpen ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {isOpen &&
                      (a.projects.length === 0 ? (
                        <p className="p-4 text-xs text-muted-foreground">
                          No projects in this account yet.
                        </p>
                      ) : (
                        <div className="divide-y divide-border">
                          {a.projects.map((p) => (
                            <ProjectRow
                              key={p.id}
                              name={p.name}
                              projectKey={p.key}
                              type={p.projectType}
                              createdAt={p.createdAt}
                              members={p.members}
                              sprints={p.sprints}
                              tickets={p.tickets}
                              formatDate={tz.formatDate}
                            />
                          ))}
                        </div>
                      ))}
                  </section>
                );
              })}
            </div>
          )}

          {filteredSolo.length > 0 && (
            <div className="space-y-2">
              <SectionLabel
                title={hasAccounts ? "Projects you're a member of" : "Your projects"}
                hint="Project-level access, with your role in each."
              />
              <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
                {filteredSolo.map((p) => (
                  <ProjectRow
                    key={p.id}
                    name={p.name}
                    projectKey={p.key}
                    type={p.projectType}
                    createdAt={p.createdAt}
                    members={p.members}
                    sprints={p.sprints}
                    tickets={p.tickets}
                    accountName={p.accountName}
                    role={p.role}
                    formatDate={tz.formatDate}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
