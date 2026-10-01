import { errorMessage, isApiError } from "@/shared/api/errors";

const SKIP_REASONS: Record<string, string> = {
  HAS_LOGGED_TIME: "has logged time",
  SPRINT_COMPLETED: "is in a completed sprint",
};

/** Human text for a bulk-delete skip reason code. */
export function skipReasonLabel(reason: string): string {
  return SKIP_REASONS[reason] ?? reason.toLowerCase().replace(/_/g, " ");
}

const FRIENDLY: Record<string, string> = {
  SPRINT_COMPLETED: "This sprint is completed — its tickets can no longer be changed.",
  PROJECT_ARCHIVED: "This project is archived — restore it to make changes.",
  VIEW_ONLY: "You have view-only access — changes are not allowed.",
  HAS_LOGGED_TIME: "Tickets with logged time cannot be deleted.",
  EPIC_NAME_TAKEN: "An epic with this name already exists.",
};

/** Toast text for a failed ticket-domain write: the server message, or a friendly default per code. */
export function ticketErrorMessage(error: unknown, fallback?: string): string {
  if (isApiError(error)) {
    const friendly = FRIENDLY[error.code];
    if (error.message && error.message !== "Something went wrong. Please try again.")
      return error.message;
    if (friendly) return friendly;
  }
  return errorMessage(error, fallback);
}
