import { cn } from "@/shared/lib/utils";

const COMPLEXITY: Record<string, { bars: number; color: string; label: string }> = {
  low: { bars: 1, color: "bg-neon-rose", label: "Low complexity" },
  medium: { bars: 2, color: "bg-neon-rose", label: "Medium complexity" },
  high: { bars: 3, color: "bg-neon-rose", label: "High complexity" },
  urgent: { bars: 4, color: "bg-neon-rose", label: "Urgent complexity" },
};

export function ComplexityBars({ priority }: { priority: string }) {
  const cfg = COMPLEXITY[priority] ?? COMPLEXITY.low;
  return (
    <span className="flex shrink-0 items-end gap-0.5" title={cfg.label} aria-label={cfg.label}>
      {[1, 2, 3, 4].map((n) => (
        <span
          key={n}
          className={cn(
            "w-1 rounded-[1px]",
            n === 1 ? "h-1.5" : n === 2 ? "h-2.5" : n === 3 ? "h-3" : "h-3.5",
            n <= cfg.bars ? cfg.color : "bg-muted-foreground/25",
          )}
        />
      ))}
    </span>
  );
}
