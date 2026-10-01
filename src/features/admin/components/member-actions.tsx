import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Archive, ArchiveRestore, Trash2, UserMinus } from "lucide-react";
import { errorMessage } from "@/shared/api/errors";
import { Button } from "@/shared/ui/button";
import { ConfirmDelete } from "@/shared/ui/confirm-delete";
import { displayName } from "@/features/users/lib/names";
import { archiveUser, removeUserAccess, restoreUser, type OrgUser } from "../api/admin.api";
import { ReassignArchivedTicketsDialog } from "./reassign-archived-tickets-dialog";

/** Remove access / delete, plus the super-admin archive and restore actions for one row. */
export function DeleteMemberButton({
  user,
  projectId,
  projectLabel,
  currentUserIsSuperAdmin,
  onDeleted,
}: {
  user: OrgUser;
  projectId?: string | null;
  projectLabel?: string;
  currentUserIsSuperAdmin?: boolean;
  onDeleted: () => void;
}) {
  const name = displayName(user, "this user");
  // Removing project access never deletes the identity. Only a footprint-free
  // user with no memberships at all is fully deleted (super admin only).
  const isRemoval = !!projectId || user.hasActivity;
  const mutation = useMutation({
    mutationFn: () => removeUserAccess(user.id, projectId ?? null),
    onSuccess: (r) => {
      toast.success(
        r.deleted
          ? "Member deleted"
          : !r.hasRemainingAccess
            ? "Access removed — history kept; they have no active projects left"
            : "Access removed — their history stays visible",
      );
      onDeleted();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const [reassignOpen, setReassignOpen] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);

  const archiveMutation = useMutation({
    mutationFn: async (
      input: { archived: true; reassign?: { assigneeId: string | null } } | { archived: false },
    ) => {
      if (input.archived)
        await archiveUser(user.id, input.reassign ? { reassign: input.reassign } : {});
      else await restoreUser(user.id);
    },
    onSuccess: (_r, input) => {
      toast.success(
        input.archived
          ? "User archived across SpaceScope"
          : "User restored — they can sign in again",
      );
      setArchiveConfirmOpen(false);
      setReassignOpen(false);
      onDeleted();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  // The reassign prompt must survive the row switching to its archived state
  // right after archiving, so it is rendered in both branches.
  const reassignDialog = (
    <ReassignArchivedTicketsDialog
      userId={user.id}
      userName={name}
      open={reassignOpen}
      onComplete={(reassign) => archiveMutation.mutateAsync({ archived: true, reassign })}
    />
  );

  if (user.archivedAt) {
    if (!currentUserIsSuperAdmin) return reassignDialog;
    return (
      <div className="flex items-center gap-1">
        {reassignDialog}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
          aria-label={`Restore ${name}`}
          title="Restore SpaceScope access"
          disabled={archiveMutation.isPending}
          onClick={() => archiveMutation.mutate({ archived: false })}
        >
          <ArchiveRestore className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {reassignDialog}
      <ConfirmDelete
        title={isRemoval ? "Remove access?" : "Delete member?"}
        description={
          isRemoval ? (
            <>
              <span className="font-medium">{name}</span> loses access to{" "}
              {projectId ? <span className="font-medium">{projectLabel}</span> : "your projects"}.
              Their SpaceScope account, sign-in and history (tickets, comments, work logs, documents
              and audit trail) are kept, and access to any other account or project is unaffected.
            </>
          ) : (
            <>
              <span className="font-medium">{name}</span> has no records in the workspace and no
              project access, so their account will be permanently deleted. This can&apos;t be
              undone.
            </>
          )
        }
        confirmLabel={isRemoval ? "Remove access" : "Delete"}
        onConfirm={() => mutation.mutate()}
        trigger={
          <Button
            variant="ghost"
            size="icon"
            className={
              isRemoval
                ? "h-8 w-8 text-muted-foreground hover:text-foreground"
                : "h-8 w-8 text-destructive hover:text-destructive"
            }
            aria-label={`${isRemoval ? "Remove access for" : "Delete"} ${name}`}
            title={isRemoval ? "Remove project access" : "Delete member"}
            disabled={mutation.isPending}
          >
            {isRemoval ? <UserMinus className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        }
      />

      {currentUserIsSuperAdmin && (
        <ConfirmDelete
          open={archiveConfirmOpen}
          onOpenChange={setArchiveConfirmOpen}
          title="Archive this SpaceScope user?"
          description={
            <>
              <span className="font-medium">{name}</span> will be blocked from signing in to
              SpaceScope entirely, across every account and project. Their profile and history are
              preserved and you can restore them later.
            </>
          }
          confirmLabel="Archive user"
          onConfirm={() => {
            setArchiveConfirmOpen(false);
            window.setTimeout(() => setReassignOpen(true), 100);
          }}
          trigger={
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
              aria-label={`Archive ${name} globally`}
              title="Archive SpaceScope user (blocks sign-in everywhere)"
              disabled={archiveMutation.isPending}
            >
              <Archive className="h-4 w-4" />
            </Button>
          }
        />
      )}
    </div>
  );
}
