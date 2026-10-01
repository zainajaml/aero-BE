import { api, unwrap } from "@/shared/api/client";
import type { components } from "@/shared/api/schema.gen";

export type SupportIssue = components["schemas"]["SupportIssue"];
export type SupportIssueStatus = SupportIssue["status"];
export type SupportIssueDetail = components["schemas"]["SupportIssueDetail"];
export type SupportMessage = SupportIssueDetail["messages"][number];

export const listSupportIssues = (query: { status?: SupportIssueStatus; sort?: "asc" | "desc" }) =>
  unwrap(api.GET("/api/v1/support/issues", { params: { query } }));

export const countOpenSupportIssues = () => unwrap(api.GET("/api/v1/support/open-count"));

/** Creates the ticket and its optional first message; the server alerts super admins. */
export const createSupportIssue = (body: components["schemas"]["CreateSupportIssueRequest"]) =>
  unwrap(api.POST("/api/v1/support/issues", { body }));

export const getSupportIssue = (issueId: string) =>
  unwrap(api.GET("/api/v1/support/issues/{issueId}", { params: { path: { issueId } } }));

/** Multipart: `body` text field plus an optional image/video `file` (the server notifies the other side). */
export function postSupportMessage(issueId: string, body: string, file: File | null) {
  const form = new FormData();
  form.append("body", body);
  if (file) form.append("file", file, file.name);
  // openapi-fetch passes FormData through untouched (the browser sets the multipart boundary).
  return unwrap(
    api.POST("/api/v1/support/issues/{issueId}/messages", {
      params: { path: { issueId } },
      body: form as never,
      bodySerializer: (value) => value as unknown as FormData,
    }),
  );
}

export const editSupportMessage = (issueId: string, messageId: string, body: string) =>
  unwrap(
    api.PATCH("/api/v1/support/issues/{issueId}/messages/{messageId}", {
      params: { path: { issueId, messageId } },
      body: { body },
    }),
  );

export const setSupportIssueStatus = (issueId: string, status: SupportIssueStatus) =>
  unwrap(
    api.PATCH("/api/v1/support/issues/{issueId}", {
      params: { path: { issueId } },
      body: { status },
    }),
  );

export async function deleteSupportIssue(issueId: string): Promise<void> {
  await api.DELETE("/api/v1/support/issues/{issueId}", { params: { path: { issueId } } });
}
