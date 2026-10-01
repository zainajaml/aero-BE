import { FolderPlus, ListTodo, Kanban, Gauge, ArrowRight, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { GlassPanel } from "@/shared/ui/glass/glass-panel";
import { Button } from "@/shared/ui/button";
import { CTA_BUTTON } from "@/shared/lib/cta";
import { useAuth } from "@/features/auth/auth-context";

/**
 * Shown whenever the signed-in user has no project yet (e.g. they skipped the
 * project step during onboarding). It is a dismissible nudge, not a wall: the
 * overlay only covers the main content area (never the sidebar), the page stays
 * visible behind a light blur, and a close button lets the user explore freely.
 */
export function NoProjectEmptyState() {
  const { hasAnyRole } = useAuth();
  const canCreate = hasAnyRole(["super_admin", "account_admin", "admin"]);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-background/25 p-4 backdrop-blur-sm">
      <GlassPanel className="relative w-full max-w-xl p-8 text-center shadow-2xl">
        <button
          type="button"
          aria-label="Close"
          onClick={() => setDismissed(true)}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-foreground">
          <FolderPlus className="h-6 w-6" />
        </div>
        <h1 className="mt-4 font-display text-xl font-semibold tracking-tight">
          Create your first project
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Your account is ready. Projects live in Admin → Projects — create one there and, once you
          pick a project style (Scrum or Kanban), the matching features unlock.
        </p>

        <ul className="mx-auto mt-5 flex w-fit flex-col gap-2 text-left text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <ListTodo className="h-4 w-4 shrink-0" /> Backlog and ticket workflow
          </li>
          <li className="flex items-center gap-2">
            <Kanban className="h-4 w-4 shrink-0" /> Sprint board or Kanban board
          </li>
          <li className="flex items-center gap-2">
            <Gauge className="h-4 w-4 shrink-0" /> RAG status, release notes and documents
          </li>
        </ul>

        <div className="mt-6 flex items-center justify-center gap-2">
          {canCreate ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setDismissed(true)}
              >
                Maybe later
              </Button>
              <Button size="sm" className={CTA_BUTTON} asChild>
                <Link to="/admin" search={{ tab: "projects" }} preload="intent">
                  Go to Admin → Projects
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Ask your account admin to add you to a project.
            </p>
          )}
        </div>
      </GlassPanel>
    </div>
  );
}
