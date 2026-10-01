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
import type { PendingBulkMove } from "../../hooks/use-backlog-dnd";

/** Confirmation for dragging several selected tickets at once. */
export function BulkMoveConfirmDialog({
  pending,
  onClose,
  onConfirm,
}: {
  pending: PendingBulkMove | null;
  onClose: () => void;
  onConfirm: (move: PendingBulkMove) => void;
}) {
  return (
    <AlertDialog
      open={!!pending}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent className="glass border-glass-border">
        <AlertDialogHeader>
          <AlertDialogTitle>Move tickets?</AlertDialogTitle>
          <AlertDialogDescription>
            {pending
              ? `Move ${pending.ids.length} selected ticket${
                  pending.ids.length === 1 ? "" : "s"
                } to ${pending.name}?`
              : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (pending) onConfirm(pending);
              onClose();
            }}
          >
            Move
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
