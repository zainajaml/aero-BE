import { ConfirmDelete } from "@/shared/ui/confirm-delete";

/** Delete entry point at the bottom of the sidebar, or the reason it's unavailable. */
export function TicketDeleteAction({
  sprintLocked,
  viewOnly,
  isManager,
  loggedMinutes,
  onDelete,
}: {
  sprintLocked: boolean;
  viewOnly: boolean;
  isManager: boolean;
  loggedMinutes: number;
  onDelete: () => void;
}) {
  if (sprintLocked) {
    return (
      <span className="text-sm text-[var(--tk-muted)]">
        {viewOnly
          ? "View-only access — deleting is disabled"
          : "Sprint closed — deleting is disabled"}
      </span>
    );
  }
  if (!isManager) {
    return (
      <span
        className="text-sm text-[var(--tk-faint)]"
        title="Only project and account admins can delete tickets"
      >
        Delete (admins only)
      </span>
    );
  }
  if (loggedMinutes === 0) {
    return (
      <ConfirmDelete
        title="Delete this ticket?"
        description="This ticket will be permanently deleted. This cannot be undone."
        onConfirm={onDelete}
        trigger={
          <button
            type="button"
            className="text-sm font-medium text-destructive transition-colors hover:text-destructive/80"
          >
            Delete
          </button>
        }
      />
    );
  }
  return (
    <span
      className="text-sm text-[var(--tk-body)]"
      title="This ticket has logged time and can't be deleted"
    >
      Cannot Delete due to Time Logged
    </span>
  );
}
