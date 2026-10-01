import { useCallback, useEffect, useRef, useState } from "react";
import { useBlocker } from "@tanstack/react-router";
import { toast } from "sonner";
import { errorMessage } from "@/shared/api/errors";
import type { DocumentMeta } from "../api/documents.api";
import { comparableDocumentContent } from "../lib/document-tree";
import { useSaveDocument } from "./use-document-mutations";

/**
 * Selection + unsaved-draft state of the documents page: title/content drafts, dirty tracking,
 * explicit save, and the "unsaved changes" guard for switching pages and router navigation.
 */
export function useDocumentDraft(docs: DocumentMeta[]) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [contentDraft, setContentDraft] = useState<unknown>(null);
  const savedContentRef = useRef<unknown>(null);
  const [dirty, setDirty] = useState(false);
  const [pendingSelect, setPendingSelect] = useState<DocumentMeta | null>(null);
  const saveMutation = useSaveDocument();

  const selected = docs.find((d) => d.id === selectedId) ?? null;

  function applySelectDoc(d: DocumentMeta) {
    setSelectedId(d.id);
    setTitleDraft(d.title);
    // Content arrives with the document detail; the editor reports it via onContentReady.
    setContentDraft(null);
    savedContentRef.current = null;
    setDirty(false);
  }

  function clearSelection() {
    setSelectedId(null);
    setDirty(false);
  }

  function updateTitleDraft(value: string) {
    setTitleDraft(value);
    setDirty(
      value !== (selected?.title ?? "") ||
        comparableDocumentContent(contentDraft) !==
          comparableDocumentContent(savedContentRef.current),
    );
  }

  function updateContentDraft(value: unknown) {
    setContentDraft(value);
    setDirty(
      titleDraft !== (selected?.title ?? "") ||
        comparableDocumentContent(value) !== comparableDocumentContent(savedContentRef.current),
    );
  }

  const initializeContentDraft = useCallback((value: unknown) => {
    savedContentRef.current = value;
    setContentDraft(value);
  }, []);

  function selectDoc(d: DocumentMeta) {
    if (dirty && selected && d.id !== selected.id) {
      setPendingSelect(d);
      return;
    }
    applySelectDoc(d);
  }

  async function saveDoc(opts?: { silent?: boolean }) {
    if (!selected || !dirty) return true;
    try {
      await saveMutation.mutateAsync({
        id: selected.id,
        title: titleDraft,
        content: contentDraft,
      });
      savedContentRef.current = contentDraft;
      setDirty(false);
      if (!opts?.silent) toast.success("Saved");
      return true;
    } catch (e) {
      toast.error(errorMessage(e, "Could not save changes"));
      return false;
    }
  }

  // Block router navigation while there are unsaved changes.
  const blocker = useBlocker({
    shouldBlockFn: () => dirty,
    withResolver: true,
    enableBeforeUnload: () => dirty,
  });

  // Warn on tab close / reload while dirty.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  /** "Cancel" in the unsaved-changes dialog — stay on the current screen. */
  function stay() {
    setPendingSelect(null);
    if (blocker.status === "blocked") blocker.reset?.();
  }

  /** "Just Leave" — discard changes and continue to the pending page / route. */
  function discardAndContinue() {
    setDirty(false);
    if (pendingSelect) {
      const next = pendingSelect;
      setPendingSelect(null);
      applySelectDoc(next);
    } else if (blocker.status === "blocked") {
      blocker.proceed?.();
    }
  }

  return {
    selectedId,
    selected,
    titleDraft,
    dirty,
    saving: saveMutation.isPending,
    leavePromptOpen: !!pendingSelect || blocker.status === "blocked",
    applySelectDoc,
    selectDoc,
    clearSelection,
    updateTitleDraft,
    updateContentDraft,
    initializeContentDraft,
    saveDoc,
    stay,
    discardAndContinue,
  };
}

export type DocumentDraft = ReturnType<typeof useDocumentDraft>;
