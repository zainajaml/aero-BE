import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { useAuth } from "@/features/auth/auth-context";
import { useProjects } from "@/features/projects/project-context";
import { AccountProjectsPanel } from "@/features/accounts/components/account-projects-panel";
import { AuditView } from "@/features/audit/views/audit-view";
import { NotificationsLog } from "@/features/notifications/components/notifications-log";
import { WorkforceView } from "@/features/reporting/views/workforce-view";
import { RateCard } from "../components/rate-card";
import { UsersTab } from "../components/users-tab";
import { useOrgUsers } from "../hooks/admin-queries";

const SKELETON_TAB =
  "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium text-transparent animate-pulse bg-muted";

export function AdminView({ tab: tabParam }: { tab?: string }) {
  const [tab, setTab] = useState<string | null>(tabParam ?? null);
  const { loading: authLoading, hasAnyRole, projectRoles } = useAuth();
  const { accountFilterId } = useProjects();
  // User Management is always scoped server-side to the account currently
  // selected in the switcher; switching accounts refetches a fresh scoped list.
  const { data, isLoading } = useOrgUsers(accountFilterId);

  const isProjectAdminSomewhere = useMemo(
    () => Object.values(projectRoles).some((r) => r === "admin"),
    [projectRoles],
  );
  // Tab gating is driven by the SERVER's context-aware scope flags, which are
  // recomputed for the account/project currently selected in the switcher.
  const showAccountsTab = data?.scope.contextIsAccountAdmin === true;
  const showProjectsTab =
    !showAccountsTab && (data?.scope.contextIsProjectAdmin === true || isProjectAdminSomewhere);
  const showAdminTabs = showAccountsTab || showProjectsTab;

  const canManageProjects =
    !authLoading &&
    Boolean(data?.scope) &&
    (data?.scope.isGlobalAdmin || data?.scope.isAccountAdmin || hasAnyRole(["admin"])) === true &&
    hasAnyRole(["super_admin", "account_admin", "admin"]);
  // The tab strip must not appear before permissions are known, otherwise it
  // renders a partial set and visibly expands once the scope query resolves.
  const permsReady = !authLoading && Boolean(data?.scope) && !isLoading;
  // Default to the first tab actually rendered ("Accounts & projects" for
  // account/super admins), not a hardcoded "users".
  const defaultTab = showAccountsTab ? "accounts" : showProjectsTab ? "projects" : "users";
  const activeTab = tab ?? defaultTab;

  // Accounts and Projects are one merged tab for account/super admins, so an
  // older ?tab=projects link resolves to it.
  const mergedAccountsTab = showAccountsTab;
  useEffect(() => {
    if (mergedAccountsTab && tab === "projects") setTab("accounts");
    if (!mergedAccountsTab && tab === "accounts") setTab("projects");
  }, [mergedAccountsTab, tab]);

  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col">
      <div className="shrink-0">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage projects, people, roles, and access.
        </p>
      </div>

      {!permsReady ? (
        <div className="mt-6 flex min-h-0 flex-1 flex-col">
          {authLoading ? (
            <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
          ) : (
            <div className="flex h-8 shrink-0 items-center self-start rounded-md border border-input bg-transparent p-1 shadow-sm">
              {showAccountsTab ? (
                <span className={SKELETON_TAB}>Accounts &amp; projects</span>
              ) : (
                showProjectsTab && <span className={SKELETON_TAB}>Projects</span>
              )}
              <span className={SKELETON_TAB}>User Management</span>
              {showAdminTabs && <span className={SKELETON_TAB}>Team Usage</span>}
              <span className={SKELETON_TAB}>Rate Card</span>
              <span className={SKELETON_TAB}>Notification Log</span>
              <span className={SKELETON_TAB}>System Log</span>
            </div>
          )}

          <div className="mt-4 flex flex-1 items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading…
          </div>
        </div>
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={setTab}
          className="mt-6 flex min-h-0 flex-1 flex-col"
        >
          <TabsList className="shrink-0 self-start h-8 rounded-md border border-input bg-transparent p-1 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring [&_[data-state=active]]:bg-primary [&_[data-state=active]]:text-primary-foreground">
            {showAccountsTab ? (
              <TabsTrigger value="accounts">Accounts &amp; projects</TabsTrigger>
            ) : (
              showProjectsTab && <TabsTrigger value="projects">Projects</TabsTrigger>
            )}
            <TabsTrigger value="users">User Management</TabsTrigger>
            {showAdminTabs && <TabsTrigger value="utilization">Team Usage</TabsTrigger>}
            <TabsTrigger value="rate-card">Rate Card</TabsTrigger>
            <TabsTrigger value="email">Notification Log</TabsTrigger>
            <TabsTrigger value="audit">System Log</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4 min-h-0 flex-1 overflow-hidden flex flex-col">
            <UsersTab data={data} isLoading={isLoading} />
          </TabsContent>

          {hasAnyRole(["super_admin", "account_admin"]) ? (
            <TabsContent value="accounts" className="mt-4 min-h-0 flex-1 overflow-auto">
              <AccountProjectsPanel />
            </TabsContent>
          ) : (
            canManageProjects && (
              <TabsContent value="projects" className="mt-4 min-h-0 flex-1 overflow-auto">
                <AccountProjectsPanel />
              </TabsContent>
            )
          )}

          {canManageProjects && (
            <TabsContent value="utilization" className="mt-4 min-h-0 flex-1 overflow-auto">
              <WorkforceView />
            </TabsContent>
          )}

          <TabsContent value="rate-card" className="mt-4 min-h-0 flex-1 overflow-auto">
            <RateCard />
          </TabsContent>

          <TabsContent value="email" className="mt-4 min-h-0 flex-1 overflow-hidden">
            <NotificationsLog />
          </TabsContent>

          <TabsContent value="audit" className="mt-4 min-h-0 flex-1 overflow-hidden">
            <AuditView />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
