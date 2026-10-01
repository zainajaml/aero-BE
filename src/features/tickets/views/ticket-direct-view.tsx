import { useEffect, useMemo } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/app/layout/app-shell";
import { useAuth } from "@/features/auth/auth-context";
import { ProjectProvider, useProjects } from "@/features/projects/project-context";
import { TimezoneProvider } from "@/features/users/lib/timezone";
import { TicketDialog } from "../components/ticket-dialog/ticket-dialog";
import { useTicket } from "../hooks/ticket-queries";
import type { TicketTab } from "../lib/ticket-tab";

export type { TicketTab };

/** Deep link /ticket/:id — the ticket modal over the app shell of the ticket's own project. */
export function TicketDirectView({ ticketId, tab }: { ticketId: string; tab?: TicketTab }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();

  const handleClose = () => {
    if (router.history.length > 1) router.history.back();
    else void navigate({ to: "/board" });
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <ProjectProvider>
      <TicketContextSync ticketId={ticketId} />
      <TimezoneProvider>
        <AppShell>
          <TicketDialog
            ticketId={ticketId}
            open
            initialTab={tab}
            onOpenChange={(open) => {
              if (!open) handleClose();
            }}
          />
        </AppShell>
      </TimezoneProvider>
    </ProjectProvider>
  );
}

/**
 * A ticket link can point at a project in a different account than the one the
 * user currently has open. Switch the account/project context to the ticket's
 * own project so the shell behind the modal matches the ticket.
 */
function TicketContextSync({ ticketId }: { ticketId: string }) {
  const {
    projects: activeProjects,
    archivedProjects,
    accountFilterId,
    activeProjectId,
    setAccountFilterId,
    setActiveProjectId,
  } = useProjects();
  // Admins may follow a link into an archived project (opened read-only).
  const projects = useMemo(
    () => [...activeProjects, ...archivedProjects],
    [activeProjects, archivedProjects],
  );
  const projectId = useTicket(ticketId).data?.projectId ?? null;

  useEffect(() => {
    if (!projectId || !projects.length) return;
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    if (project.accountId !== accountFilterId) {
      setAccountFilterId(project.accountId);
      setActiveProjectId(project.id);
      return;
    }
    if (activeProjectId !== project.id) setActiveProjectId(project.id);
  }, [
    projectId,
    projects,
    accountFilterId,
    activeProjectId,
    setAccountFilterId,
    setActiveProjectId,
  ]);

  return null;
}
