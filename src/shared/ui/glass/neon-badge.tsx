import { cn } from "@/shared/lib/utils";
import type { HTMLAttributes } from "react";

const TONE = {
  cyan: "text-neon-cyan border-neon-cyan/40 bg-neon-cyan/10",
  magenta: "text-neon-magenta border-neon-magenta/40 bg-neon-magenta/10",
  lime: "text-neon-lime border-neon-lime/40 bg-neon-lime/10",
  amber: "text-neon-amber border-neon-amber/40 bg-neon-amber/10",
  rose: "text-neon-rose border-neon-rose/40 bg-neon-rose/10",
  violet: "text-neon-violet border-neon-violet/40 bg-neon-violet/10",
  muted: "text-muted-foreground border-border bg-muted/40",
} as const;

interface NeonBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: keyof typeof TONE;
}

export function NeonBadge({ tone = "cyan", className, ...props }: NeonBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide",
        TONE[tone],
        className,
      )}
      {...props}
    />
  );
}
