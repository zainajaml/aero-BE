import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { isApiError } from "@/shared/api/errors";
import { retryNotification } from "../api/notifications.api";
import { notificationKeys } from "./notification-queries";

/** Re-queues a failed notification and maps the backend refusal codes to friendly toasts. */
export function useRetryNotification() {
  const queryClient = useQueryClient();
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const retry = async (id: string) => {
    setRetryingId(id);
    try {
      await retryNotification(id);
      toast.success("Notification re-queued");
      await queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    } catch (e) {
      const code = isApiError(e) ? e.code : null;
      if (code === "NO_STORED_CONTENT") {
        toast.error("Can't resend — this notification's content wasn't captured");
      } else if (code === "EMAIL_SUPPRESSED") {
        toast.error("Can't resend — the recipient's address is unsubscribed");
      } else if (code === "NOT_RETRYABLE") {
        toast.info("This notification is no longer in a failed state");
        void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      } else if (isApiError(e) && e.status !== 500 && e.status !== 0) {
        toast.error(e.message);
      } else {
        toast.error("Couldn't re-queue this notification");
      }
    } finally {
      setRetryingId(null);
    }
  };

  return { retry, retryingId };
}
