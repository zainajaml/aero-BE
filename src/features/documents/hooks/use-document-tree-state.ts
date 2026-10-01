import { useState } from "react";

/** Expand/collapse state of pages and folders plus the inline folder-rename draft. */
export function useDocumentTreeState() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [folderExpanded, setFolderExpanded] = useState<Record<string, boolean>>({});
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [folderNameDraft, setFolderNameDraft] = useState("");

  return {
    expanded,
    folderExpanded,
    editingFolderId,
    folderNameDraft,
    setFolderNameDraft,
    setEditingFolderId,
    togglePage: (id: string, open: boolean) => setExpanded((e) => ({ ...e, [id]: open })),
    /** Folders default to open. */
    isFolderOpen: (id: string) => folderExpanded[id] ?? true,
    setFolderOpen: (id: string, open: boolean) => setFolderExpanded((e) => ({ ...e, [id]: open })),
    startRename: (id: string, name: string) => {
      setEditingFolderId(id);
      setFolderNameDraft(name);
    },
  };
}

export type DocumentTreeState = ReturnType<typeof useDocumentTreeState>;
