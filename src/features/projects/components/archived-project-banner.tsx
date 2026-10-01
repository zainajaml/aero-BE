import { Archive, ArchiveRestore, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import { useTimezone } from "@/features/users/lib/timezone";
import type { Project } from "@/features/projects/project-context";
import { CTA_BUTTON } from "@/shared/lib/cta";
import { useArchiveProject } from "@/features/projects/hooks/use-archive-project";

/** Shown above project pages while an admin is viewing an archived project. */
export function ArchivedProjectBanner({ project }: { project: Project }) {
  const { hasAnyRole } = useAuth();
  const tz = useTimezone();
  const canRestore = hasAnyRole(["super_admin", "account_admin"]);
  const restore = useArchiveProject();

  return (
    <div
      role="status"
      className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted/60 px-4 py-2.5"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <Archive className="h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-sm">
          <span className="font-medium">{project.name} is archived</span>
          {project.archivedAt && (
            <span className="text-muted-foreground">
              {" "}
              since{" "}
              {tz.formatDate(project.archivedAt, {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          )}
          <span className="text-muted-foreground">
            {" "}
            — it's read-only and hidden from members. Restore it to make changes.
          </span>
        </p>
      </div>
      {canRestore && (
        <Button
          size="sm"
          className={`${CTA_BUTTON} gap-1.5`}
          disabled={restore.isPending}
          onClick={() => restore.mutate({ project, archived: false })}
        >
          {restore.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ArchiveRestore className="h-3.5 w-3.5" />
          )}
          Restore project
        </Button>
      )}
    </div>
  );
}
