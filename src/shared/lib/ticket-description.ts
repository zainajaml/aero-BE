// Helpers for converting between the stored `tickets.description_json` shape and
// the TipTap editor content used by the rich text editor.
//
// Historically descriptions were stored as plain text in `{ text: string }`.
// Rich descriptions are stored as a full TipTap document (`{ type: "doc", ... }`).
// These helpers keep both forms working seamlessly.

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] } as const;

function plainTextToDoc(text: string): unknown {
  const paragraphs = text.split(/\n/).map((line) => ({
    type: "paragraph",
    content: line ? [{ type: "text", text: line }] : [],
  }));
  return {
    type: "doc",
    content: paragraphs.length ? paragraphs : [{ type: "paragraph" }],
  };
}

/** Convert a stored `description_json` value into TipTap editor content. */
export function descriptionToEditorContent(json: unknown): unknown {
  if (!json || typeof json !== "object") return EMPTY_DOC;
  const obj = json as Record<string, unknown>;
  if (typeof obj.text === "string") return plainTextToDoc(obj.text);
  if (obj.type === "doc") return json;
  return EMPTY_DOC;
}

/** Returns true when the editor content (or legacy shape) has meaningful content. */
export function descriptionHasContent(json: unknown): boolean {
  if (!json || typeof json !== "object") return false;
  const obj = json as Record<string, unknown>;
  if (typeof obj.text === "string") return obj.text.trim().length > 0;

  const mediaTypes = new Set(["image", "table", "horizontalRule", "youtube"]);
  let found = false;
  const walk = (node: unknown): void => {
    if (found) return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (node && typeof node === "object") {
      const n = node as Record<string, unknown>;
      if (typeof n.text === "string" && n.text.trim()) {
        found = true;
        return;
      }
      if (typeof n.type === "string" && mediaTypes.has(n.type)) {
        found = true;
        return;
      }
      if (Array.isArray(n.content)) walk(n.content);
    }
  };
  walk((obj as { content?: unknown }).content ?? obj);
  return found;
}
