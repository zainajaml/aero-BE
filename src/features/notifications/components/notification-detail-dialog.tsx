import { AlertTriangle, Loader2, RotateCcw, Ticket } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import type { NotificationRow } from "../api/notifications.api";
import { useNotificationDetail } from "../hooks/notification-queries";
import { detailsText, humanizeTemplate, statusMeta } from "../lib/notification-format";

type Props = {
  selected: NotificationRow | null;
  onClose: () => void;
  onOpenTicket: (ticketId: string) => void;
  canRetry: boolean;
  retryingId: string | null;
  onRetry: (row: NotificationRow) => void;
  fmt: (d: string) => string;
};

export function NotificationDetailDialog({
  selected,
  onClose,
  onOpenTicket,
  canRetry,
  retryingId,
  onRetry,
  fmt,
}: Props) {
  const { data: detail, isLoading } = useNotificationDetail(selected?.id ?? null);
  const html = detail?.id === selected?.id ? detail?.html : null;
  const details = selected ? detailsText(selected) : null;

  return (
    <Dialog open={!!selected} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="pr-6">
            {selected
              ? selected.subject?.trim() || humanizeTemplate(selected.templateName)
              : "Notification"}
          </DialogTitle>
          <DialogDescription>
            {selected?.author ? `Created by ${selected.author}` : "Notification"}
            {selected ? ` · ${fmt(selected.createdAt)}` : ""}
          </DialogDescription>
        </DialogHeader>
        {selected && statusMeta(selected.status).failed && (
          <div className="flex flex-wrap items-center gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-3">
            <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-destructive">Delivery failed</p>
              <p className="mt-0.5 break-words text-xs text-muted-foreground">
                {selected.errorMessage ?? "The mail provider didn't accept this message."}
              </p>
            </div>
            {canRetry && (
              <Button
                size="sm"
                variant="outline"
                disabled={retryingId === selected.id}
                onClick={() => onRetry(selected)}
                className="h-7 shrink-0 gap-1.5 rounded-full px-3 text-xs"
              >
                {retryingId === selected.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" />
                )}
                Resend
              </Button>
            )}
          </div>
        )}
        {selected?.ticketId && (
          <button
            type="button"
            onClick={() => {
              onOpenTicket(selected.ticketId as string);
              onClose();
            }}
            className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Open {selected.ticketCode ?? "ticket"}
            <Ticket className="h-3.5 w-3.5" />
          </button>
        )}
        {details && (
          <div className="rounded-md border border-border bg-muted/50 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Details
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{details}</p>
          </div>
        )}
        {html ? (
          <iframe
            title="Notification content"
            sandbox="allow-popups allow-popups-to-escape-sandbox"
            srcDoc={`<base target="_blank">${html}`}
            className="h-[60vh] w-full rounded-md border bg-card"
          />
        ) : isLoading ? (
          <div className="flex justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No content was captured for this notification. Newly sent notifications include their
            full content here.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
