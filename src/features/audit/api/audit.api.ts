import { api, unwrap } from "@/shared/api/client";
import type { components, operations } from "@/shared/api/schema.gen";

type AuditLogPage = components["schemas"]["AuditLogPage"];
export type AuditLogRow = AuditLogPage["items"][number];
export type AuditLogQuery = NonNullable<operations["listAuditLogs"]["parameters"]["query"]>;
export type AuditSort = NonNullable<AuditLogQuery["sort"]>;

/** Audit trail visible to the caller; names, filtering, sorting and paging happen server-side. */
export const listAuditLogs = (query: AuditLogQuery) =>
  unwrap(api.GET("/api/v1/audit-logs", { params: { query } }));
