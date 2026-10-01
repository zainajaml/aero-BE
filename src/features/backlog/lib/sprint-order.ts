import type { BacklogSprint } from "./backlog-types";
import { reorderableSprints } from "./sprint-drag";

/**
 * Display order of the sprint panels: active sprints first, then unstarted ones (drag-ordered).
 * Completed sprints are hidden by default; the toggle shows ONLY completed sprints, most recent first.
 */
export function displaySprints(sprints: BacklogSprint[], showCompleted: boolean) {
  if (showCompleted) {
    return sprints
      .filter((s) => s.status === "completed")
      .sort((a, b) => {
        const ta = a.endsAt ? new Date(a.endsAt).getTime() : 0;
        const tb = b.endsAt ? new Date(b.endsAt).getTime() : 0;
        return tb - ta;
      });
  }
  const active = sprints
    .filter((s) => s.status === "active")
    .sort(
      (a, b) =>
        a.position - b.position ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  return [...active, ...reorderableSprints(sprints)];
}
