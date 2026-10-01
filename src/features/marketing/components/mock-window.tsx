import { cn } from "@/shared/lib/utils";
import type { ReactNode } from "react";

interface MockWindowProps {
  title: string;
  children: ReactNode;
  className?: string;
  /** When true, render children flush with no inner padding (for full-bleed screenshots). */
  flush?: boolean;
}

/** A faux app window with macOS-style chrome used to frame feature screenshots. */
export function MockWindow({ title, children, className, flush }: MockWindowProps) {
  return (
    <div className={cn("glass overflow-hidden rounded-2xl", className)}>
      <div className="flex items-center gap-2 border-b border-border/60 bg-muted/40 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-neon-rose/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-neon-amber/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-neon-lime/70" />
        <span className="ml-3 truncate font-mono text-[11px] text-muted-foreground">{title}</span>
      </div>
      <div className={flush ? "" : "p-4"}>{children}</div>
    </div>
  );
}
