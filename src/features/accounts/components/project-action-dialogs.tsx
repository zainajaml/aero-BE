import { Loader2 } from "lucide-react";
import { CTA_BUTTON } from "@/shared/lib/cta";
import { CloseButton } from "@/shared/ui/close-button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import type { Project } from "@/features/projects/project-context";

export function ArchiveProjectDialog({
  project,
  pending,
  onClose,
  onConfirm,
}: {
  project: Project | null;
  pending: boolean;
  onClose: () => void;
  onConfirm: (project: Project) => void;
}) {
  return (
    <AlertDialog open={!!project} onOpenChange={(o) => !o && !pending && onClose()}>
      <AlertDialogContent className="glass border-glass-border">
        <div className="absolute right-4 top-4">
          <CloseButton onClick={onClose} disabled={pending} />
        </div>
        <AlertDialogHeader className="pr-10">
          <AlertDialogTitle>Archive {project?.name}?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm">
              <p>
                The project will be hidden from members and from the project switcher, and it
                becomes read-only for everyone.
              </p>
              <p>
                Nothing is deleted — tickets, work logs, documents and files are kept, and past
                hours still show in reports. You can view or restore it any time under{" "}
                <span className="font-medium text-foreground">Archived</span>.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={CTA_BUTTON}
            disabled={pending}
            onClick={(e) => {
              e.preventDefault();
              if (project) onConfirm(project);
            }}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Archive project
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function DeleteProjectDialog({
  project,
  pending,
  onClose,
  onConfirm,
}: {
  project: Project | null;
  pending: boolean;
  onClose: () => void;
  onConfirm: (project: Project) => void;
}) {
  return (
    <AlertDialog open={!!project} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent className="glass border-glass-border">
        <div className="absolute right-4 top-4">
          <CloseButton onClick={onClose} disabled={pending} />
        </div>
        <AlertDialogHeader className="pr-10">
          <AlertDialogTitle>Delete project?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes <span className="font-medium">{project?.name}</span> and all of
            its data. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => project && onConfirm(project)}
            disabled={pending}
          >
            {pending ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
