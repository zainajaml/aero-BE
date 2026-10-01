import { useState } from "react";
import { CheckSquare, Plus, Search, Square } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { cn } from "@/shared/lib/utils";
import type { SupportIssue } from "../api/support.api";
import { shortDayFmt } from "../lib/support-format";

/** Left sidebar of the support modal: brand header, search, closed filter and the ticket list. */
export function SupportIssueList({
  issues,
  activeId,
  isAdmin,
  creating,
  onSelect,
  onNew,
}: {
  issues: SupportIssue[];
  activeId: string | null;
  isAdmin: boolean;
  creating: boolean;
  onSelect: (issueId: string) => void;
  onNew: () => void;
}) {
  const [search, setSearch] = useState("");
  const [showClosed, setShowClosed] = useState(true);

  const q = search.trim().toLowerCase();
  const visibleIssues = issues.filter((issue) => {
    if (!showClosed && issue.status === "closed") return false;
    if (!q) return true;
    return (
      issue.subject.toLowerCase().includes(q) ||
      issue.ticketNumber.toLowerCase().includes(q) ||
      issue.owner.name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex w-[340px] shrink-0 flex-col border-r border-border/60">
      {/* Brand header */}
      <div className="flex items-center gap-3 px-5 py-5">
        <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-border/60 bg-secondary text-sm font-bold text-foreground">
          S
        </span>
        <span className="font-display text-xl font-semibold tracking-tight">Support</span>
        {isAdmin && (
          <Badge variant="secondary" className="rounded-full">
            Admin
          </Badge>
        )}
      </div>

      {/* Search */}
      <div className="px-5 pb-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets, reporters…"
            className="h-9 rounded-full border-border/60 bg-background/40 pl-10"
          />
        </div>
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-2 px-5 pb-3">
        <Button
          type="button"
          variant={showClosed ? "default" : "outline"}
          size="sm"
          className="h-8 gap-1.5 rounded-full text-xs"
          onClick={() => setShowClosed((v) => !v)}
        >
          {showClosed ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
          {showClosed ? "Hide closed" : "Show closed"}
        </Button>
        <span className="ml-auto text-xs text-muted-foreground">
          {visibleIssues.length} {visibleIssues.length === 1 ? "ticket" : "tickets"}
        </span>
        <Button
          size="icon"
          className="h-8 w-8 shrink-0 rounded-full"
          onClick={onNew}
          disabled={creating}
          aria-label="New issue"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-1 px-3 pb-4">
          {visibleIssues.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              No tickets to show.
            </p>
          )}
          {visibleIssues.map((issue) => {
            const active = activeId === issue.id;
            return (
              <button
                key={issue.id}
                onClick={() => onSelect(issue.id)}
                className={cn(
                  "group grid w-full grid-cols-[10px_1fr_auto] items-start gap-2 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent/40",
                  active && "bg-accent/70",
                )}
              >
                <span
                  className={cn(
                    "mt-1.5 h-2 w-2 rounded-full",
                    issue.status === "open" ? "bg-primary" : "bg-muted-foreground/40",
                  )}
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{issue.subject}</span>
                  <span className="mt-0.5 block truncate font-mono text-[11px] text-muted-foreground">
                    {issue.ticketNumber} · {issue.owner.name}
                  </span>
                </span>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {shortDayFmt.format(new Date(issue.createdAt)).replace(/,?\s\d{4}$/, "")}
                </span>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
