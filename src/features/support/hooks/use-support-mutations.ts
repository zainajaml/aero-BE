import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { errorMessage } from "@/shared/api/errors";
import {
  commentDocHasContent,
  serializeCommentDoc,
} from "@/features/rich-text/components/comment-editor";
import { normalizeDocumentImagesForStorage } from "@/features/rich-text/lib/document-images";
import {
  createSupportIssue,
  deleteSupportIssue,
  editSupportMessage,
  postSupportMessage,
  setSupportIssueStatus,
  type SupportIssue,
} from "../api/support.api";
import { supportKeys } from "./support-queries";

function useInvalidateSupport() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: supportKeys.all });
}

export function useCreateSupportIssue(onCreated: (issue: SupportIssue) => void) {
  const invalidate = useInvalidateSupport();
  return useMutation({
    mutationFn: ({ subject, description }: { subject: string; description?: unknown }) =>
      createSupportIssue({
        subject,
        // Description is optional — the server posts it as the opening message when present.
        description:
          description && commentDocHasContent(description)
            ? serializeCommentDoc(normalizeDocumentImagesForStorage(description))
            : null,
      }),
    onSuccess: ({ issue }) => {
      onCreated(issue);
      void invalidate();
    },
    onError: (e) => toast.error(errorMessage(e, "Could not create issue")),
  });
}

export function useSendSupportMessage(issueId: string | null, onSent: () => void) {
  const invalidate = useInvalidateSupport();
  return useMutation({
    mutationFn: ({ body, file }: { body: string; file: File | null }) =>
      postSupportMessage(issueId!, body, file),
    onSuccess: () => {
      onSent();
      void invalidate();
    },
    onError: (e) => toast.error(errorMessage(e, "Could not send message")),
  });
}

export function useEditSupportMessage(issueId: string, onSaved: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, doc }: { id: string; doc: unknown }) =>
      editSupportMessage(
        issueId,
        id,
        serializeCommentDoc(normalizeDocumentImagesForStorage(doc)),
      ),
    onSuccess: () => {
      onSaved();
      void qc.invalidateQueries({ queryKey: supportKeys.issue(issueId) });
      toast.success("Message updated");
    },
    onError: (e) => toast.error(errorMessage(e, "Could not update message")),
  });
}

export function useToggleSupportIssueStatus() {
  const invalidate = useInvalidateSupport();
  return useMutation({
    mutationFn: (issue: SupportIssue) =>
      setSupportIssueStatus(issue.id, issue.status === "open" ? "closed" : "open"),
    onSuccess: () => void invalidate(),
    onError: (e) => toast.error(errorMessage(e, "Could not update status")),
  });
}

export function useDeleteSupportIssue(onDeleted: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (issue: SupportIssue) => deleteSupportIssue(issue.id),
    onSuccess: (_data, issue) => {
      onDeleted();
      qc.removeQueries({ queryKey: supportKeys.issue(issue.id) });
      void qc.invalidateQueries({ queryKey: supportKeys.all });
      toast.success("Ticket deleted");
    },
    onError: (e) => toast.error(errorMessage(e, "Could not delete ticket")),
  });
}
