import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Loader2, X } from "lucide-react";
import { displayName } from "@/features/users/lib/names";
import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import { Input } from "@/shared/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/shared/ui/select";
import { formatDHM } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import type { Ticket } from "../../api/tickets.api";
import type { TicketDialogData } from "../../hooks/ticket-dialog/use-ticket-dialog-data";
import type { TicketForm } from "../../hooks/ticket-dialog/use-ticket-form";
import { EpicTagInput } from "../epics/epic-tag-input";
import {
  PRIORITIES,
  PRIORITY_COLOR,
  PropRow,
  TICKET_TYPES,
  TK_CONTENT,
  TK_ITEM,
  TK_PLAIN_TRIGGER,
  truncateChars,
} from "./dialog-ui";
import { TicketDeleteAction } from "./ticket-delete-action";

export function TicketSidebar({
  ticket,
  data,
  form,
  totalEstimate,
  onClose,
  onDelete,
}: {
  ticket: Ticket;
  data: TicketDialogData;
  form: TicketForm;
  totalEstimate: number;
  onClose: () => void;
  onDelete: () => void;
}) {
  const { columns, members, sprints, epics, sprintLocked, viewOnly } = data;
  const [dueOpen, setDueOpen] = useState(false);
  const [pointsOpen, setPointsOpen] = useState(false);

  const backlogColumn = columns.find((c) => c.name.toLowerCase() === "backlog") ?? columns[0];
  const currentColumn =
    columns.find((c) => c.id === (form.columnId ?? ticket.columnId)) ?? backlogColumn;
  const assignee = members.find((m) => m.userId === form.assigneeId);
  // An assignee who is no longer assignable (e.g. archived) still shows by name.
  const formerAssignee =
    !assignee && form.assigneeId ? data.otherPeople.get(form.assigneeId) : undefined;
  const sprintName = form.sprintId ? sprints.find((s) => s.id === form.sprintId)?.name : undefined;
  const selectedEpics = useMemo(() => {
    const byId = new Map(epics.map((e) => [e.id, e.name]));
    return form.epicIds.map((id) => ({ id, name: byId.get(id) ?? "" }));
  }, [epics, form.epicIds]);

  const totalLogged = ticket.loggedMinutes ?? 0;
  const progressPct =
    totalEstimate > 0
      ? Math.min(100, Math.round((totalLogged / totalEstimate) * 100))
      : totalLogged > 0
        ? 100
        : 0;
  const isOverEstimate = totalLogged > totalEstimate;

  return (
    <aside className="flex w-[320px] shrink-0 flex-col border-l border-[var(--tk-divider)] bg-[var(--tk-sidebar)]">
      <div className="flex shrink-0 items-center justify-end gap-4 px-5 pt-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onClose}
          className="h-9 w-9 rounded-lg border-[var(--tk-border)] bg-transparent p-0 text-[var(--tk-body)] transition-colors hover:bg-[var(--tk-surface)] hover:text-[var(--tk-text)]"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="tk-scroll flex-1 overflow-y-auto px-5 py-3">
        <PropRow label="Stage">
          <Select
            value={currentColumn?.id ?? ""}
            onValueChange={(v) => form.setColumnId(v)}
            disabled={sprintLocked}
          >
            <SelectTrigger
              className={cn(
                TK_PLAIN_TRIGGER,
                "rounded-full bg-[rgba(242,214,75,0.12)] px-2.5 py-1",
              )}
            >
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--tk-accent)]" />
                <span className="text-[var(--tk-accent)]">
                  {currentColumn ? truncateChars(currentColumn.name, 13) : "—"}
                </span>
              </span>
            </SelectTrigger>
            <SelectContent className={TK_CONTENT} alignOffset={-10}>
              {columns.map((c) => (
                <SelectItem key={c.id} value={c.id} className={TK_ITEM}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PropRow>

        <PropRow label="Assignee">
          <Select
            value={form.assigneeId ?? "unassigned"}
            disabled={sprintLocked}
            onValueChange={(v) => form.setAssigneeId(v === "unassigned" ? null : v)}
          >
            <SelectTrigger className={cn(TK_PLAIN_TRIGGER, "min-w-0 [&>span]:line-clamp-none")}>
              {assignee ? (
                <span className="truncate">{displayName(assignee)}</span>
              ) : formerAssignee ? (
                <span className="truncate">{displayName(formerAssignee)}</span>
              ) : (
                <span className="text-[var(--tk-muted)]">Unassigned</span>
              )}
            </SelectTrigger>
            <SelectContent className={TK_CONTENT} alignOffset={-10}>
              <SelectItem value="unassigned" className={TK_ITEM}>
                Unassigned
              </SelectItem>
              {members.map((m) => (
                <SelectItem key={m.userId} value={m.userId} className={TK_ITEM}>
                  {displayName(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PropRow>

        <PropRow label="Priority">
          <Select value={form.priority} onValueChange={form.setPriority} disabled={sprintLocked}>
            <SelectTrigger className={TK_PLAIN_TRIGGER}>
              <span className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-[3px]"
                  style={{ backgroundColor: PRIORITY_COLOR[form.priority] ?? "#6e6a60" }}
                />
                <span className="capitalize">{form.priority}</span>
              </span>
            </SelectTrigger>
            <SelectContent className={TK_CONTENT} alignOffset={-10}>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p} className={cn(TK_ITEM, "capitalize")}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PropRow>

        <PropRow label="Type">
          <Select value={form.type} onValueChange={form.setType} disabled={sprintLocked}>
            <SelectTrigger className={cn(TK_PLAIN_TRIGGER, "capitalize")}>
              <span className="capitalize">{form.type}</span>
            </SelectTrigger>
            <SelectContent className={TK_CONTENT} alignOffset={-10}>
              {TICKET_TYPES.map((t) => (
                <SelectItem key={t} value={t} className={cn(TK_ITEM, "capitalize")}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PropRow>

        <PropRow label="Sprint">
          <Select
            value={form.sprintId ?? "none"}
            disabled={sprintLocked}
            onValueChange={(v) => form.setSprintId(v === "none" ? null : v)}
          >
            <SelectTrigger
              className={cn(TK_PLAIN_TRIGGER, !form.sprintId && "text-[var(--tk-muted)]")}
            >
              <span>{sprintName ?? "No sprint"}</span>
            </SelectTrigger>
            <SelectContent className={TK_CONTENT} alignOffset={-10}>
              <SelectItem value="none" className={TK_ITEM}>
                No sprint
              </SelectItem>
              {sprints
                .filter((s) => s.status !== "completed" || s.id === ticket.sprintId)
                .map((s) => (
                  <SelectItem key={s.id} value={s.id} className={TK_ITEM}>
                    {s.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </PropRow>

        <PropRow label="Points">
          <Popover open={pointsOpen} onOpenChange={setPointsOpen}>
            <PopoverTrigger asChild disabled={sprintLocked}>
              <button
                type="button"
                disabled={sprintLocked}
                className={cn(
                  "text-sm",
                  form.storyPoints != null ? "text-[var(--tk-body)]" : "text-[var(--tk-muted)]",
                )}
              >
                {form.storyPoints != null ? form.storyPoints : "Add points"}
              </button>
            </PopoverTrigger>

            <PopoverContent align="start" className={cn("w-36 p-2", TK_CONTENT)}>
              <Input
                type="number"
                min={0}
                autoFocus
                defaultValue={form.storyPoints ?? ""}
                className="h-8 border-[var(--tk-border)] bg-transparent text-sm text-[var(--tk-text)]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                }}
                onBlur={(e) => {
                  const raw = e.target.value.trim();
                  const next = raw === "" ? null : Math.max(0, parseInt(raw, 10) || 0);
                  form.setStoryPoints(next);
                  setPointsOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </PropRow>

        <PropRow label="Estimate">
          <span
            className={cn(
              "font-mono text-sm",
              totalEstimate > 0 ? "text-[var(--tk-body)]" : "text-[var(--tk-muted)]",
            )}
          >
            {totalEstimate > 0 ? formatDHM(totalEstimate) : "No estimate"}
          </span>
        </PropRow>

        <PropRow label="Epics">
          <div className={cn(sprintLocked && "pointer-events-none opacity-70")}>
            <EpicTagInput
              projectId={ticket.projectId}
              selected={selectedEpics}
              onChange={(next) => form.setEpicIds(next.map((e) => e.id))}
            />
          </div>
        </PropRow>

        <PropRow label="Due date">
          <Popover open={dueOpen} onOpenChange={setDueOpen}>
            <PopoverTrigger asChild disabled={sprintLocked}>
              <button
                type="button"
                disabled={sprintLocked}
                className={cn(
                  "text-sm",
                  form.dueDate ? "text-[var(--tk-body)]" : "text-[var(--tk-muted)]",
                )}
              >
                {form.dueDate
                  ? format(new Date(`${form.dueDate}T00:00:00`), "MMM d, yyyy")
                  : "Set date"}
              </button>
            </PopoverTrigger>

            <PopoverContent
              className={cn(
                "w-auto max-w-[calc(100vw-2rem)] overflow-hidden border p-0",
                TK_CONTENT,
              )}
              align="end"
              side="bottom"
              sideOffset={4}
              avoidCollisions
              collisionPadding={16}
            >
              <Calendar
                mode="single"
                selected={form.dueDate ? new Date(`${form.dueDate}T00:00:00`) : undefined}
                onSelect={(d) => {
                  form.setDueDate(d ? format(d, "yyyy-MM-dd") : null);
                  setDueOpen(false);
                }}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </PropRow>

        {/* Time tracking */}
        <div className="my-4 border-t border-[var(--tk-divider)]" />
        <div className="text-sm font-semibold text-[var(--tk-text)]">Time tracking</div>
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-[var(--tk-divider)]">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              isOverEstimate ? "bg-destructive" : "bg-[var(--tk-accent)]",
            )}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div
          className={cn(
            "mt-2 font-mono text-xs",
            isOverEstimate ? "text-destructive" : "text-[var(--tk-accent)]",
          )}
        >
          <span>Estimated</span> <span>{formatDHM(totalEstimate)}</span>
          <span> | </span>
          <span>Actual</span> <span>{formatDHM(totalLogged)}</span>
        </div>

        {/* Created by */}
        <div className="my-4 border-t border-[var(--tk-divider)]" />
        <div className="text-xs text-[var(--tk-muted)]">
          Created by{" "}
          <span className="text-[var(--tk-body)]">
            {ticket.reporterId ? data.memberName(ticket.reporterId, "—") : "—"}
          </span>
        </div>
        <div className="text-xs text-[var(--tk-faint)]">
          {format(new Date(ticket.createdAt), "MMM d, yyyy")}
        </div>
        <div className="mt-[10px]">
          <TicketDeleteAction
            sprintLocked={sprintLocked}
            viewOnly={viewOnly}
            isManager={data.isManager}
            loggedMinutes={totalLogged}
            onDelete={onDelete}
          />
        </div>
      </div>

      {/* Save pinned to bottom — replaced with a notice when the sprint is closed */}
      <div className="flex shrink-0 justify-end border-t border-[var(--tk-divider)] p-4">
        {sprintLocked ? (
          <div className="w-full rounded-xl border border-[var(--tk-border)] bg-[var(--tk-surface)] px-4 py-3 text-center text-sm font-medium text-[var(--tk-muted)]">
            {viewOnly ? data.viewMsg : "No changes allowed — this sprint is closed."}
          </div>
        ) : (
          <Button
            type="button"
            size="sm"
            onClick={form.saveAndClose}
            disabled={form.saving}
            className="w-fit rounded-full bg-[var(--tk-accent)] px-4 py-2 text-sm font-semibold text-[var(--tk-on-accent)] hover:bg-[var(--tk-accent-hover)] disabled:opacity-60"
          >
            {form.saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            {form.saving ? "Saving…" : "Save Ticket"}
          </Button>
        )}
      </div>
    </aside>
  );
}
