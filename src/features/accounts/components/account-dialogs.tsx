import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { CTA_BUTTON } from "@/shared/lib/cta";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { CloseButton } from "@/shared/ui/close-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
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
import { useDeleteAccount, useUpdateAccount } from "../hooks/use-account-mutations";

export function EditAccountDialog({
  accountId,
  initialName,
  open,
  onOpenChange,
}: {
  accountId: string;
  initialName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [nameDraft, setNameDraft] = useState(initialName);
  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) setNameDraft(initialName);
  }
  const updateMut = useUpdateAccount(accountId, () => onOpenChange(false));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-glass-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit account</DialogTitle>
          <DialogDescription>Accounts group projects and their members.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="account-name">Name</Label>
          <Input
            id="account-name"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            placeholder="Acme Corp"
          />
        </div>
        <DialogFooter>
          <Button
            className={CTA_BUTTON}
            onClick={() => nameDraft.trim() && updateMut.mutate({ name: nameDraft.trim() })}
            disabled={updateMut.isPending || !nameDraft.trim()}
          >
            {updateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Deleting the account cascades to its projects (force=true). */
export function DeleteAccountDialog({
  accountId,
  accountName,
  totalProjects,
  archivedCount,
  open,
  onOpenChange,
}: {
  accountId: string;
  accountName: string;
  totalProjects: number;
  archivedCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const deleteAccountMut = useDeleteAccount(accountId, {
    force: true,
    successMessage: () => `Deleted ${accountName}`,
    onDone: () => onOpenChange(false),
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="glass border-glass-border">
        <div className="absolute right-4 top-4">
          <CloseButton onClick={() => onOpenChange(false)} disabled={deleteAccountMut.isPending} />
        </div>
        <AlertDialogHeader className="pr-10">
          <AlertDialogTitle>Delete {accountName}?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              {totalProjects > 0 && (
                <div className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-left text-destructive">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="text-sm">
                    This account still has{" "}
                    <span className="font-semibold">
                      {totalProjects} project
                      {totalProjects === 1 ? "" : "s"}
                    </span>
                    {archivedCount > 0 && <> (including {archivedCount} archived)</>}. Deleting the
                    account also permanently deletes {totalProjects === 1 ? "it" : "them"} with all
                    sprints, tickets and documents.
                  </div>
                </div>
              )}
              <p className="text-sm">
                Account members lose access to this account. This cannot be undone.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(e) => {
              e.preventDefault();
              deleteAccountMut.mutate();
            }}
            disabled={deleteAccountMut.isPending}
          >
            {deleteAccountMut.isPending
              ? "Deleting…"
              : totalProjects > 0
                ? `Delete account & ${totalProjects} project${totalProjects === 1 ? "" : "s"}`
                : "Delete account"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
