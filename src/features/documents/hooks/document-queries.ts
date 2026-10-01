import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { isApiError } from "@/shared/api/errors";
import { downloadDocumentFile, getDocument, getDocumentLibrary } from "../api/documents.api";

export const documentKeys = {
  all: ["documents"] as const,
  libraries: () => [...documentKeys.all, "library"] as const,
  /** `projectId` null = every visible project (All Projects mode). */
  library: (projectId: string | null) => [...documentKeys.libraries(), projectId ?? "all"] as const,
  detail: (documentId: string) => [...documentKeys.all, "detail", documentId] as const,
  file: (documentId: string) => [...documentKeys.all, "file", documentId] as const,
  /** Owned by the rich-text feature ("#" document tagging suggestions). */
  tags: ["document-tags"] as const,
};

const noRetryOn404 = (failureCount: number, error: unknown) =>
  !(isApiError(error) && (error.status === 404 || error.status === 403)) && failureCount < 2;

/** Documents (metadata) and folders of a project, or of every visible project when `projectId` is null. */
export function useDocumentLibrary(projectId: string | null, enabled = true) {
  return useQuery({
    queryKey: documentKeys.library(projectId),
    enabled,
    queryFn: () => getDocumentLibrary(projectId ?? undefined),
  });
}

/** A single document with content and the caller's `canEdit` / `canDelete`. */
export function useDocument(documentId: string | null | undefined) {
  return useQuery({
    queryKey: documentKeys.detail(documentId ?? ""),
    enabled: !!documentId,
    queryFn: () => getDocument(documentId!),
    retry: noRetryOn404,
  });
}

/**
 * Downloads a file-backed document and exposes it as a same-origin object URL (the PDF viewer and
 * the download link both use it). The URL is revoked when the document changes or on unmount.
 */
export function useDocumentFileUrl(documentId: string | null | undefined) {
  const { data: blob, isLoading } = useQuery({
    queryKey: documentKeys.file(documentId ?? ""),
    enabled: !!documentId,
    queryFn: () => downloadDocumentFile(documentId!),
    retry: noRetryOn404,
    staleTime: 5 * 60 * 1000,
    gcTime: 0,
  });
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);
  return { url, loading: isLoading || (!!blob && !url) };
}
