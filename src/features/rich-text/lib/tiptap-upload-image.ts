import { Node, mergeAttributes } from "@tiptap/core";
import type { Editor } from "@tiptap/react";
import { toast } from "sonner";
import { uploadDocumentImage } from "./document-images";

/**
 * Placeholder node shown while an image is uploading. It reserves the final
 * image dimensions (measured locally from the file) so the document does not
 * shift when the real image arrives, shows a spinner while uploading, and an
 * inline Retry / Remove error state if the upload fails.
 *
 * The node is transient: it is never persisted, it is replaced by a real
 * `image` node on success and removed by the user on failure.
 */

const MAX_BYTES = 10 * 1024 * 1024;

/** Files kept in memory so a failed upload can be retried. */
const pendingFiles = new Map<string, File>();

export const UploadingImage = Node.create({
  name: "uploadingImage",
  group: "block",
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      uploadId: { default: null },
      width: { default: null },
      height: { default: null },
      previewUrl: { default: null },
      status: { default: "uploading" }, // "uploading" | "error"
      name: { default: null },
    };
  },

  // Not part of the saved schema — never parsed back from HTML.
  parseHTML() {
    return [];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-uploading-image": "" })];
  },

  addNodeView() {
    return ({ node, editor }) => {
      const attrs = node.attrs as {
        uploadId: string;
        width: number | null;
        height: number | null;
        previewUrl: string | null;
        status: string;
        name: string | null;
      };

      const wrapper = document.createElement("div");
      wrapper.setAttribute("data-uploading-image", "");
      wrapper.className =
        "relative my-3 flex w-full max-w-full items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-muted/40";

      // Reserve the final rendered size to avoid layout shift.
      const ratio = attrs.width && attrs.height ? attrs.height / attrs.width : 0.5625;
      const maxWidth = attrs.width ? Math.min(attrs.width, 640) : 480;
      wrapper.style.width = `${maxWidth}px`;
      wrapper.style.height = `${Math.round(maxWidth * ratio)}px`;

      if (attrs.previewUrl && attrs.status === "uploading") {
        const preview = document.createElement("img");
        preview.src = attrs.previewUrl;
        preview.className = "absolute inset-0 h-full w-full object-contain opacity-30 blur-[1px]";
        wrapper.appendChild(preview);
      }

      const overlay = document.createElement("div");
      overlay.className =
        "relative flex h-full w-full flex-col items-center justify-center gap-2 px-3 text-center";

      if (attrs.status === "uploading") {
        wrapper.classList.add("animate-pulse");
        const spinner = document.createElement("div");
        spinner.className =
          "h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground";
        const label = document.createElement("div");
        label.className = "text-xs text-muted-foreground";
        label.textContent = "Uploading image…";
        const bar = document.createElement("div");
        bar.className = "h-1 w-32 overflow-hidden rounded-full bg-muted";
        const fill = document.createElement("div");
        fill.className =
          "h-full w-1/3 animate-[loading-slide_1.2s_ease-in-out_infinite] bg-foreground/60";
        bar.appendChild(fill);
        overlay.append(spinner, label, bar);
      } else {
        const label = document.createElement("div");
        label.className = "text-xs font-medium text-destructive";
        label.textContent = "Upload failed";
        const sub = document.createElement("div");
        sub.className = "text-[11px] text-muted-foreground";
        sub.textContent = attrs.name ?? "";
        const actions = document.createElement("div");
        actions.className = "mt-1 flex items-center gap-2";

        const retry = document.createElement("button");
        retry.type = "button";
        retry.textContent = "Retry";
        retry.className =
          "rounded-full border border-border bg-background px-3 py-1 text-xs hover:bg-accent";
        retry.addEventListener("click", (e) => {
          e.preventDefault();
          void retryUpload(editor as Editor, attrs.uploadId);
        });

        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "Remove";
        remove.className =
          "rounded-full border border-destructive/40 px-3 py-1 text-xs text-destructive hover:bg-destructive/10";
        remove.addEventListener("click", (e) => {
          e.preventDefault();
          removeUploadNode(editor as Editor, attrs.uploadId);
        });

        actions.append(retry, remove);
        overlay.append(label, sub, actions);
      }

      wrapper.appendChild(overlay);
      return { dom: wrapper };
    };
  },
});

function findUploadNode(editor: Editor, uploadId: string): number | null {
  let pos: number | null = null;
  editor.state.doc.descendants((node, nodePos) => {
    if (node.type.name === "uploadingImage" && node.attrs.uploadId === uploadId) {
      pos = nodePos;
      return false;
    }
    return true;
  });
  return pos;
}

function setUploadStatus(editor: Editor, uploadId: string, status: string) {
  const pos = findUploadNode(editor, uploadId);
  if (pos === null) return;
  const node = editor.state.doc.nodeAt(pos);
  if (!node) return;
  editor.view.dispatch(
    editor.state.tr
      .setNodeMarkup(pos, undefined, { ...node.attrs, status })
      .setMeta("addToHistory", false),
  );
}

function removeUploadNode(editor: Editor, uploadId: string) {
  const pos = findUploadNode(editor, uploadId);
  if (pos === null) return;
  const node = editor.state.doc.nodeAt(pos);
  if (!node) return;
  if (node.attrs.previewUrl) URL.revokeObjectURL(node.attrs.previewUrl as string);
  pendingFiles.delete(uploadId);
  editor.view.dispatch(editor.state.tr.delete(pos, pos + node.nodeSize));
}

function replaceWithImage(editor: Editor, uploadId: string, src: string) {
  const pos = findUploadNode(editor, uploadId);
  if (pos === null) return;
  const node = editor.state.doc.nodeAt(pos);
  if (!node) return;
  if (node.attrs.previewUrl) URL.revokeObjectURL(node.attrs.previewUrl as string);
  pendingFiles.delete(uploadId);
  const imageType = editor.schema.nodes.image;
  if (!imageType) return;
  editor.view.dispatch(
    editor.state.tr
      .replaceWith(pos, pos + node.nodeSize, imageType.create({ src }))
      .setMeta("addToHistory", false),
  );
}

async function measure(
  file: File,
): Promise<{ url: string; width: number | null; height: number | null }> {
  const url = URL.createObjectURL(file);
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve({ url, width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ url, width: null, height: null });
    img.src = url;
  });
}

/** Keep the upload placeholder mounted until the final remote image is ready. */
async function waitForImageReady(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = async () => {
      try {
        await img.decode();
      } catch {
        // A successful load is sufficient when decode() is unavailable or races.
      }
      resolve(true);
    };
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

async function runUpload(editor: Editor, uploadId: string, file: File) {
  const url = await uploadDocumentImage(file);
  if (!editor || editor.isDestroyed) return;
  if (url) {
    const ready = await waitForImageReady(url);
    if (!editor || editor.isDestroyed) return;
    if (ready) {
      replaceWithImage(editor, uploadId, url);
    } else {
      setUploadStatus(editor, uploadId, "error");
      toast.error("Uploaded image could not be loaded");
    }
  } else {
    setUploadStatus(editor, uploadId, "error");
    toast.error("Could not upload image");
  }
}

async function retryUpload(editor: Editor, uploadId: string) {
  const file = pendingFiles.get(uploadId);
  if (!file) {
    removeUploadNode(editor, uploadId);
    return;
  }
  setUploadStatus(editor, uploadId, "uploading");
  await runUpload(editor, uploadId, file);
}

/**
 * Validates the file, inserts a skeleton placeholder at the cursor immediately,
 * then uploads and swaps in the real image (or an inline error state).
 */
export async function insertUploadingImage(editor: Editor, file: File) {
  if (!file.type.startsWith("image/")) {
    toast.error("Only image files can be uploaded");
    return;
  }
  if (file.size > MAX_BYTES) {
    toast.error("Image must be smaller than 10MB");
    return;
  }

  const { url: previewUrl, width, height } = await measure(file);
  const uploadId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `up-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  pendingFiles.set(uploadId, file);

  editor
    .chain()
    .focus()
    .insertContent({
      type: "uploadingImage",
      attrs: { uploadId, width, height, previewUrl, status: "uploading", name: file.name },
    })
    .run();

  await runUpload(editor, uploadId, file);
}

/** Removes transient placeholder nodes so they are never persisted. */
export function stripUploadingImages(json: unknown): unknown {
  if (Array.isArray(json)) return json.map(stripUploadingImages);
  if (json && typeof json === "object") {
    const node = json as { type?: string; content?: unknown[] };
    if (node.type === "uploadingImage") return null;
    const next: Record<string, unknown> = { ...(json as Record<string, unknown>) };
    if (Array.isArray(node.content)) {
      next.content = node.content.map(stripUploadingImages).filter((c) => c !== null);
    }
    return next;
  }
  return json;
}
