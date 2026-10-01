import { api, unwrap } from "@/shared/api/client";
import type { components } from "@/shared/api/schema.gen";

type Schemas = components["schemas"];

export type TicketSummary = Schemas["TicketSummary"];
export type Ticket = Schemas["Ticket"];
export type CreateTicketRequest = Schemas["CreateTicketRequest"];
export type UpdateTicketRequest = Schemas["UpdateTicketRequest"];
export type MoveTicketRequest = Schemas["MoveTicketRequest"];
export type BulkUpdateTicketsRequest = Schemas["BulkUpdateTicketsRequest"];
export type BulkDeleteTicketsResult = Schemas["BulkDeleteTicketsResult"];
export type Estimate = Schemas["Estimate"];
export type AddEstimateRequest = Schemas["AddEstimateRequest"];
export type UpdateEstimateRequest = Schemas["UpdateEstimateRequest"];
export type WorkLog = Schemas["WorkLog"];
export type AddWorkLogRequest = Schemas["AddWorkLogRequest"];
export type UpdateWorkLogRequest = Schemas["UpdateWorkLogRequest"];
export type TicketComment = Schemas["Comment"];
export type AddCommentRequest = Schemas["AddCommentRequest"];
export type Attachment = Schemas["Attachment"];
export type ProjectEstimate = Schemas["ProjectEstimate"];
export type StageTransition = Schemas["StageTransition"];

const ticketPath = (ticketId: string) => ({ params: { path: { ticketId } } });
const projectPath = (projectId: string) => ({ params: { path: { projectId } } });

// ---------------------------------------------------------------- tickets

export const listProjectTickets = (projectId: string) =>
  unwrap(api.GET("/api/v1/projects/{projectId}/tickets", projectPath(projectId)));

export const getTicket = (ticketId: string) =>
  unwrap(api.GET("/api/v1/tickets/{ticketId}", ticketPath(ticketId)));

/** One call: code, position, stage history, epics and estimates are handled by the server. */
export const createTicket = (projectId: string, body: CreateTicketRequest) =>
  unwrap(api.POST("/api/v1/projects/{projectId}/tickets", { ...projectPath(projectId), body }));

export const updateTicket = (ticketId: string, body: UpdateTicketRequest) =>
  unwrap(api.PATCH("/api/v1/tickets/{ticketId}", { ...ticketPath(ticketId), body }));

/** Move between sprints/columns and/or reorder relative to neighbour tickets. */
export const moveTicket = (ticketId: string, body: MoveTicketRequest) =>
  unwrap(api.POST("/api/v1/tickets/{ticketId}/move", { ...ticketPath(ticketId), body }));

/** Replace the ticket's full epic set. */
export const setTicketEpics = (ticketId: string, epicIds: string[]) =>
  unwrap(api.PUT("/api/v1/tickets/{ticketId}/epics", { ...ticketPath(ticketId), body: { epicIds } }));

export async function deleteTicket(ticketId: string): Promise<void> {
  await api.DELETE("/api/v1/tickets/{ticketId}", ticketPath(ticketId));
}

export const bulkMoveTickets = (projectId: string, ticketIds: string[], sprintId: string | null) =>
  unwrap(
    api.POST("/api/v1/projects/{projectId}/tickets/bulk-move", {
      ...projectPath(projectId),
      body: { ticketIds, sprintId },
    }),
  );

export const bulkUpdateTickets = (projectId: string, body: BulkUpdateTicketsRequest) =>
  unwrap(
    api.POST("/api/v1/projects/{projectId}/tickets/bulk-update", { ...projectPath(projectId), body }),
  );

export const bulkDeleteTickets = (projectId: string, ticketIds: string[]) =>
  unwrap(
    api.POST("/api/v1/projects/{projectId}/tickets/bulk-delete", {
      ...projectPath(projectId),
      body: { ticketIds },
    }),
  );

export const listProjectEstimates = (projectId: string) =>
  unwrap(api.GET("/api/v1/projects/{projectId}/ticket-estimates", projectPath(projectId)));

export const listStageHistory = (projectId: string) =>
  unwrap(api.GET("/api/v1/projects/{projectId}/stage-history", projectPath(projectId)));

// ---------------------------------------------------------------- estimates

export const listEstimates = (ticketId: string) =>
  unwrap(api.GET("/api/v1/tickets/{ticketId}/estimates", ticketPath(ticketId)));
export const addEstimate = (ticketId: string, body: AddEstimateRequest) =>
  unwrap(api.POST("/api/v1/tickets/{ticketId}/estimates", { ...ticketPath(ticketId), body }));
export const updateEstimate = (ticketId: string, estimateId: string, body: UpdateEstimateRequest) =>
  unwrap(
    api.PATCH("/api/v1/tickets/{ticketId}/estimates/{estimateId}", {
      params: { path: { ticketId, estimateId } },
      body,
    }),
  );
export async function deleteEstimate(ticketId: string, estimateId: string): Promise<void> {
  await api.DELETE("/api/v1/tickets/{ticketId}/estimates/{estimateId}", {
    params: { path: { ticketId, estimateId } },
  });
}

// ---------------------------------------------------------------- work logs

export const listWorkLogs = (ticketId: string) =>
  unwrap(api.GET("/api/v1/tickets/{ticketId}/work-logs", ticketPath(ticketId)));
export const addWorkLog = (ticketId: string, body: AddWorkLogRequest) =>
  unwrap(api.POST("/api/v1/tickets/{ticketId}/work-logs", { ...ticketPath(ticketId), body }));
export const updateWorkLog = (ticketId: string, workLogId: string, body: UpdateWorkLogRequest) =>
  unwrap(
    api.PATCH("/api/v1/tickets/{ticketId}/work-logs/{workLogId}", {
      params: { path: { ticketId, workLogId } },
      body,
    }),
  );
export async function deleteWorkLog(ticketId: string, workLogId: string): Promise<void> {
  await api.DELETE("/api/v1/tickets/{ticketId}/work-logs/{workLogId}", {
    params: { path: { ticketId, workLogId } },
  });
}

// ---------------------------------------------------------------- comments

export const listComments = (ticketId: string) =>
  unwrap(api.GET("/api/v1/tickets/{ticketId}/comments", ticketPath(ticketId)));
/** `body` is the serialized TipTap JSON; the server sends mention/reply emails. */
export const addComment = (ticketId: string, body: AddCommentRequest) =>
  unwrap(api.POST("/api/v1/tickets/{ticketId}/comments", { ...ticketPath(ticketId), body }));
export const editComment = (ticketId: string, commentId: string, body: string) =>
  unwrap(
    api.PATCH("/api/v1/tickets/{ticketId}/comments/{commentId}", {
      params: { path: { ticketId, commentId } },
      body: { body },
    }),
  );
export async function deleteComment(ticketId: string, commentId: string): Promise<void> {
  await api.DELETE("/api/v1/tickets/{ticketId}/comments/{commentId}", {
    params: { path: { ticketId, commentId } },
  });
}

// ---------------------------------------------------------------- attachments

export const listAttachments = (ticketId: string) =>
  unwrap(api.GET("/api/v1/tickets/{ticketId}/attachments", ticketPath(ticketId)));

/** Multipart upload (field `file`); pass `commentId` to attach the file to a comment. */
export function uploadAttachment(ticketId: string, file: File, commentId?: string | null) {
  const form = new FormData();
  form.append("file", file, file.name);
  return unwrap(
    api.POST("/api/v1/tickets/{ticketId}/attachments", {
      params: { path: { ticketId }, query: commentId ? { commentId } : {} },
      body: form as never,
      bodySerializer: (body) => body as unknown as FormData,
    }),
  );
}

export const getAttachmentUrl = (ticketId: string, attachmentId: string) =>
  unwrap(
    api.GET("/api/v1/tickets/{ticketId}/attachments/{attachmentId}/url", {
      params: { path: { ticketId, attachmentId } },
    }),
  );

export async function deleteAttachment(ticketId: string, attachmentId: string): Promise<void> {
  await api.DELETE("/api/v1/tickets/{ticketId}/attachments/{attachmentId}", {
    params: { path: { ticketId, attachmentId } },
  });
}
