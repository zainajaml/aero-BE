import type { BacklogColumn } from "./backlog-types";

const DONE_NAMES = new Set(["done", "complete", "completed"]);

/** A stage counts as done when flagged so or named done/complete/completed (same rule as the server). */
export function isDoneStage(col: Pick<BacklogColumn, "name" | "isDone"> | undefined): boolean {
  const key = (col?.name ?? "").trim().toLowerCase();
  return !!col?.isDone || DONE_NAMES.has(key);
}

/** The column tickets without a stage are shown in: "Backlog", else the first column. */
export function findBacklogColumn(columns: BacklogColumn[]): BacklogColumn | undefined {
  return columns.find((c) => c.name.toLowerCase() === "backlog") ?? columns[0];
}
