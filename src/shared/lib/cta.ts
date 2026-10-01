/**
 * Canonical primary-action button style, matching the "Save Ticket" button.
 * Small accent pill, right-aligned in dialog/panel footers.
 * Use this for every primary CTA so the app stays visually consistent.
 */
export const CTA_BUTTON =
  "w-fit rounded-full bg-[var(--tk-accent)] px-4 py-2 text-sm font-semibold text-[var(--tk-on-accent)] hover:bg-[var(--tk-accent-hover)]";

/**
 * Canonical secondary/outline pill used for toolbar actions (Export Tickets, Epics, Sprint, etc.).
 * Beige/cream background, dark text, gold fill on hover.
 */
export const PILL_BUTTON =
  "h-8 gap-1.5 pl-2.5 pr-3 text-xs font-normal border-border bg-transparent text-foreground shadow-sm transition-colors hover:bg-primary hover:text-primary-foreground hover:border-primary";
