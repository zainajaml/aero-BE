import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { displayName } from "@/features/users/lib/names";
import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import { CloseButton } from "@/shared/ui/close-button";
import { Input } from "@/shared/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/shared/ui/select";
import { formatDHM } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import type {
  CreateTicketForm,
  TicketPriority,
  TicketType,
} from "../../hooks/create-ticket/use-create-ticket-form";
import { EpicTagInput } from "../epics/epic-tag-input";
import {
  PRIORITIES,
  PRIORITY_COLOR,
  PropRow,
  TICKET_TYPES,
  TK_CONTENT_BASE as TK_CONTENT,
  TK_ITEM,
  TK_PLAIN_TRIGGER,
} from "../ticket-dialog/dialog-ui";

export function CreateTicketSidebar({
  projectId,
  form,
  onClose,
}: {
  projectId: string;
  form: CreateTicketForm;
  onClose: () => void;
}) {
  const [dueOpen, setDueOpen] = useState(false);
  const { columns, members, sprints } = form;
  const selectedAssignee = members.find((m) => m.userId === form.assigneeId);
  const selectedSprintName =
    form.selectedSprintId === "none"
      ? null
      : (sprints.find((s) => s.id === form.selectedSprintId)?.name ?? null);
  const totalEstimate = form.estimates.total;

  return (
    <aside className="flex w-[320px] shrink-0 flex-col border-l border-[var(--tk-divider)] bg-[var(--tk-sidebar)]">
      <div className="flex shrink-0 items-center justify-end gap-4 px-5 pt-4">
        <CloseButton onClick={onClose} />
      </div>

      <div className="tk-scroll flex-1 overflow-y-auto px-5 py-3">
        <PropRow label="Stage">
          <Select value={form.columnId} onValueChange={form.setColumnId}>
            <SelectTrigger
              className={cn(
                TK_PLAIN_TRIGGER,
                "rounded-full bg-[rgba(242,214,75,0.12)] px-2.5 py-1",
              )}
            >
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--tk-accent)]" />
                <span className="text-[var(--tk-accent)]">
                  {columns.find((c) => c.id === form.columnId)?.name ?? "Backlog"}
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
          <Select value={form.assigneeId} onValueChange={form.setAssigneeId}>
            <SelectTrigger className={cn(TK_PLAIN_TRIGGER, "min-w-0 [&>span]:line-clamp-none")}>
              {selectedAssignee ? (
                <span className="truncate">{displayName(selectedAssignee)}</span>
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
                  {displayName(m, "Unknown user")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PropRow>

        <PropRow label="Priority">
          <Select
            value={form.priority}
            onValueChange={(v) => form.setPriority(v as TicketPriority)}
          >
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
          <Select value={form.type} onValueChange={(v) => form.setType(v as TicketType)}>
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
          <Select value={form.selectedSprintId} onValueChange={form.setSelectedSprintId}>
            <SelectTrigger
              className={cn(
                TK_PLAIN_TRIGGER,
                form.selectedSprintId === "none" && "text-[var(--tk-muted)]",
              )}
            >
              <span>{selectedSprintName ?? "No sprint"}</span>
            </SelectTrigger>
            <SelectContent className={TK_CONTENT} alignOffset={-10}>
              <SelectItem value="none" className={TK_ITEM}>
                No sprint (backlog)
              </SelectItem>
              {sprints
                .filter((s) => s.status !== "completed")
                .map((s) => (
                  <SelectItem key={s.id} value={s.id} className={TK_ITEM}>
                    {s.name}
                    {s.status === "active" ? " (current)" : ""}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </PropRow>

        <PropRow label="Points">
          <Input
            type="number"
            min={0}
            value={form.storyPoints}
            onChange={(e) => form.setStoryPoints(e.target.value)}
            placeholder="Add points"
            className="h-8 border-0 bg-transparent p-0 text-[15px] text-[var(--tk-body)] shadow-none placeholder:text-[var(--tk-muted)] focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
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
          <EpicTagInput projectId={projectId} selected={form.epics} onChange={form.setEpics} />
        </PropRow>

        <PropRow label="Due date">
          <Popover open={dueOpen} onOpenChange={setDueOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex items-center gap-2 text-sm",
                  form.dueDate ? "text-[var(--tk-body)]" : "text-[var(--tk-muted)]",
                )}
              >
                <CalendarIcon className="h-3.5 w-3.5 text-[var(--tk-muted)]" />
                {form.dueDate ? format(form.dueDate, "MMM d, yyyy") : "Set date"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start" alignOffset={-10} sideOffset={6}>
              <Calendar
                mode="single"
                selected={form.dueDate}
                onSelect={(d) => {
                  form.setDueDate(d);
                  setDueOpen(false);
                }}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </PropRow>
      </div>

      {/* Save pinned to bottom */}
      <div className="flex shrink-0 justify-end border-t border-[var(--tk-divider)] p-4">
        <Button
          type="button"
          size="sm"
          onClick={() => form.create.mutate()}
          disabled={form.create.isPending}
          className="w-fit rounded-full bg-[var(--tk-accent)] px-4 py-2 text-sm font-semibold text-[var(--tk-on-accent)] hover:bg-[var(--tk-accent-hover)] disabled:opacity-60"
        >
          {form.create.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
          {form.create.isPending ? "Saving…" : "Save Ticket"}
        </Button>
      </div>
    </aside>
  );
}
