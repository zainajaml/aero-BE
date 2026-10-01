import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { MoreHorizontal } from "lucide-react";
import { errorMessage } from "@/shared/api/errors";
import { Button } from "@/shared/ui/button";
import { ConfirmDelete } from "@/shared/ui/confirm-delete";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { resendInvitation, revokeInvitation } from "@/features/invitations/api/invitations.api";

export function InvitationActions({
  invitationId,
  email,
  expired,
  onDone,
}: {
  invitationId: string;
  email: string;
  expired: boolean;
  onDone: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const revokeMutation = useMutation({
    mutationFn: () => revokeInvitation(invitationId),
    onSuccess: () => {
      toast.success(expired ? "Invitation removed" : "Invitation revoked");
      onDone();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const resendMutation = useMutation({
    mutationFn: () => resendInvitation(invitationId),
    onSuccess: (res) => {
      toast.success(
        res.emailQueued
          ? `Invitation resent to ${res.email}`
          : `Resend queued for ${res.email} (email pending)`,
      );
      onDone();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const busy = revokeMutation.isPending || resendMutation.isPending;

  return (
    <div className="flex items-center justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={`Invitation actions for ${email}`}
            disabled={busy}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => resendMutation.mutate()}>
            Resend invitation
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setConfirmOpen(true)}
          >
            {expired ? "Remove invitation" : "Revoke invitation"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDelete
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={expired ? "Remove invitation?" : "Revoke invitation?"}
        description={
          <>
            This {expired ? "removes the expired" : "cancels the pending"} invitation for{" "}
            <span className="font-medium">{email}</span>.
          </>
        }
        onConfirm={() => revokeMutation.mutate()}
      />
    </div>
  );
}
