import { Outlet, createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/app/layout/app-shell";
import { requireActiveSession } from "@/features/auth/lib/route-guards";
import { ProjectProvider } from "@/features/projects/project-context";
import { TimezoneProvider } from "@/features/users/lib/timezone";
import "@/features/tickets/register-ticket-dialog";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ context, location }) => requireActiveSession(context.queryClient, location.href),
  head: () => ({ meta: [{ title: "Space Scope" }] }),
  component: () => (
    <ProjectProvider>
      <TimezoneProvider>
        <AppShell>
          <Outlet />
        </AppShell>
      </TimezoneProvider>
    </ProjectProvider>
  ),
});
