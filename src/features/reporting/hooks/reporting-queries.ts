const ids = (list?: readonly string[]) => (list ?? []).join(",");

/** Query keys for every report read. Reports are read-only; nothing here is mutated client-side. */
export const reportingKeys = {
  all: ["reporting"] as const,
  columns: (projectId: string | undefined) => [...reportingKeys.all, "columns", projectId] as const,
  sprints: (projectId: string | undefined) => [...reportingKeys.all, "sprints", projectId] as const,
  tickets: (projectId: string | undefined) => [...reportingKeys.all, "tickets", projectId] as const,
  stageHistory: (projectId: string | undefined) =>
    [...reportingKeys.all, "stage-history", projectId] as const,
  comments: (ticketId: string) => [...reportingKeys.all, "comments", ticketId] as const,
  people: (userIds: readonly string[]) => [...reportingKeys.all, "people", ids(userIds)] as const,
  workLogs: (q: Record<string, readonly string[] | string | undefined>) =>
    [...reportingKeys.all, "work-logs", q] as const,
  reportTickets: (q: Record<string, readonly string[] | undefined>) =>
    [...reportingKeys.all, "report-tickets", q] as const,
  reportSprints: (q: Record<string, readonly string[] | undefined>) =>
    [...reportingKeys.all, "report-sprints", q] as const,
  reportableUsers: (projectIds: readonly string[] | undefined) =>
    [...reportingKeys.all, "reportable-users", ids(projectIds)] as const,
  rag: (projectId: string | undefined) => [...reportingKeys.all, "rag", projectId] as const,
  /** Includes the comment count so a new comment triggers a fresh summary. */
  commentSummary: (ticketId: string, commentCount: number) =>
    [...reportingKeys.all, "comment-summary", ticketId, commentCount] as const,
  utilization: (projectId: string | undefined, from: string, to: string) =>
    [...reportingKeys.all, "utilization", projectId, from, to] as const,
};
