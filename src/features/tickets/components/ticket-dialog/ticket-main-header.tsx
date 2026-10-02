import { Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import type { Ticket } from "../../api/tickets.api";
import { ticketUrl } from "../../lib/ticket-links";
import type { TicketTab } from "../../lib/ticket-tab";

/** Code + copy-link row, read-only notice, title field and the tab bar. */
export function TicketMainHeader({
  ticket,
  title,
  onTitleChange,
  sprintLocked,
  viewOnlyMessage,
  activeTab,
  onTabChange,
  commentCount,
  estLogCount,
}: {
  ticket: Ticket;
  title: string;
  onTitleChange: (title: string) => void;
  sprintLocked: boolean;
  /** Set when the ticket is read-only because of the user's access, not a closed sprint. */
  viewOnlyMessage?: string;
  activeTab: TicketTab;
  onTabChange: (tab: TicketTab) => void;
  commentCount: number;
  estLogCount: number;
}) {
  const copyLink = () => {
    navigator.clipboard
      .writeText(ticketUrl(ticket.id))
      .then(() => toast.success("Link copied"))
      .catch(() => toast.error("Could not copy link"));
  };

  const tabs: { id: TicketTab; label: string; count: number | null }[] = [
    { id: "description", label: "Description", count: null },
    { id: "comments", label: "Comments", count: commentCount },
    { id: "estlogs", label: "Estimates and Work Logs", count: estLogCount },
  ];

  return (
    <>
      {/* Header row */}
      <div className="flex shrink-0 items-center gap-2 text-sm">
        <span className="font-mono uppercase tracking-wide text-[var(--tk-muted)]">
          {ticket.code}
        </span>
        <span className="text-[var(--tk-faint)]">·</span>
        <button
          type="button"
          onClick={copyLink}
          aria-label="Copy ticket link"
          className="text-[var(--tk-muted)] transition-colors hover:text-[var(--tk-accent)]"
        >
          <Copy className="h-4 w-4" />
        </button>
      </div>

      {sprintLocked && (
        <div className="mt-4 shrink-0 rounded-xl border border-[var(--tk-border)] bg-[var(--tk-surface)] px-4 py-3 text-sm text-[var(--tk-body)]">
          {viewOnlyMessage ??
            "This ticket is part of a completed sprint and is read-only. Re-open the sprint to make changes."}
        </div>
      )}

      {/* Floating-label title */}
      <div className="relative mt-4 shrink-0 rounded-xl border border-[var(--tk-border)] bg-[var(--tk-surface)] px-3 pb-2 pt-5">
        <label
          htmlFor={`ticket-title-${ticket.id}`}
          className="field-label pointer-events-none absolute left-3 top-1.5"
        >
          Title
        </label>
        <input
          id={`ticket-title-${ticket.id}`}
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          readOnly={sprintLocked}
          className="w-full bg-transparent text-[18px] font-semibold text-[var(--tk-text)] outline-none placeholder:text-[var(--tk-faint)]"
        />
      </div>

      {/* Tab bar */}
      <div className="mt-5 flex shrink-0 items-center gap-6 border-b border-[var(--tk-divider)]">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTabChange(t.id)}
            className={cn(
              "relative -mb-px flex items-center gap-2 pb-2.5 text-sm font-medium transition-colors",
              activeTab === t.id
                ? "text-[var(--tk-text)]"
                : "text-[var(--tk-muted)] hover:text-[var(--tk-body)]",
            )}
          >
            {t.label}
            {t.count != null && (
              <span className="rounded-full bg-[var(--tk-border)] px-1.5 py-0.5 text-[11px] leading-none text-[var(--tk-body)]">
                {t.count}
              </span>
            )}
            {activeTab === t.id && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[var(--tk-accent)]" />
            )}
          </button>
        ))}
      </div>
    </>
  );
}
