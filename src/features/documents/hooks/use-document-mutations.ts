import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { errorMessage } from "@/shared/api/errors";
import {
  createDocument,
  createDocumentFolder,
  deleteDocument,
  deleteDocumentFolder,
  moveDocument,
  renameDocumentFolder,
  updateDocument,
  uploadDocumentFile,
  type DocumentDetail,
  type DocumentLibrary,
  type DocumentMeta,
} from "../api/documents.api";
import { documentKeys } from "./document-queries";

const MAX_FILE_BYTES = 50 * 1024 * 1024;

/** Refresh every documents cache (project-scoped, all-projects mode and the "#" tagging list). */
export function useRefreshDocuments() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: documentKeys.libraries() }),
      qc.invalidateQueries({ queryKey: documentKeys.tags }),
    ]);
}

export function useCreateDocument(
  projectId: string | undefined,
  onCreated: (
    doc: DocumentMeta,
    opts: { parentId: string | null; folderId: string | null },
  ) => void,
) {
  const refresh = useRefreshDocuments();
  return useMutation({
    mutationFn: (opts: { parentId: string | null; folderId: string | null }) =>
      createDocument(projectId!, { parentId: opts.parentId, folderId: opts.folderId }),
    onSuccess: async (doc, opts) => {
      await refresh();
      onCreated(doc, opts);
    },
    onError: (e: unknown) => toast.error(errorMessage(e, "Could not create page")),
  });
}

export function useUploadDocumentFile(
  projectId: string | undefined,
  onUploaded: (doc: DocumentMeta) => void,
) {
  const refresh = useRefreshDocuments();
  return useMutation({
    mutationFn: async (opts: { file: File; folderId: string | null }) => {
      if (opts.file.size > MAX_FILE_BYTES) {
        throw new Error("File must be smaller than 50MB");
      }
      return uploadDocumentFile(projectId!, opts.file, opts.folderId);
    },
    onSuccess: async (doc) => {
      await refresh();
      onUploaded(doc);
      toast.success("File uploaded");
    },
    onError: (e: unknown) => toast.error(errorMessage(e, "Could not upload file")),
  });
}

export function useDeleteDocument(onDeleted: (id: string) => void) {
  const refresh = useRefreshDocuments();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDocument(id);
      return id;
    },
    onSuccess: async (id) => {
      await refresh();
      qc.removeQueries({ queryKey: documentKeys.detail(id) });
      onDeleted(id);
      toast.success("Page deleted");
    },
    onError: (e: unknown) => toast.error(errorMessage(e, "Could not delete page")),
  });
}

export function useCreateFolder(projectId: string | undefined, onCreated: (id: string) => void) {
  const refresh = useRefreshDocuments();
  return useMutation({
    mutationFn: () => createDocumentFolder(projectId!, "New Folder"),
    onSuccess: async (folder) => {
      await refresh();
      onCreated(folder.id);
    },
    onError: (e: unknown) => toast.error(errorMessage(e, "Could not create folder")),
  });
}

export function useRenameFolder() {
  const refresh = useRefreshDocuments();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameDocumentFolder(id, name),
    onSuccess: () => refresh(),
    onError: (e: unknown) => toast.error(errorMessage(e, "Could not rename folder")),
  });
}

export function useDeleteFolder(onDeleted: () => void) {
  const refresh = useRefreshDocuments();
  return useMutation({
    mutationFn: (id: string) => deleteDocumentFolder(id),
    onSuccess: async () => {
      await refresh();
      onDeleted();
      toast.success("Folder deleted");
    },
    onError: (e: unknown) => toast.error(errorMessage(e, "Could not delete folder")),
  });
}

/** Move a page into a folder (null = ungrouped); optimistic on the project's library. */
export function useMoveDocument(projectId: string | undefined) {
  const qc = useQueryClient();
  const refresh = useRefreshDocuments();
  return useMutation({
    mutationFn: ({ id, folderId }: { id: string; folderId: string | null }) =>
      moveDocument(id, folderId),
    onMutate: ({ id, folderId }) => {
      qc.setQueryData<DocumentLibrary>(documentKeys.library(projectId ?? null), (old) =>
        old
          ? {
              ...old,
              documents: old.documents.map((d) =>
                d.id === id ? { ...d, folderId, parentId: null } : d,
              ),
            }
          : old,
      );
    },
    onError: (e: unknown) => {
      toast.error(errorMessage(e, "Could not move page"));
      void refresh();
    },
    onSuccess: () => void refresh(),
  });
}

/** Save a page's title / content; keeps the cached library and detail in sync. */
export function useSaveDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title, content }: { id: string; title: string; content: unknown }) =>
      updateDocument(id, {
        title,
        content: (content ?? null) as Record<string, unknown> | null,
      }),
    onSuccess: (meta, { id, content }) => {
      qc.setQueryData<DocumentDetail>(documentKeys.detail(id), (old) =>
        old ? { ...old, ...meta, content } : old,
      );
      qc.setQueriesData<DocumentLibrary>({ queryKey: documentKeys.libraries() }, (old) =>
        old ? { ...old, documents: old.documents.map((d) => (d.id === id ? meta : d)) } : old,
      );
      void qc.invalidateQueries({ queryKey: documentKeys.tags });
    },
  });
}
