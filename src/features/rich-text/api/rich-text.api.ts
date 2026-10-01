import { api, unwrap } from "@/shared/api/client";

export const listDocumentTags = (projectId?: string) =>
  unwrap(api.GET("/api/v1/documents/tags", { params: { query: projectId ? { projectId } : {} } }));

/** Uploads an inline editor image; the returned key is persisted as `doc-image://<key>`. */
export function uploadInlineImage(file: File) {
  const form = new FormData();
  form.append("file", file, file.name);
  return unwrap(
    api.POST("/api/v1/files/document-images", {
      body: form as never,
      bodySerializer: (body) => body as unknown as FormData,
    }),
  );
}
