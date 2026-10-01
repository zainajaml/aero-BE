import { api, unwrap } from "@/shared/api/client";
import { fetchBlob } from "@/shared/api/raw-file";
import type { components } from "@/shared/api/schema.gen";

export type DocumentMeta = components["schemas"]["DocumentMeta"];
export type DocumentFolder = components["schemas"]["DocumentFolder"];
export type DocumentDetail = components["schemas"]["Document"];
export type DocumentLibrary = components["schemas"]["DocumentLibrary"];
export type UpdateDocumentRequest = components["schemas"]["UpdateDocumentRequest"];

/** Documents (metadata only) and folders of one project, or of every visible project when omitted. */
export const getDocumentLibrary = (projectId?: string) =>
  unwrap(api.GET("/api/v1/documents", { params: { query: projectId ? { projectId } : {} } }));

/** A document with its content and the caller's permissions. */
export const getDocument = (documentId: string) =>
  unwrap(api.GET("/api/v1/documents/{documentId}", { params: { path: { documentId } } }));

/** The stored file of a file-backed document, as a Blob (served same-origin as an object URL). */
export const downloadDocumentFile = (documentId: string) =>
  fetchBlob(`/api/v1/documents/${encodeURIComponent(documentId)}/file`);

export const createDocument = (
  projectId: string,
  body: components["schemas"]["CreateDocumentRequest"],
) =>
  unwrap(api.POST("/api/v1/projects/{projectId}/documents", { params: { path: { projectId } }, body }));

export function uploadDocumentFile(projectId: string, file: File, folderId: string | null) {
  const form = new FormData();
  form.append("file", file, file.name);
  // openapi-fetch passes FormData through untouched (the browser sets the multipart boundary).
  return unwrap(
    api.POST("/api/v1/projects/{projectId}/documents/files", {
      params: { path: { projectId }, query: folderId ? { folderId } : {} },
      body: form as never,
      bodySerializer: (body) => body as unknown as FormData,
    }),
  );
}

export const updateDocument = (documentId: string, body: UpdateDocumentRequest) =>
  unwrap(api.PATCH("/api/v1/documents/{documentId}", { params: { path: { documentId } }, body }));

export const moveDocument = (documentId: string, folderId: string | null) =>
  unwrap(
    api.POST("/api/v1/documents/{documentId}/move", {
      params: { path: { documentId } },
      body: { folderId },
    }),
  );

export async function deleteDocument(documentId: string): Promise<void> {
  await api.DELETE("/api/v1/documents/{documentId}", { params: { path: { documentId } } });
}

export const createDocumentFolder = (projectId: string, name?: string) =>
  unwrap(
    api.POST("/api/v1/projects/{projectId}/document-folders", {
      params: { path: { projectId } },
      body: name ? { name } : {},
    }),
  );

export const renameDocumentFolder = (folderId: string, name: string) =>
  unwrap(
    api.PATCH("/api/v1/document-folders/{folderId}", {
      params: { path: { folderId } },
      body: { name },
    }),
  );

export async function deleteDocumentFolder(folderId: string): Promise<void> {
  await api.DELETE("/api/v1/document-folders/{folderId}", { params: { path: { folderId } } });
}
