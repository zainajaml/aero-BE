import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { useNotificationPrefs } from "../hooks/use-notification-prefs";
import { NOTIF_ROWS } from "../lib/notification-catalogue";

type NotifSortKey = "category" | "trigger" | "recipient" | "notification" | "enabled";

const COLUMNS: { key: NotifSortKey; label: string }[] = [
  { key: "category", label: "Category" },
  { key: "trigger", label: "Trigger" },
  { key: "recipient", label: "Recipient" },
  { key: "notification", label: "Notification" },
  { key: "enabled", label: "Enabled" },
];

function NotifSortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />;
  return dir === "asc" ? (
    <ArrowUp className="h-3.5 w-3.5" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5" />
  );
}

/** Notification preference matrix: one switch per trigger, saved instantly per key. */
export function NotificationPrefsPanel() {
  const { user } = useAuth();
  const { notifPrefs, pendingKeys, isNotifOn, toggleNotif } = useNotificationPrefs(user?.id);

  const [notifSortKey, setNotifSortKey] = useState<NotifSortKey | null>(null);
  const [notifSortDir, setNotifSortDir] = useState<"asc" | "desc">("asc");
  const [notifFilter, setNotifFilter] = useState("");

  const toggleNotifSort = (key: NotifSortKey) => {
    if (notifSortKey === key) {
      setNotifSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setNotifSortKey(key);
      setNotifSortDir("asc");
    }
  };

  const sortedNotifRows = useMemo(() => {
    const on = (key: string) => notifPrefs[key] ?? true;
    const q = notifFilter.trim().toLowerCase();
    const filtered = q
      ? NOTIF_ROWS.filter(
          (r) =>
            r.category.toLowerCase().includes(q) ||
            r.trigger.toLowerCase().includes(q) ||
            r.recipient.toLowerCase().includes(q) ||
            r.notification.toLowerCase().includes(q),
        )
      : NOTIF_ROWS;
    if (!notifSortKey) return filtered;
    const dir = notifSortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (notifSortKey === "enabled") return (Number(on(a.key)) - Number(on(b.key))) * dir;
      return a[notifSortKey].localeCompare(b[notifSortKey]) * dir;
    });
  }, [notifSortKey, notifSortDir, notifPrefs, notifFilter]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="shrink-0 px-3">
        <div className="flex items-center gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={notifFilter}
              onChange={(e) => setNotifFilter(e.target.value)}
              placeholder="Filter by category, trigger, recipient…"
              className="pl-8"
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {sortedNotifRows.length} {sortedNotifRows.length === 1 ? "entry" : "entries"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-auto">
          <Table containerClassName="overflow-visible" className="w-auto min-w-full">
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow className="hover:bg-transparent">
                {COLUMNS.map((col) => (
                  <TableHead key={col.key} className="whitespace-nowrap">
                    <button
                      onClick={() => toggleNotifSort(col.key)}
                      className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-foreground"
                    >
                      {col.label}
                      <NotifSortIcon active={notifSortKey === col.key} dir={notifSortDir} />
                    </button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedNotifRows.map((row) => (
                <TableRow key={row.key}>
                  <TableCell className="whitespace-nowrap align-top text-xs font-medium text-muted-foreground">
                    {row.category}
                  </TableCell>
                  <TableCell className="whitespace-nowrap align-top text-sm font-medium">
                    {row.trigger}
                  </TableCell>
                  <TableCell className="whitespace-nowrap align-top text-xs text-muted-foreground">
                    {row.recipient}
                  </TableCell>
                  <TableCell
                    className="max-w-[46rem] align-top text-xs text-muted-foreground break-words"
                    title={row.notification}
                  >
                    {row.notification}
                  </TableCell>
                  <TableCell className="w-[1%] whitespace-nowrap align-top">
                    <Switch
                      checked={isNotifOn(row.key)}
                      onCheckedChange={(v) => toggleNotif(row.key, v)}
                      disabled={!!pendingKeys[row.key]}
                      aria-label={row.trigger}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
