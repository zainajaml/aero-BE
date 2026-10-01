import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/auth-context";
import {
  parseStoredComment,
  serializeCommentDoc,
} from "@/features/rich-text/components/comment-editor";
import { resolveDocumentImagesForDisplay } from "@/features/rich-text/lib/document-images";
import { countOpenSupportIssues, getSupportIssue, listSupportIssues } from "../api/support.api";

export const supportKeys = {
  all: ["support"] as const,
  issues: (userId: string | undefined, sort: "asc" | "desc") =>
    [...supportKeys.all, "issues", userId, sort] as const,
  openCount: (userId: string | undefined) => [...supportKeys.all, "open-count", userId] as const,
  issue: (issueId: string) => [...supportKeys.all, "issue", issueId] as const,
};

/** The caller's tickets (super admins: all tickets), scoped server-side. */
export function useSupportIssues(enabled: boolean, sort: "asc" | "desc") {
  const { user } = useAuth();
  return useQuery({
    queryKey: supportKeys.issues(user?.id, sort),
    enabled: enabled && !!user,
    queryFn: () => listSupportIssues({ sort }),
  });
}

/** Badge count of open tickets in the caller's view, polled every 20s. */
export function useSupportOpenCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: supportKeys.openCount(user?.id),
    enabled: !!user,
    refetchInterval: 20000,
    refetchOnWindowFocus: true,
    queryFn: async () => (await countOpenSupportIssues()).count,
  });
}

/**
 * A ticket with its messages. Polled every 10s while the thread is open so replies from the
 * other side appear without a realtime channel.
 */
export function useSupportIssue(issueId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: supportKeys.issue(issueId ?? ""),
    enabled: enabled && !!issueId,
    refetchInterval: 10000,
    queryFn: async () => {
      const detail = await getSupportIssue(issueId!);
      // Re-sign any inline document-images (stored as `doc-image://<path>`) so they render.
      const messages = await Promise.all(
        detail.messages.map(async (m) => {
          const parsed = parseStoredComment(m.body);
          if (parsed.kind !== "rich") return m;
          const resolved = await resolveDocumentImagesForDisplay(parsed.doc);
          return { ...m, body: serializeCommentDoc(resolved) };
        }),
      );
      return { ...detail, messages };
    },
  });
}
