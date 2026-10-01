import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listAuditLogs, type AuditLogQuery } from "../api/audit.api";

export const auditKeys = {
  all: ["audit-logs"] as const,
  list: (query: AuditLogQuery) => [...auditKeys.all, "list", query] as const,
};

/** One page of the audit trail (filtered, sorted and paged by the server). */
export function useAuditLogs(query: AuditLogQuery, enabled = true) {
  return useQuery({
    queryKey: auditKeys.list(query),
    queryFn: () => listAuditLogs(query),
    enabled,
    placeholderData: keepPreviousData,
  });
}
