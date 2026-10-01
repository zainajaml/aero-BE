import { formatHM } from "@/shared/lib/format";

type BarShapeProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  payload?: Record<string, unknown>;
};

/**
 * Custom bar shape for stacked charts: rounds the top corners only on the topmost non-zero
 * segment of each column, so every bar gets a rounded cap regardless of which series is on top.
 */
export function makeStackedBarShape(keys: string[], dataKey: string) {
  return function StackedBarShape(props: unknown) {
    const { x = 0, y = 0, width = 0, height = 0, fill, payload } = props as BarShapeProps;
    if (!height || height <= 0) return <g />;
    const idx = keys.indexOf(dataKey);
    const isTop = !keys.slice(idx + 1).some((k) => Number(payload?.[k]) > 0);
    const r = isTop ? Math.min(4, width / 2, height) : 0;
    const path = `M${x},${y + height} L${x},${y + r} Q${x},${y} ${x + r},${y} L${
      x + width - r
    },${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + height} Z`;
    // Use `style` (not the `fill` attribute) so CSS variables like
    // var(--neon-cyan) resolve — var() does not work in SVG presentation attributes.
    return <path d={path} style={{ fill }} />;
  };
}

type TooltipItem = { dataKey?: string | number; value?: unknown; color?: string; name?: string };

export function CompactTooltip({
  active,
  payload,
  label,
  suffix = "h",
}: {
  active?: boolean;
  payload?: TooltipItem[];
  label?: string | number;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  const items = payload.filter((p) => Number(p.value) !== 0);
  return (
    <div className="rounded-lg bg-popover px-2.5 py-1.5 text-[10px] leading-tight text-popover-foreground border border-border shadow-md">
      <div className="mb-0.5 font-semibold">{label}</div>
      <div className="flex flex-col gap-px">
        {items.map((p) => (
          <div
            key={String(p.dataKey)}
            className="flex items-center justify-between gap-2 whitespace-nowrap"
          >
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
              {p.name}
            </span>
            <span className="font-medium">
              {suffix === "h"
                ? formatHM(Math.round(Number(p.value) * 60))
                : `${String(p.value)}${suffix}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
