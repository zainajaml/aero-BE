import type { ReactNode } from "react";

/**
 * Placeholder panel for sections that are planned but not built yet.
 * Keeps the navigation shape stable so the feature can slot in later.
 */
export function ComingSoon({
  icon,
  title,
  description,
  bullets,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  bullets?: string[];
}) {
  return (
    <div className="max-w-2xl px-3 py-6">
      <div className="rounded-2xl border border-border/50 bg-card/30 p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-foreground">
            {icon}
          </span>
          <div>
            <h2 className="text-sm font-semibold">{title}</h2>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Coming soon
            </span>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{description}</p>
        {!!bullets?.length && (
          <ul className="mt-4 space-y-1.5">
            {bullets.map((b) => (
              <li key={b} className="flex gap-2 text-xs text-muted-foreground">
                <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
