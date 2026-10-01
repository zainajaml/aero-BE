import { NotificationsLog } from "../components/notifications-log";

export function NotificationsView() {
  return (
    <div className="flex h-[calc(100vh-2.5rem)] flex-col gap-4">
      <div className="shrink-0">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground">
          A record of emails and SMS messages sent to recipients.
        </p>
      </div>

      <NotificationsLog />
    </div>
  );
}
