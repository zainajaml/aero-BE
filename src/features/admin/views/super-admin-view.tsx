import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { ProjectsManager } from "@/features/projects/components/projects-manager";
import { SuperAccountsPanel } from "../components/super/super-accounts-panel";
import { SuperUsersPanel } from "../components/super/super-users-panel";
import { SystemLogPanel } from "../components/super/system-log-panel";

export function SuperAdminView() {
  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col">
      <div className="shrink-0">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Super Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage accounts, projects, users, and system activity across the entire workspace.
        </p>
      </div>

      <Tabs defaultValue="accounts" className="mt-6 flex min-h-0 flex-1 flex-col">
        <TabsList className="shrink-0 self-start [&_[data-state=active]]:bg-primary [&_[data-state=active]]:text-primary-foreground">
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="system-log">System Log</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="mt-4 min-h-0 flex-1 overflow-hidden">
          <SuperAccountsPanel />
        </TabsContent>

        <TabsContent value="projects" className="mt-4 min-h-0 flex-1 overflow-auto">
          <ProjectsManager />
        </TabsContent>

        <TabsContent value="users" className="mt-4 min-h-0 flex-1 overflow-hidden">
          <SuperUsersPanel />
        </TabsContent>

        <TabsContent value="system-log" className="mt-4 min-h-0 flex-1 overflow-hidden">
          <SystemLogPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
