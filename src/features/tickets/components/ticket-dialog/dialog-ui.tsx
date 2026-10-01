import type { ReactNode } from "react";
import { Paperclip, X } from "lucide-react";
import { cn } from "@/shared/lib/utils";

// Shared select styling for the dark ticket modals so dropdowns match the surface.
export const TK_CONTENT_BASE =
  "border-[var(--tk-border)] bg-[var(--tk-surface)] text-[var(--tk-text)]";
export const TK_CONTENT = `${TK_CONTENT_BASE} rounded-lg`;
export const TK_ITEM =
  "text-[var(--tk-body)] focus:bg-[var(--tk-divider)] focus:text-[var(--tk-text)] data-[state=checked]:text-[var(--tk-text)]";
// A borderless "plain text" select trigger that reads as a value, not an input.
export const TK_PLAIN_TRIGGER =
  "h-auto w-auto justify-start gap-1 border-0 bg-transparent p-0 text-[15px] font-normal text-[var(--tk-body)] shadow-none focus:ring-0 focus:ring-offset-0 [&>svg]:size-3.5 [&>svg]:opacity-40 hover:text-[var(--tk-text)]";

export const PRIORITY_COLOR: Record<string, string> = {
  low: "#6e6a60",
  medium: "#c9b24a",
  high: "#e8934a",
  urgent: "#e05a4a",
};

export const PRIORITIES = ["low", "medium", "high", "urgent"];
export const TICKET_TYPES = ["task", "bug", "story", "epic"];

/** Labelled field: label sits above the input container. */
export function FloatField({
  label,
  children,
  className,
  centered,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  centered?: boolean;
}) {
  return (
    <div className="inline-flex min-w-0 flex-col gap-1">
      <label className={cn("field-label text-left", centered && "text-center")}>{label}</label>
      <div
        className={cn(
          "relative flex h-9 w-full items-center rounded-lg border border-[var(--tk-border)] bg-[var(--tk-surface)] px-2.5",
          className,
        )}
      >
        <div
          className={cn(
            "field-value flex w-full min-w-0 items-center gap-2",
            centered && "justify-center",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/** Label / value row for the sidebar properties grid. */
export function PropRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-[7px]">
      <div className="field-label w-[92px] shrink-0 pt-1">{label}</div>
      <div className="field-value flex min-w-0 flex-1 items-center">{children}</div>
    </div>
  );
}

/** Files staged for upload (comment / reply / edit composers, create dialog). */
export function PendingFileList({
  files,
  onRemove,
  className = "mt-2 space-y-1",
}: {
  files: File[];
  onRemove: (index: number) => void;
  className?: string;
}) {
  if (files.length === 0) return null;
  return (
    <ul className={className}>
      {files.map((f, i) => (
        <li
          key={`${f.name}-${i}`}
          className="flex items-center gap-2 rounded-md border border-[var(--tk-border)] bg-[var(--tk-bg)] px-2 py-1.5 text-xs text-[var(--tk-body)]"
        >
          <Paperclip className="h-3.5 w-3.5 shrink-0 text-[var(--tk-muted)]" />
          <span className="flex-1 truncate">{f.name}</span>
          <button
            type="button"
            className="shrink-0 text-[var(--tk-muted)] hover:text-destructive"
            onClick={() => onRemove(i)}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </li>
      ))}
    </ul>
  );
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function truncateChars(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

/** Auto-grow a textarea between a minimum and maximum number of lines, then scroll. */
export function resizeTextareaToMaxLines(el: HTMLTextAreaElement, maxLines = 5, minLines = 2) {
  if (!el) return;
  const computed = window.getComputedStyle(el);
  const lineHeight = parseFloat(computed.lineHeight);
  const fontSize = parseFloat(computed.fontSize);
  const lh = Number.isFinite(lineHeight) ? lineHeight : fontSize * 1.2;
  const minHeight = lh * minLines;
  const maxHeight = lh * maxLines;
  el.style.height = "0px";
  const targetHeight = Math.max(el.scrollHeight, minHeight);
  el.style.height = `${Math.min(targetHeight, maxHeight)}px`;
  el.style.overflowY = targetHeight > maxHeight ? "auto" : "hidden";
}
