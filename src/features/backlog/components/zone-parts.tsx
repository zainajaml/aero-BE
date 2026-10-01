import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, MoreVertical, Plus } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { formatDHM } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { CreateTicketDialog } from "@/features/tickets/components/create-ticket/create-ticket-dialog";
import { DropZone } from "./dnd-primitives";

/** "Est … / Log …" totals of a zone. */
export function ZoneTotals({ est, logged }: { est: number; logged: number }) {
  return (
    <>
      <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
        Est {formatDHM(est)}
      </span>
      <span
        className={cn(
          "font-mono text-[11px] tabular-nums",
          logged > est && est > 0 ? "text-neon-rose" : "text-foreground",
        )}
      >
        Log {formatDHM(logged)}
      </span>
    </>
  );
}

export interface ZoneMenuItem {
  label: string;
  disabled?: boolean;
  onSelect: () => void;
}

/**
 * "…" menu of a zone. An action always closes the menu first, then runs on the next frame
 * (dialogs opened from it would otherwise be unmounted with the menu).
 */
export function ZoneActionsMenu({ label, items }: { label: string; items: ZoneMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const runAfterClose = (fn: () => void) => {
    setOpen(false);
    requestAnimationFrame(() => fn());
  };
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground focus-visible:bg-transparent focus-visible:ring-0 data-[state=open]:bg-transparent"
          aria-label={label}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-[9rem]">
        {items.map((item) => (
          <DropdownMenuItem
            key={item.label}
            className="text-xs"
            disabled={item.disabled}
            onSelect={() => runAfterClose(item.onSelect)}
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function CollapseButton({
  collapsed,
  onToggle,
  noun,
}: {
  collapsed: boolean;
  onToggle: () => void;
  noun: "sprint" | "backlog";
}) {
  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-8 w-8 p-0 text-xs text-muted-foreground hover:text-foreground"
      aria-label={collapsed ? `Expand ${noun}` : `Collapse ${noun}`}
      aria-expanded={!collapsed}
      onClick={onToggle}
    >
      {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
    </Button>
  );
}

/** "+ Ticket" button opening the create dialog (optionally pre-set to a sprint). */
export function NewTicketButton({
  projectId,
  projectKey,
  sprintId,
}: {
  projectId: string;
  projectKey: string;
  sprintId?: string;
}) {
  return (
    <CreateTicketDialog
      projectId={projectId}
      projectKey={projectKey}
      sprintId={sprintId}
      trigger={
        <Button
          size="sm"
          className="h-8 gap-1.5 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Ticket
        </Button>
      }
    />
  );
}

/** The zone's rows, or (when collapsed) a drop target shown only while a ticket is dragged. */
export function ZoneBody({
  zoneId,
  label,
  collapsed,
  ticketDragging,
  suppressLabel,
  collapsedText,
  children,
}: {
  zoneId: string;
  label: string;
  collapsed: boolean;
  ticketDragging: boolean;
  suppressLabel?: boolean;
  collapsedText: string;
  children: ReactNode;
}) {
  if (!collapsed) {
    return (
      <DropZone id={zoneId} label={label} suppressLabel={suppressLabel}>
        {children}
      </DropZone>
    );
  }
  if (!ticketDragging) return null;
  return (
    <DropZone id={zoneId} label={label}>
      <div className="rounded-lg border border-dashed border-primary/40 px-3 py-2 text-center text-xs text-muted-foreground">
        {collapsedText}
      </div>
    </DropZone>
  );
}
