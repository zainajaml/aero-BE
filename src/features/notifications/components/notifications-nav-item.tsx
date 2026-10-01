import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import { cn } from "@/shared/lib/utils";
import { useUnseenNotificationCount } from "../hooks/notification-queries";

const LAST_SEEN_KEY = "notifications-last-seen";

function readLastSeen(): string | undefined {
  try {
    return localStorage.getItem(LAST_SEEN_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

function writeLastSeen(iso: string) {
  try {
    localStorage.setItem(LAST_SEEN_KEY, iso);
  } catch {
    /* storage unavailable (private mode) */
  }
}

/**
 * Sidebar menu entry for the notifications log. Polls the unseen count every minute and shows a
 * badge for notifications that arrived since the user last opened the Notifications page.
 */
export function NotificationsNavItem({
  onNavigate,
}: {
  onNavigate?: () => void;
} = {}) {
  const { user } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const active = path.startsWith("/notifications");

  // First visit ever: treat existing history as already seen so a brand-new account doesn't show
  // a badge for notifications it never saw.
  const [lastSeen, setLastSeen] = useState<string | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    const stored = readLastSeen();
    if (stored) return stored;
    const now = new Date().toISOString();
    writeLastSeen(now);
    return now;
  });

  // Mark everything as seen whenever the page is open (and again when leaving it).
  useEffect(() => {
    if (!active) return;
    const mark = () => {
      const now = new Date().toISOString();
      writeLastSeen(now);
      setLastSeen(now);
    };
    mark();
    return mark;
  }, [active]);

  const { data } = useUnseenNotificationCount(lastSeen, !!user && !!lastSeen && !active);
  const unseen = active ? 0 : (data?.count ?? 0);

  return (
    <Link
      to="/notifications"
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all",
        "hover:bg-accent/50 hover:text-foreground",
        active && "bg-accent text-accent-foreground shadow-[inset_0_0_0_1px] shadow-border",
      )}
    >
      <Bell className={cn("h-4 w-4", active && "text-foreground")} />
      <span>Notifications</span>
      {unseen > 0 && (
        <span className="ml-auto grid min-w-[18px] place-items-center rounded-full border border-border bg-muted px-1 text-[10px] font-bold leading-[16px] text-muted-foreground">
          {unseen > 9 ? "9+" : unseen}
        </span>
      )}
    </Link>
  );
}
