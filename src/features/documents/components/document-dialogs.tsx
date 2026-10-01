import { DoorOpen, X } from "lucide-react";
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
import type { DocumentDraft } from "../hooks/use-document-draft";

/** "Unsaved changes" guard for switching pages or leaving the route. */
export function UnsavedChangesDialog({ draft }: { draft: DocumentDraft }) {
  return (
    <AlertDialog
      open={draft.leavePromptOpen}
      onOpenChange={(o) => {
        if (!o) draft.stay();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Stop! You have not saved your work.</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes. Are you sure you want to leave without saving?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={draft.stay} className="gap-1.5">
            <X className="h-4 w-4" />
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={draft.discardAndContinue}
            className="gap-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            <DoorOpen className="h-4 w-4" />
            Just Leave
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ConfirmDeleteDialog({
  open,
  title,
  description,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function DeletePageDialog({
  pageId,
  onCancel,
  onConfirm,
}: {
  pageId: string | null;
  onCancel: () => void;
  onConfirm: (id: string) => void;
}) {
  return (
    <ConfirmDeleteDialog
      open={!!pageId}
      title="Delete this page?"
      description="This page and all of its sub-pages will be permanently deleted. This cannot be undone."
      onCancel={onCancel}
      onConfirm={() => pageId && onConfirm(pageId)}
    />
  );
}

export function DeleteFolderDialog({
  folderId,
  onCancel,
  onConfirm,
}: {
  folderId: string | null;
  onCancel: () => void;
  onConfirm: (id: string) => void;
}) {
  return (
    <ConfirmDeleteDialog
      open={!!folderId}
      title="Delete this folder?"
      description="The folder will be removed. Pages inside it are kept and moved back to Ungrouped."
      onCancel={onCancel}
      onConfirm={() => folderId && onConfirm(folderId)}
    />
  );
}
