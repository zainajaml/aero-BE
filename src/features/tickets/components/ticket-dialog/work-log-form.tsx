import { useEffect, type ReactNode } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { DocTagTextarea } from "@/features/rich-text/components/doc-tag-textarea";
import { Calendar } from "@/shared/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { cn } from "@/shared/lib/utils";
import type { LogFields } from "../../hooks/ticket-dialog/use-ticket-work-logs";
import {
  FloatField,
  TK_CONTENT,
  TK_ITEM,
  TK_PLAIN_TRIGGER,
  resizeTextareaToMaxLines,
} from "./dialog-ui";
import { TimeSelect } from "./time-select";
import { isEndAfterStart } from "./time-utils";

/**
 * Note + "Logging for" + date + start/stop fields of a work log (add form and inline edit).
 * `keepTimeOf` picks which time of day a newly picked calendar date keeps: the current time
 * (new log) or the previously chosen date's time (edit).
 */
export function WorkLogForm({
  fields: f,
  projectId,
  people,
  personLocked,
  keepTimeOf,
  actions,
}: {
  fields: LogFields;
  projectId: string;
  people: { userId: string; name: string }[];
  personLocked: boolean;
  keepTimeOf: "now" | "previous";
  actions: ReactNode;
}) {
  // Auto-grow the "What did you work on?" textarea up to 5 lines.
  const { noteRef, note } = f;
  useEffect(() => {
    if (noteRef.current) resizeTextareaToMaxLines(noteRef.current);
  }, [note, noteRef]);

  const pickDate = (d: Date | undefined) => {
    if (d) {
      f.setDate((prev) => {
        const source = keepTimeOf === "now" ? new Date() : prev;
        const merged = new Date(d);
        merged.setHours(
          source.getHours(),
          source.getMinutes(),
          source.getSeconds(),
          source.getMilliseconds(),
        );
        return merged;
      });
    }
    f.setDateOpen(false);
  };

  return (
    <>
      {/* Row 1 — what did you work on */}
      <div className="relative flex min-h-9 flex-col rounded-xl border border-[var(--tk-border)] bg-[var(--tk-surface)] px-3 pb-2 pt-7">
        <label className="field-label pointer-events-none absolute left-3 top-1.5">
          What did you work on?
        </label>
        <DocTagTextarea
          textareaRef={f.noteRef}
          projectId={projectId}
          value={f.note}
          onChange={f.setNote}
          onInput={(el) => resizeTextareaToMaxLines(el)}
          placeholder="Type # to tag a document"
          className="w-full resize-none bg-transparent py-0 text-sm leading-snug text-[var(--tk-body)] outline-none placeholder:text-[13px] placeholder:font-normal placeholder:text-[var(--tk-muted)]"
        />
      </div>

      {/* Row 2 — logging for, date, time start, time stop, actions */}
      <div className="mt-2 flex flex-wrap items-end gap-3">
        <FloatField label="Logging for" className="w-[170px] overflow-hidden">
          <Select
            value={f.resource}
            onValueChange={f.setResource}
            disabled={personLocked || people.length === 0}
          >
            <SelectTrigger
              className={cn(
                TK_PLAIN_TRIGGER,
                "w-full justify-between truncate text-[var(--tk-body)]",
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={TK_CONTENT} alignOffset={-10}>
              {people.map((p) => (
                <SelectItem key={p.userId} value={p.name} className={TK_ITEM}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FloatField>
        <FloatField label="Date" className="w-[150px] overflow-hidden">
          <Popover open={f.dateOpen} onOpenChange={f.setDateOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-2 text-sm text-[var(--tk-text)]"
              >
                <CalendarIcon className="h-4 w-4 shrink-0 text-[var(--tk-muted)]" />
                <span>{format(f.date, "MMM d, yyyy")}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start" alignOffset={-10} sideOffset={6}>
              <Calendar
                mode="single"
                selected={f.date}
                onSelect={pickDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </FloatField>
        <FloatField label="Time start" className="w-[152px]">
          <Clock className="h-4 w-4 shrink-0 text-[var(--tk-muted)]" />
          <TimeSelect
            value={f.start}
            onChange={(v) => {
              f.setStart(v);
              if (!isEndAfterStart(v, f.stop)) f.setStop("");
            }}
            placeholder="hh:mm"
          />
        </FloatField>
        <FloatField label="Time stop" className="w-[152px]">
          <Clock className="h-4 w-4 shrink-0 text-[var(--tk-muted)]" />
          <TimeSelect value={f.stop} onChange={f.setStop} placeholder="hh:mm" after={f.start} />
        </FloatField>

        {actions}
      </div>
    </>
  );
}
