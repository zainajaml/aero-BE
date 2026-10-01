import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { useProjects } from "@/features/projects/project-context";
import { TicketDialogSlot } from "@/shared/ui/ticket-dialog-slot";
import type { NotificationRow } from "../api/notifications.api";
import { useNotificationLog } from "../hooks/notification-queries";
import { useNotificationDate } from "../hooks/use-notification-date";
import { useRetryNotification } from "../hooks/use-retry-notification";
import { sortRows, type SortDir, type SortKey } from "../lib/notification-format";
import { NotificationDetailDialog } from "./notification-detail-dialog";
import { NotificationsTable } from "./notifications-table";
import { NotificationsToolbar } from "./notifications-toolbar";

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Notification log (email/SMS sends) for the active project, or every visible project in the
 * "All projects" view. Filtering and paging happen on the server; column sorting reorders the
 * current page. Also embedded in the admin page.
 */
export function NotificationsLog() {
  const fmt = useNotificationDate();
  const { activeProjectId, isAllProjects } = useProjects();
  const projectId = isAllProjects ? undefined : (activeProjectId ?? undefined);
  const { hasAnyRole } = useAuth();
  const canRetry = hasAnyRole(["super_admin", "account_admin", "admin"]);
  const { retry, retryingId } = useRetryNotification();

  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [pageSize, setPageSize] = useState<number>(50);
  const [page, setPage] = useState(1);
  const [failedOnly, setFailedOnly] = useState(false);
  const [selected, setSelected] = useState<NotificationRow | null>(null);
  const [openTicketId, setOpenTicketId] = useState<string | null>(null);

  // Debounce the free-text filter so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setSearch(filter.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [filter]);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize, failedOnly, projectId]);

  const { data, isLoading } = useNotificationLog({
    projectId,
    failed: failedOnly ? "true" : undefined,
    q: search || undefined,
    page,
    pageSize,
  });

  const total = data?.total ?? 0;
  const failedCount = data?.failedCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const rows = useMemo(
    () => sortRows(data?.items ?? [], sortKey, sortDir),
    [data?.items, sortKey, sortDir],
  );

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "createdAt" ? "desc" : "asc");
    }
  };

  const handleRetry = (row: NotificationRow) => void retry(row.id);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <NotificationsToolbar
        filter={filter}
        onFilterChange={setFilter}
        failedCount={failedCount}
        failedOnly={failedOnly}
        onToggleFailed={() => setFailedOnly((v) => !v)}
        total={total}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        onPageChange={setPage}
        showPager={!isLoading && total > 0}
      />

      <NotificationsTable
        rows={rows}
        isLoading={isLoading}
        hasFilter={!!filter}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={toggleSort}
        onSelect={setSelected}
        onOpenTicket={setOpenTicketId}
        canRetry={canRetry}
        retryingId={retryingId}
        onRetry={handleRetry}
        fmt={fmt}
      />

      <NotificationDetailDialog
        selected={selected}
        onClose={() => setSelected(null)}
        onOpenTicket={setOpenTicketId}
        canRetry={canRetry}
        retryingId={retryingId}
        onRetry={handleRetry}
        fmt={fmt}
      />

      <TicketDialogSlot
        ticketId={openTicketId}
        open={!!openTicketId}
        onOpenChange={(open) => !open && setOpenTicketId(null)}
      />
    </div>
  );
}
