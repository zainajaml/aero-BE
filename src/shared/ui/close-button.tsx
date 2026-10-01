import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/shared/lib/utils";

/**
 * Canonical app-wide close (X) button — matches the ticket dialog cross button.
 * 36px square, rounded-lg, outlined with ticket-modal tokens.
 */
export const closeButtonClasses =
  "inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[var(--tk-border)] bg-transparent p-0 text-[var(--tk-body)] transition-colors hover:bg-[var(--tk-surface)] hover:text-[var(--tk-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

export const CloseButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, "aria-label": ariaLabel = "Close", ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    aria-label={ariaLabel}
    className={cn(closeButtonClasses, className)}
    {...props}
  >
    <X className="h-4 w-4" />
  </button>
));
CloseButton.displayName = "CloseButton";
