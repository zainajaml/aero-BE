import { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export const MAX_HOURS = 999;

/** Normalize an hours/minutes pair, carrying minutes >= 60 into hours. */
export function normalizeHM(hours: number, minutes: number) {
  let h = Math.max(0, Math.floor(hours || 0));
  let m = Math.max(0, Math.floor(minutes || 0));
  h += Math.floor(m / 60);
  m = m % 60;
  let capped = false;
  if (h > MAX_HOURS) {
    h = MAX_HOURS;
    m = 59;
    capped = true;
  }
  return { hours: h, minutes: m, capped };
}

/**
 * Compact numeric stepper input: direct typing, ▲/▼ controls, arrow keys and
 * mouse wheel (while focused). Never allows negative values.
 */
export function StepperNumInput({
  value,
  onChange,
  max,
  step = 1,
  className,
  ariaLabel,
  disabled,
}: {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  step?: number;
  className?: string;
  ariaLabel?: string;
  disabled?: boolean;
}) {
  const [display, setDisplay] = useState<string | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  const clamp = (n: number) => {
    const safe = Number.isFinite(n) ? Math.floor(n) : 0;
    const lower = Math.max(0, safe);
    return max !== undefined ? Math.min(max, lower) : lower;
  };

  const bump = (delta: number) => {
    if (disabled) return;
    onChange(clamp(value + delta));
    setDisplay(undefined);
  };

  // Mouse wheel only while focused (and without hijacking page scroll otherwise).
  useEffect(() => {
    const el = inputRef.current;
    if (!el || !focused) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      bump(e.deltaY < 0 ? step : -step);
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^\d]/g, "");
    // Prevent typing past the max value's digit length so manual entry can't
    // exceed the cap (e.g. 999 hours -> at most 3 digits).
    const maxDigits = max !== undefined ? String(max).length : undefined;
    if (maxDigits !== undefined && raw.length > maxDigits) {
      raw = raw.slice(0, maxDigits);
    }
    setDisplay(raw);
    onChange(clamp(raw === "" ? 0 : parseInt(raw, 10)));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      bump(step);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      bump(-step);
    }
  };

  const displayValue = display !== undefined ? display : String(value);

  return (
    <div className={cn("flex w-full items-center justify-between gap-0.5", className)}>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        aria-label={ariaLabel}
        disabled={disabled}
        value={displayValue}
        onFocus={() => {
          setFocused(true);
          if (value === 0) setDisplay("");
        }}
        onBlur={() => {
          setFocused(false);
          setDisplay(undefined);
        }}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="h-6 min-w-0 flex-1 bg-transparent px-0 text-left text-[15px] tabular-nums text-[var(--tk-text,inherit)] outline-none disabled:opacity-50"
      />
      <span className="flex shrink-0 flex-col justify-center">
        <button
          type="button"
          tabIndex={-1}
          aria-label="Increase"
          disabled={disabled || (max !== undefined && value >= max)}
          onClick={() => bump(step)}
          className="flex h-[11px] w-4 items-center justify-center rounded-[3px] text-muted-foreground/60 transition-colors hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground/60"
        >
          <ChevronUp className="h-3 w-3" />
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-label="Decrease"
          disabled={disabled || value <= 0}
          onClick={() => bump(-step)}
          className="flex h-[11px] w-4 items-center justify-center rounded-[3px] text-muted-foreground/60 transition-colors hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground/60"
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      </span>
    </div>
  );
}
