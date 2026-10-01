import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  getRagReport,
  listTicketComments,
  summarizeTicketComments,
  type CommentSummary,
  type RagRow,
  type TicketComment,
} from "../api/reporting.api";
import { reportingKeys } from "./reporting-queries";

const EMPTY_ROWS: RagRow[] = [];
const SUMMARY_STALE_MS = 1000 * 60 * 30;

/** AI summary, or null when the AI is unavailable (not configured, rate limited, failing). */
async function summaryOrNull(ticketId: string): Promise<CommentSummary | null> {
  try {
    return await summarizeTicketComments(ticketId);
  } catch {
    // 503 AI_NOT_CONFIGURED / 429 rate limit (and any other failure): fall back silently.
    return null;
  }
}

/** The server's RAG report for the project's active sprint(s), plus comments and AI summaries. */
export function useSprintStatus(projectId: string | undefined) {
  const ragQuery = useQuery({
    queryKey: reportingKeys.rag(projectId),
    enabled: !!projectId,
    queryFn: () => getRagReport(projectId!),
  });
  const rows = ragQuery.data?.rows ?? EMPTY_ROWS;
  const sprints = ragQuery.data?.sprints;
  const withComments = useMemo(() => rows.filter((r) => r.commentCount > 0), [rows]);

  // Comments (newest first) for the fallback bullets.
  const commentQueries = useQueries({
    queries: withComments.map((r) => ({
      queryKey: reportingKeys.comments(r.ticketId),
      queryFn: () => listTicketComments(r.ticketId),
    })),
  });
  const commentsByTicket = useMemo(() => {
    const m: Record<string, TicketComment[]> = {};
    withComments.forEach((r, i) => {
      const list = commentQueries[i]?.data;
      if (list)
        m[r.ticketId] = [...list].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    });
    return m;
  }, [withComments, commentQueries]);

  const summaryQueries = useQueries({
    queries: withComments.map((r) => ({
      queryKey: reportingKeys.commentSummary(r.ticketId, r.commentCount),
      staleTime: SUMMARY_STALE_MS,
      retry: false,
      queryFn: () => summaryOrNull(r.ticketId),
    })),
  });
  const summaries = useMemo(() => {
    const m: Record<string, CommentSummary | null> = {};
    withComments.forEach((r, i) => {
      const s = summaryQueries[i]?.data;
      if (s) m[r.ticketId] = s;
    });
    return m;
  }, [withComments, summaryQueries]);
  const summariesLoading = summaryQueries.some((q) => q.isFetching);

  return {
    rows,
    sprintName: sprints?.[0]?.name ?? null,
    commentsByTicket,
    summaries,
    summariesLoading,
  };
}
