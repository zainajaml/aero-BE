import { useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  deleteAttachment,
  getAttachmentUrl,
  uploadAttachment,
  type Attachment,
} from "../../api/tickets.api";
import { ticketErrorMessage } from "../../lib/ticket-errors";
import { ticketKeys, useTicketAttachments as useAttachmentsQuery } from "../ticket-queries";
import type { PreviewAttachment } from "../../components/ticket-dialog/attachment-preview-dialog";

/** Upload files one by one (multipart); `commentId` attaches them to that comment. */
export async function uploadTicketFiles(
  ticketId: string,
  files: File[],
  commentId?: string | null,
): Promise<void> {
  for (const file of files) await uploadAttachment(ticketId, file, commentId);
}

/** Ticket attachments: description uploads, deletes and the signed-URL preview. */
export function useTicketAttachments(
  ticketId: string,
  assertUnlocked: () => void,
  setPreview: (preview: PreviewAttachment | null) => void,
) {
  const qc = useQueryClient();
  const { data: rows = [] } = useAttachmentsQuery(ticketId);
  const attachments = useMemo(
    () => rows.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [rows],
  );
  const descriptionAttachments = useMemo(
    () => attachments.filter((a) => a.context !== "comment"),
    [attachments],
  );
  const forComment = (commentId: string) => attachments.filter((a) => a.commentId === commentId);

  const fileRef = useRef<HTMLInputElement>(null);
  // Names of files uploading from the description tab, shown as placeholder
  // rows so users see progress instead of retrying the upload.
  const [uploadingNames, setUploadingNames] = useState<string[]>([]);

  const refresh = () => void qc.invalidateQueries({ queryKey: ticketKeys.attachments(ticketId) });

  const upload = useMutation({
    mutationFn: async (list: File[]) => {
      assertUnlocked();
      await uploadTicketFiles(ticketId, list);
    },
    onSuccess: () => {
      refresh();
      toast.success("Uploaded");
    },
    onError: (e) => toast.error(ticketErrorMessage(e)),
    onSettled: () => {
      setUploadingNames([]);
      if (fileRef.current) fileRef.current.value = "";
    },
  });

  const startUpload = (list: FileList) => {
    const files = Array.from(list);
    setUploadingNames(files.map((f) => f.name));
    upload.mutate(files);
  };

  const remove = useMutation({
    mutationFn: async (att: Attachment) => {
      assertUnlocked();
      await deleteAttachment(ticketId, att.id);
    },
    onSuccess: refresh,
    onError: (e) => toast.error(ticketErrorMessage(e)),
  });

  const open = async (item: Attachment) => {
    // Open the viewer immediately with a loading state so the click always
    // gives instant feedback while the file link is being prepared.
    setPreview({ name: item.name, url: null });
    try {
      const { url } = await getAttachmentUrl(ticketId, item.id);
      setPreview({ name: item.name, url });
    } catch {
      setPreview(null);
      toast.error("Could not open file");
    }
  };

  return {
    attachments,
    descriptionAttachments,
    forComment,
    fileRef,
    uploadingNames,
    upload,
    startUpload,
    remove,
    open,
  };
}

export type TicketAttachments = ReturnType<typeof useTicketAttachments>;
