import { Link, useRouterState } from "@tanstack/react-router";
import { ArchivedProjectBanner } from "@/features/projects/components/archived-project-banner";
import {
  LayoutDashboard,
  Kanban,
  ListTodo,
  Sparkles,
  Shield,
  FileText,
  Receipt,
  Telescope,
  Menu,
  Gauge,
  Link2,
} from "lucide-react";
import { useState } from "react";
import { useAuth, type AppRole } from "@/features/auth/auth-context";
import { GlassPanel } from "@/shared/ui/glass/glass-panel";

import { SidebarProfileMenu } from "@/features/users/components/sidebar-profile-menu";
import { NotificationsNavItem } from "@/features/notifications/components/notifications-nav-item";
import { SupportWidget } from "@/features/support/components/support-widget";

import { ProjectSwitcher } from "@/features/projects/components/project-switcher";
import { AccountSwitcher } from "@/features/projects/components/account-switcher";
import { useProjects } from "@/features/projects/project-context";
import { Button } from "@/shared/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/shared/ui/sheet";
import { cn } from "@/shared/lib/utils";
import { NoProjectEmptyState } from "@/features/projects/components/no-project-empty-state";
import { AccessRevokedOverlay } from "@/features/auth/components/access-revoked-overlay";
import { useAccessWatch } from "@/features/auth/hooks/use-access-watch";
import { useRoleWatch } from "@/features/auth/hooks/use-role-watch";

import { type ReactNode } from "react";

const ALL_ROLES = ["super_admin", "account_admin", "admin", "developer", "team", "viewer"] as const;

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ALL_ROLES },
  { to: "/backlog", label: "Backlog", icon: ListTodo, roles: ALL_ROLES, requireProject: true },
  { to: "/board", label: "Sprint Board", icon: Kanban, roles: ALL_ROLES, requireProject: true },
  // Gantt view hidden for current phase — will return in next release
  // { to: "/gantt", label: "Gantt View", icon: GanttChart, roles: ALL_ROLES, hideForKanban: true },
  {
    to: "/sprint-status",
    label: "RAG Status",
    icon: Gauge,
    roles: ALL_ROLES,
    hideForKanban: true,
    requireProject: true,
  },
  {
    to: "/releases",
    label: "Release Notes",
    icon: Sparkles,
    roles: ALL_ROLES,
    requireProject: true,
  },
  { to: "/documents", label: "Documents", icon: FileText, roles: ALL_ROLES, requireProject: true },
  { to: "/billing", label: "Billing", icon: Receipt, roles: ["super_admin"] as AppRole[] },
  {
    to: "/jira",
    label: "Jira Import",
    icon: Link2,
    roles: ["super_admin", "account_admin", "admin"] as AppRole[],
  },
];

/** Routes that only make sense once a project (and its style) exists. */
const PROJECT_ROUTES = [
  "/dashboard",
  "/backlog",
  "/board",
  "/gantt",
  "/sprint-status",
  "/releases",
  "/documents",
];

function NavLinks({
  path,
  hasAnyRole,
  isAllProjects,
  isKanban,
  hasProject,
  onNavigate,
}: {
  path: string;
  hasAnyRole: (roles: AppRole[]) => boolean;
  isAllProjects: boolean;
  isKanban: boolean;
  hasProject: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-1 flex-col gap-0.5">
      {NAV.filter((n) => hasAnyRole([...n.roles]))
        .filter((n) => !("requireAllProjects" in n && n.requireAllProjects) || isAllProjects)
        .filter((n) => !(isKanban && "hideForKanban" in n && n.hideForKanban))
        .filter((n) => hasProject || !("requireProject" in n && n.requireProject))
        .map((item) => {
          const active = path.startsWith(item.to);
          const Icon = item.icon;
          const label = isKanban && item.to === "/board" ? "Kanban Board" : item.label;
          return (
            <div key={item.to}>
              <Link
                to={item.to}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all",
                  "hover:bg-accent/50 hover:text-foreground",
                  active &&
                    "bg-accent text-accent-foreground shadow-[inset_0_0_0_1px] shadow-border",
                )}
              >
                <Icon className={cn("h-4 w-4", active && "text-foreground")} />
                <span>{label}</span>
              </Link>
            </div>
          );
        })}
    </nav>
  );
}

function BrandHeader() {
  return (
    <Link to="/dashboard" className="mb-4 flex items-center gap-2 px-2">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-foreground">
        <Telescope className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-tight">Space Scope</div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          SEE WHAT'S UP
        </div>
      </div>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { hasAnyRole, user, signingOut } = useAuth();
  const {
    isAllProjects,
    activeProject,
    visibleProjects,
    accountFilterId,
    isLoading: projectsLoading,
  } = useProjects();
  // Scoped to the active account: a freshly created empty account must show the
  // same first-project onboarding state as a brand-new user.
  // An admin viewing an archived project still has a project open.
  const hasProject = visibleProjects.length > 0 || !!activeProject?.archivedAt;
  const isKanban = !isAllProjects && activeProject?.projectType === "kanban";
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const accessLost = useAccessWatch();
  useRoleWatch();

  // Sign-out clears the cache and then does a full navigation to /login, which
  // takes a moment. Cover the whole shell for that window so no emptied page
  // state (dashboard with no data, "create your first project") can show.
  if (accessLost) return <AccessRevokedOverlay />;

  if (signingOut) {
    return (
      <div className="relative grid min-h-screen place-items-center p-6">
        <div className="aurora-bg" />
        <p className="relative z-10 text-sm text-muted-foreground">Signing you out…</p>
      </div>
    );
  }

  const SettingsLink = ({ onNavigate }: { onNavigate?: () => void }) => {
    if (!hasAnyRole(["super_admin", "account_admin", "admin"])) return null;
    const active = path.startsWith("/admin");

    return (
      <Link
        to="/admin"
        search={{ tab: undefined }}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all",
          "hover:bg-accent/50 hover:text-foreground",
          active && "bg-accent text-accent-foreground shadow-[inset_0_0_0_1px] shadow-border",
        )}
      >
        <Shield className={cn("h-4 w-4", active && "text-foreground")} />
        <span>Admin</span>
      </Link>
    );
  };

  return (
    <div className="relative h-screen overflow-hidden">
      <div className="aurora-bg" />
      <div className="relative z-10 flex h-full">
        {/* Sidebar (desktop) — fixed, does not scroll with content */}
        <aside className="hidden md:flex h-full w-64 shrink-0 flex-col gap-4 p-4 md:pr-0">
          <GlassPanel className="flex h-full flex-col gap-2 p-4">
            <BrandHeader />
            {!path.startsWith("/workforce") && (
              <div className="mb-1 flex flex-col gap-1.5">
                <AccountSwitcher />
                <ProjectSwitcher />
              </div>
            )}
            <NavLinks
              path={path}
              hasAnyRole={hasAnyRole}
              isAllProjects={isAllProjects}
              isKanban={isKanban}
              hasProject={hasProject}
            />
            <div className="flex flex-col gap-0.5">
              <NotificationsNavItem />
              <SupportWidget variant="menu" />
              <SettingsLink />
              <SidebarProfileMenu />
            </div>
          </GlassPanel>
        </aside>

        {/* Main */}
        <main className="relative flex min-w-0 flex-1 flex-col overflow-y-auto p-4">
          <div className="mb-2 flex items-center justify-between gap-3 md:mb-0">
            <div className="flex min-w-0 items-center gap-2">
              {/* Mobile menu trigger */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="md:hidden shrink-0"
                    aria-label="Open menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-4">
                  <div className="flex h-full flex-col gap-2 pt-2">
                    <BrandHeader />
                    {!path.startsWith("/workforce") && (
                      <div className="mb-1 flex flex-col gap-1.5">
                        <AccountSwitcher />
                        <ProjectSwitcher />
                      </div>
                    )}
                    <NavLinks
                      path={path}
                      hasAnyRole={hasAnyRole}
                      isAllProjects={isAllProjects}
                      isKanban={isKanban}
                      hasProject={hasProject}

                      onNavigate={() => setMobileOpen(false)}
                    />
                    <div className="flex flex-col gap-0.5">
                      <NotificationsNavItem onNavigate={() => setMobileOpen(false)} />
                      <SupportWidget variant="menu" onNavigate={() => setMobileOpen(false)} />
                      <SettingsLink onNavigate={() => setMobileOpen(false)} />
                      <SidebarProfileMenu onNavigate={() => setMobileOpen(false)} />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
          {!isAllProjects &&
            activeProject?.archivedAt &&
            PROJECT_ROUTES.some((r) => path.startsWith(r)) && (
              <ArchivedProjectBanner project={activeProject} />
            )}
          {children}
          {!hasProject &&
            !projectsLoading &&
            !!user &&
            !signingOut &&
            PROJECT_ROUTES.some((r) => path.startsWith(r)) && (
              <NoProjectEmptyState key={accountFilterId ?? "none"} />
            )}
        </main>
      </div>
    </div>
  );
}
