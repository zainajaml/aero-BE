import { useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  commentDocHasContent,
  serializeCommentDoc,
} from "@/features/rich-text/components/comment-editor";
import { normalizeDocumentImagesForStorage } from "@/features/rich-text/lib/document-images";
import { addComment, deleteComment, editComment, type TicketComment } from "../../api/tickets.api";
import { ticketErrorMessage } from "../../lib/ticket-errors";
import { ticketKeys, useTicketComments as useCommentsQuery } from "../ticket-queries";
import { uploadTicketFiles } from "./use-ticket-attachments";

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };

/** A composer's draft: TipTap doc + staged files, remounted via `key` after a send. */
function useComposer() {
  const [doc, setDoc] = useState<unknown>(null);
  const [key, setKey] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const reset = () => {
    setDoc(null);
    setKey((k) => k + 1);
    setFiles([]);
    if (fileRef.current) fileRef.current.value = "";
  };
  const addFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const picked = Array.from(list);
    setFiles((prev) => [...prev, ...picked]);
  };
  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, j) => j !== index));
  const canSend = commentDocHasContent(doc) || files.length > 0;
  return { doc, setDoc, key, setKey, files, fileRef, reset, addFiles, removeFile, canSend };
}

export type Composer = ReturnType<typeof useComposer>;

/**
 * Comments thread: new comment, one inline reply composer at a time, and inline edit.
 * Mention, reply and assignment emails are sent by the server.
 */
export function useTicketComments(ticketId: string, assertUnlocked: () => void) {
  const qc = useQueryClient();
  const { data: rows = [] } = useCommentsQuery(ticketId);
  const comments = useMemo(
    () => rows.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [rows],
  );
  const topComments = useMemo(() => comments.filter((c) => !c.parentId), [comments]);
  const repliesByParent = useMemo(
    () =>
      comments.reduce<Record<string, TicketComment[]>>((acc, c) => {
        if (c.parentId) (acc[c.parentId] ??= []).push(c);
        return acc;
      }, {}),
    [comments],
  );

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ticketKeys.comments(ticketId) });
    void qc.invalidateQueries({ queryKey: ticketKeys.attachments(ticketId) });
  };
  const onError = (e: unknown) => toast.error(ticketErrorMessage(e));

  const insert = async (doc: unknown, parentId: string | null, files: File[]) => {
    const allowEmpty = files.length > 0;
    if (!allowEmpty && !commentDocHasContent(doc)) return;
    const body = serializeCommentDoc(normalizeDocumentImagesForStorage(doc ?? EMPTY_DOC));
    const created = await addComment(ticketId, { body, parentId, allowEmpty });
    if (files.length) await uploadTicketFiles(ticketId, files, created.id);
  };

  // ---- new comment
  const composer = useComposer();
  const add = useMutation({
    mutationFn: async () => {
      assertUnlocked();
      await insert(composer.doc, null, composer.files);
    },
    onSuccess: () => {
      composer.reset();
      refresh();
    },
    onError,
  });

  // ---- inline reply (only one open at a time)
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; parentId: string } | null>(
    null,
  );
  const reply = useComposer();
  const toggleReply = (commentId: string, parentId: string) => {
    setReplyingTo((prev) => (prev?.commentId === commentId ? null : { commentId, parentId }));
    reply.setDoc(null);
    reply.setKey((k) => k + 1);
  };
  const cancelReply = () => {
    setReplyingTo(null);
    reply.reset();
  };
  const addReply = useMutation({
    mutationFn: async () => {
      assertUnlocked();
      if (!replyingTo) return;
      await insert(reply.doc, replyingTo.parentId, reply.files);
    },
    onSuccess: () => {
      setReplyingTo(null);
      reply.reset();
      refresh();
    },
    onError,
  });

  // ---- inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const editor = useComposer();
  const startEdit = (id: string, doc: unknown) => {
    setEditingId(id);
    editor.setDoc(doc);
  };
  const cancelEdit = () => {
    setEditingId(null);
    editor.reset();
  };
  const save = useMutation({
    mutationFn: async (id: string) => {
      assertUnlocked();
      if (!commentDocHasContent(editor.doc) && editor.files.length === 0) return;
      const body = serializeCommentDoc(normalizeDocumentImagesForStorage(editor.doc));
      await editComment(ticketId, id, body);
      if (editor.files.length) await uploadTicketFiles(ticketId, editor.files, id);
    },
    onSuccess: () => {
      setEditingId(null);
      editor.reset();
      refresh();
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: async (commentId: string) => {
      assertUnlocked();
      await deleteComment(ticketId, commentId);
    },
    onSuccess: refresh,
    onError,
  });

  return {
    comments,
    topComments,
    repliesByParent,
    composer,
    add,
    replyingTo,
    reply,
    toggleReply,
    cancelReply,
    addReply,
    editingId,
    editor,
    startEdit,
    cancelEdit,
    save,
    remove,
  };
}

export type TicketComments = ReturnType<typeof useTicketComments>;
