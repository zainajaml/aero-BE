/**
 * Query keys owned by the workspace feature. Report reads (work logs, tickets, sprints, columns,
 * people, reportable users) reuse `reportingKeys` from the reporting feature.
 */
export const workspaceKeys = {
  all: ["workspace"] as const,
  mine: (userId: string | undefined) => [...workspaceKeys.all, "mine", userId] as const,
};
