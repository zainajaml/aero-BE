import { useRef, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/shared/ui/select";
import { cn } from "@/shared/lib/utils";
import { TK_CONTENT, TK_ITEM, TK_PLAIN_TRIGGER } from "./dialog-ui";
import { TIME_SLOTS, minutesToClock, parseClockToMinutes } from "./time-utils";

/**
 * Dropdown time picker with 15-minute increments, plus free-form manual entry.
 * `after` (an "4:00 pm" clock string) restricts the options/manual entry to
 * times strictly later than it — used so End Time depends on Start Time.
 */
export function TimeSelect({
  value,
  onChange,
  placeholder,
  after,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  after?: string;
}) {
  const afterMins = after ? parseClockToMinutes(after) : null;
  const slots =
    afterMins == null
      ? TIME_SLOTS
      : TIME_SLOTS.filter((t) => {
          const m = parseClockToMinutes(t);
          return m != null && m > afterMins;
        });
  // Keep a custom (non-slot) stored value selectable so existing logs still show.
  const options = value && !slots.includes(value) ? [value, ...slots] : slots;
  const [draft, setDraft] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);

  const commit = () => {
    if (draft === null) return;
    const raw = draft.trim();
    if (!raw) {
      setInvalid(false);
      setDraft(null);
      onChange("");
      return;
    }
    const mins = parseClockToMinutes(raw);
    if (mins == null || (afterMins != null && mins <= afterMins)) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    setDraft(null);
    onChange(minutesToClock(mins));
  };

  // The Select trigger is only the little chevron on the right, but the popup
  // must line up with the LEFT edge of the whole field. Measure the delta on
  // open and feed it to Radix as a negative alignOffset.
  const rowRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [alignOffset, setAlignOffset] = useState(0);

  const syncAlign = () => {
    const row = rowRef.current?.parentElement?.closest("div.relative") ?? rowRef.current;
    const trigger = triggerRef.current;
    if (!row || !trigger) return;
    const rowRect = row.getBoundingClientRect();
    const trigRect = trigger.getBoundingClientRect();
    setAlignOffset(Math.round(rowRect.left - trigRect.left));
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div ref={rowRef} className="flex min-w-0 flex-1 items-center gap-1">
        <input
          type="text"
          value={draft ?? value}
          placeholder={placeholder}
          onChange={(e) => {
            const next = e.target.value;
            // Hard cap: never accept more than 4 numeric digits (hhmm)
            if ((next.match(/\d/g) || []).length > 4) return;
            setDraft(next);
            if (invalid) setInvalid(false);
          }}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape") {
              setDraft(null);
              setInvalid(false);
            }
          }}
          className="w-0 min-w-0 flex-1 whitespace-nowrap border-0 bg-transparent p-0 font-mono text-[15px] font-normal text-[var(--tk-body)] outline-none placeholder:text-[var(--tk-muted)] focus:outline-none focus:ring-0"
        />
        <Select
          value={value || undefined}
          onOpenChange={(open) => {
            if (open) syncAlign();
          }}
          onValueChange={(v) => {
            setDraft(null);
            setInvalid(false);
            onChange(v);
          }}
        >
          <SelectTrigger
            ref={triggerRef}
            aria-label="Choose time"
            className={cn(TK_PLAIN_TRIGGER, "ml-auto shrink-0 font-mono [&>span]:hidden")}
          />

          {/* Hide Radix's hover auto-scroll chevrons; plain wheel/drag scrolling only. */}
          <SelectContent
            align="start"
            alignOffset={alignOffset}
            className={cn(
              TK_CONTENT,
              "max-h-[260px]",
              "[&>div:not([data-radix-select-viewport])]:hidden",
              "[&_[data-radix-select-viewport]]:overflow-y-auto",
            )}
          >
            {options.map((t) => (
              <SelectItem key={t} value={t} className={cn(TK_ITEM, "font-mono")}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {invalid && (
        <span className="text-[11px] leading-tight text-[var(--tk-danger,#e05a4a)]">
          Invalid time
        </span>
      )}
    </div>
  );
}
