import type { BacklogSprint } from "./backlog-types";

/** Unstarted sprints in display order — the only group that can be drag-reordered. */
export function reorderableSprints(sprints: BacklogSprint[]) {
  return sprints
    .filter((s) => s.status !== "active" && s.status !== "completed")
    .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
}

/**
 * Projects where the dragged sprint lands within the reorderable list.
 * overId may be a sprint id, or the sentinels "__top__" / "__bottom__".
 */
export function projectSprintMove(
  reorderable: BacklogSprint[],
  activeId: string,
  overId: string,
): BacklogSprint[] {
  const active = reorderable.find((s) => s.id === activeId);
  if (!active) return reorderable;
  const without = reorderable.filter((s) => s.id !== activeId);
  let insertIndex: number;
  if (overId === "__top__") insertIndex = 0;
  else if (overId === "__bottom__") insertIndex = without.length;
  else {
    const i = without.findIndex((s) => s.id === overId);
    insertIndex = i === -1 ? without.length : i;
  }
  const result = [...without];
  result.splice(insertIndex, 0, active);
  return result;
}

export function getSprintShiftById(
  snapshot: BacklogSprint[],
  projected: BacklogSprint[],
  activeId: string,
) {
  const originalIndex = new Map(snapshot.map((s, i) => [s.id, i]));
  const shiftById = new Map<string, number>();
  projected.forEach((s, index) => {
    if (s.id === activeId) return;
    const startIndex = originalIndex.get(s.id);
    if (startIndex === undefined) return;
    const shift = index - startIndex;
    if (shift !== 0) shiftById.set(s.id, shift);
  });
  return shiftById;
}

export interface SprintDrop {
  afterSprintId: string | null;
  beforeSprintId: string | null;
  /** Cache-only position for the optimistic update (the server recomputes it). */
  optimisticPosition: number;
}

/** Neighbour ids of the dropped sprint, or null when its place did not change. */
export function deriveSprintDrop(
  snapshot: BacklogSprint[],
  projected: BacklogSprint[],
  activeId: string,
): SprintDrop | null {
  const index = projected.findIndex((s) => s.id === activeId);
  const originalIndex = snapshot.findIndex((s) => s.id === activeId);
  if (index === -1 || index === originalIndex) return null;
  const prev = index > 0 ? projected[index - 1] : null;
  const next = index < projected.length - 1 ? projected[index + 1] : null;
  let optimisticPosition = 0;
  if (prev && next) optimisticPosition = (prev.position + next.position) / 2;
  else if (prev) optimisticPosition = prev.position + 1;
  else if (next) optimisticPosition = next.position - 1;
  return {
    afterSprintId: prev?.id ?? null,
    beforeSprintId: next?.id ?? null,
    optimisticPosition,
  };
}
