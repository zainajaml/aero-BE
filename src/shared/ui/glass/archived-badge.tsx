import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";

interface ArchivedBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  label?: string;
}

/**
 * A small system-style status badge that marks an archived or inactive
 * assignee. Uses muted semantic tokens so it reads as metadata, not part of
 * the person's name.
 */
export function ArchivedBadge({ label = "Archived", className, ...props }: ArchivedBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md border border-border/60 bg-muted/50 px-1 py-0 text-[9px] font-medium uppercase tracking-wide text-muted-foreground",
        className,
      )}
      {...props}
    >
      {label}
    </span>
  );
}
