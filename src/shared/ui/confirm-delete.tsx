import { type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";

export function ConfirmDelete({
  trigger,
  open,
  onOpenChange,
  title = "Delete this item?",
  description = "This action cannot be undone.",
  confirmLabel = "Delete",
  className,
  onConfirm,
}: {
  trigger?: ReactNode;
  /** Optional controlled state, for opening from a menu item instead of a trigger. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: ReactNode;
  confirmLabel?: string;
  className?: string;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger ? (
        <AlertDialogTrigger
          asChild
          className={
            className ??
            "text-muted-foreground transition-colors hover:text-destructive [&_svg]:text-current"
          }
        >
          {trigger}
        </AlertDialogTrigger>
      ) : null}
      <AlertDialogContent className="glass border-glass-border">
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
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
