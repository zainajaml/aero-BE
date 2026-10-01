import { NotificationPrefsPanel } from "../components/notification-prefs-panel";

export function PreferencesView() {
  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col">
      <div className="shrink-0">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Preferences</h1>
        <p className="text-sm text-muted-foreground">
          Turn individual notifications on or off. Changes save instantly.
        </p>
      </div>

      <div className="mt-6 min-h-0 flex-1 overflow-hidden">
        <NotificationPrefsPanel />
      </div>
    </div>
  );
}
