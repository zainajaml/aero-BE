import { api, unwrap } from "@/shared/api/client";
import type { components } from "@/shared/api/schema.gen";

export type BoardColumn = components["schemas"]["BoardColumn"];
export type Sprint = components["schemas"]["Sprint"];
export type TicketSummary = components["schemas"]["TicketSummary"];
export type TicketComment = components["schemas"]["Comment"];
export type StageTransition = components["schemas"]["StageTransition"];
export type Person = components["schemas"]["Person"];
export type WorkLogEntry = components["schemas"]["WorkLogEntry"];
export type TicketReportRow = components["schemas"]["TicketReportRow"];
export type SprintReportRow = components["schemas"]["SprintReportRow"];
type RagReport = components["schemas"]["RagReport"];
export type RagRow = RagReport["rows"][number];
export type CommentSummary = components["schemas"]["CommentSummary"];
export type Utilization = components["schemas"]["Utilization"];

/** Comma-joins an id list; `undefined` when empty so the param is omitted. */
const csv = (ids?: readonly string[]) => (ids && ids.length ? ids.join(",") : undefined);

// ---- Project data used by reports (read-only views of other features' endpoints) ----
export const listProjectColumns = (projectId: string) =>
  unwrap(api.GET("/api/v1/projects/{projectId}/columns", { params: { path: { projectId } } }));
export const listProjectSprints = (projectId: string) =>
  unwrap(api.GET("/api/v1/projects/{projectId}/sprints", { params: { path: { projectId } } }));
export const listProjectTickets = (projectId: string) =>
  unwrap(api.GET("/api/v1/projects/{projectId}/tickets", { params: { path: { projectId } } }));
export const listStageHistory = (projectId: string) =>
  unwrap(
    api.GET("/api/v1/projects/{projectId}/stage-history", { params: { path: { projectId } } }),
  );
export const listTicketComments = (ticketId: string) =>
  unwrap(api.GET("/api/v1/tickets/{ticketId}/comments", { params: { path: { ticketId } } }));
export const listPeople = (ids: readonly string[]) =>
  ids.length
    ? unwrap(api.GET("/api/v1/people", { params: { query: { ids: ids.join(",") } } }))
    : Promise.resolve([] as Person[]);

// ---- Reports ----
export type WorkLogQuery = {
  projectIds?: readonly string[];
  sprintIds?: readonly string[];
  ticketIds?: readonly string[];
  userIds?: readonly string[];
  /** ISO instants (inclusive range on loggedAt). */
  from?: string;
  to?: string;
};
export const listReportWorkLogs = (q: WorkLogQuery) =>
  unwrap(
    api.GET("/api/v1/reports/work-logs", {
      params: {
        query: {
          projectIds: csv(q.projectIds),
          sprintIds: csv(q.sprintIds),
          ticketIds: csv(q.ticketIds),
          userIds: csv(q.userIds),
          from: q.from,
          to: q.to,
        },
      },
    }),
  );

export type TicketReportQuery = {
  projectIds?: readonly string[];
  sprintIds?: readonly string[];
  assigneeIds?: readonly string[];
  ids?: readonly string[];
};
export const listReportTickets = (q: TicketReportQuery) =>
  unwrap(
    api.GET("/api/v1/reports/tickets", {
      params: {
        query: {
          projectIds: csv(q.projectIds),
          sprintIds: csv(q.sprintIds),
          assigneeIds: csv(q.assigneeIds),
          ids: csv(q.ids),
        },
      },
    }),
  );

export const listReportSprints = (q: {
  projectIds?: readonly string[];
  statuses?: readonly string[];
}) =>
  unwrap(
    api.GET("/api/v1/reports/sprints", {
      params: { query: { projectIds: csv(q.projectIds), statuses: csv(q.statuses) } },
    }),
  );

export const listReportableUsers = (projectIds?: readonly string[]) =>
  unwrap(
    api.GET("/api/v1/reports/reportable-users", {
      params: { query: { projectIds: csv(projectIds) } },
    }),
  );

export const getRagReport = (projectId: string) =>
  unwrap(api.GET("/api/v1/projects/{projectId}/rag-report", { params: { path: { projectId } } }));

export const summarizeTicketComments = (ticketId: string) =>
  unwrap(
    api.POST("/api/v1/tickets/{ticketId}/comment-summary", { params: { path: { ticketId } } }),
  );

export const getUtilization = (projectId: string, from: string, to: string) =>
  unwrap(
    api.GET("/api/v1/projects/{projectId}/utilization", {
      params: { path: { projectId }, query: { from, to } },
    }),
  );
