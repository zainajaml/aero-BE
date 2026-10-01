import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { useAuth } from "@/features/auth/auth-context";
import { MyAccountsPanel } from "../components/my-accounts-panel";
import { MyWorkLogPanel } from "../components/my-work-log-panel";

export function MyWorkView({ tab }: { tab?: string }) {
  const { hasAnyRole, adminAccountIds } = useAuth();
  const workspaceLabel =
    hasAnyRole(["account_admin", "super_admin"]) || (adminAccountIds?.length ?? 0) > 0
      ? "Accounts & Projects"
      : "My Projects";

  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col">
      <div className="shrink-0">
        <h1 className="font-display text-2xl font-semibold tracking-tight">My Work</h1>
        <p className="text-sm text-muted-foreground">
          Everything you're working on across accounts and projects.
        </p>
      </div>

      <Tabs
        defaultValue={tab === "worklog" ? "worklog" : "workspace"}
        className="mt-6 flex min-h-0 flex-1 flex-col"
      >
        <TabsList className="shrink-0 self-start h-8 rounded-md border border-input bg-transparent p-1 shadow-sm [&_[data-state=active]]:bg-primary [&_[data-state=active]]:text-primary-foreground">
          <TabsTrigger value="workspace">{workspaceLabel}</TabsTrigger>
          <TabsTrigger value="worklog">My Work Log</TabsTrigger>
        </TabsList>

        <TabsContent value="workspace" className="mt-6 min-h-0 flex-1 overflow-auto">
          <MyAccountsPanel />
        </TabsContent>

        <TabsContent value="worklog" className="mt-6 min-h-0 flex-1 overflow-auto">
          <MyWorkLogPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
