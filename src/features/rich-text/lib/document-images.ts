import { signedUrl } from "@/shared/api/signed-urls";
import { uploadInlineImage } from "../api/rich-text.api";

export const DOCUMENT_IMAGE_BUCKET = "document-images";
// Sentinel prefix used to persist a stable storage path (never a signed URL)
// inside the document JSON. Signed URLs are short-lived and must not be stored.
export const STORAGE_PREFIX = "doc-image://";

/**
 * Extract the storage object path from any known image src form:
 * - sentinel form: `doc-image://<path>`
 * - signed URL: `.../storage/v1/object/sign/document-images/<path>?token=...`
 * - legacy public URL: `.../storage/v1/object/public/document-images/<path>`
 * Returns null when the src is not a document-images reference.
 */
export function extractDocumentImagePath(src: unknown): string | null {
  if (typeof src !== "string" || !src) return null;
  if (src.startsWith(STORAGE_PREFIX)) return src.slice(STORAGE_PREFIX.length);
  const markers = [
    `/storage/v1/object/sign/${DOCUMENT_IMAGE_BUCKET}/`,
    `/storage/v1/object/public/${DOCUMENT_IMAGE_BUCKET}/`,
  ];
  for (const marker of markers) {
    const idx = src.indexOf(marker);
    if (idx !== -1) {
      const after = src.slice(idx + marker.length);
      return decodeURIComponent(after.split("?")[0]);
    }
  }
  return null;
}

type TipTapNode = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  [key: string]: unknown;
};

function walkNodes(content: unknown, visit: (node: TipTapNode) => void): void {
  if (Array.isArray(content)) {
    for (const child of content) walkNodes(child, visit);
    return;
  }
  if (content && typeof content === "object") {
    const node = content as TipTapNode;
    visit(node);
    if (Array.isArray(node.content)) {
      for (const child of node.content) walkNodes(child, visit);
    }
  }
}

function cloneContent<T>(content: T): T {
  if (typeof structuredClone === "function") return structuredClone(content);
  return JSON.parse(JSON.stringify(content));
}

/**
 * Replace every document-image src with a freshly signed, short-lived URL so
 * the editor can render private images. Returns a new content object.
 */
export async function resolveDocumentImagesForDisplay(content: unknown): Promise<unknown> {
  if (!content || typeof content !== "object") return content;

  const paths = new Set<string>();
  walkNodes(content, (node) => {
    if (node.type === "image" && node.attrs?.src) {
      const path = extractDocumentImagePath(node.attrs.src);
      if (path) paths.add(path);
    }
  });
  if (paths.size === 0) return content;

  const signed = new Map<string, string>();
  await Promise.all(
    [...paths].map(async (path) => {
      const url = await signedUrl("document-images", path);
      if (url) signed.set(path, url);
    }),
  );

  const clone = cloneContent(content);
  walkNodes(clone, (node) => {
    if (node.type === "image" && node.attrs?.src) {
      const path = extractDocumentImagePath(node.attrs.src);
      if (path && signed.has(path)) {
        node.attrs.src = signed.get(path);
      }
    }
  });
  // Drop images we could not sign — otherwise the editor renders a broken
  // image (a tiny dot / empty rectangle) with no useful meaning.
  return dropUnresolvedImages(clone);
}

/** Removes image nodes whose src is still an unresolved storage reference. */
function dropUnresolvedImages(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(dropUnresolvedImages).filter((child) => child !== null);
  }
  if (value && typeof value === "object") {
    const node = value as TipTapNode;
    if (node.type === "image" && typeof node.attrs?.src === "string") {
      if (node.attrs.src.startsWith(STORAGE_PREFIX)) return null;
    }
    const next: Record<string, unknown> = { ...(value as Record<string, unknown>) };
    if (Array.isArray(node.content)) {
      next.content = (node.content as unknown[])
        .map(dropUnresolvedImages)
        .filter((child) => child !== null);
    }
    return next;
  }
  return value;
}

/**
 * Normalize content before persisting: rewrite any document-image src back to
 * the stable sentinel path so we never store short-lived signed URLs.
 */
export function normalizeDocumentImagesForStorage(content: unknown): unknown {
  if (!content || typeof content !== "object") return content;
  const clone = cloneContent(content);
  walkNodes(clone, (node) => {
    if (node.type === "image" && node.attrs?.src) {
      const path = extractDocumentImagePath(node.attrs.src);
      if (path) node.attrs.src = `${STORAGE_PREFIX}${path}`;
    }
  });
  return clone;
}

/**
 * Upload an image to the private bucket and return a signed URL for immediate
 * display. Returns null on failure. The path (not the signed URL) is persisted
 * later via normalizeDocumentImagesForStorage.
 */
export async function uploadDocumentImage(file: File): Promise<string | null> {
  try {
    return (await uploadInlineImage(file)).url;
  } catch {
    return null;
  }
}
