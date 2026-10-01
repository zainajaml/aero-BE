import { useQuery } from "@tanstack/react-query";
import Mention from "@tiptap/extension-mention";
import { PluginKey } from "@tiptap/pm/state";
import { exitSuggestion } from "@tiptap/suggestion";
import type { ReactElement } from "react";
import { listDocumentTags } from "../api/rich-text.api";
import { cn } from "@/shared/lib/utils";
import { openDocumentViewer } from "../lib/document-viewer-bus";

export interface DocumentTag {
  id: string;
  title: string;
}

export const DOC_MENTION_CLASS =
  "rounded bg-primary/15 px-1 font-medium text-primary cursor-pointer";

/** All documents the current user can see, used for "#" tagging suggestions. */
export function useDocumentTags(projectId?: string | null) {
  return useQuery({
    queryKey: ["document-tags", projectId ?? "all"],
    staleTime: 60_000,
    queryFn: async (): Promise<DocumentTag[]> => {
      const tags = await listDocumentTags(projectId && projectId !== "all" ? projectId : undefined);
      return tags.map((d) => ({ id: d.id, title: d.title || "Untitled" }));
    },
  });
}

/** TipTap node for a document reference inserted with "#". */
export const DocMention = Mention.extend({ name: "docMention" });

/** Vanilla-DOM suggestion popup for "#" document tagging. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createDocSuggestion(docsRef: { current: DocumentTag[] }): any {
  const pluginKey = new PluginKey("docMentionSuggestion");

  return {
    char: "#",
    pluginKey,
    items: ({ query }: { query: string }) =>
      docsRef.current
        .filter((d) => d.title.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 8),
    render: () => {
      let popup: HTMLDivElement | null = null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let activeEditor: any = null;
      let removeDismissHandlers: (() => void) | null = null;
      let selectedIndex = 0;
      let items: DocumentTag[] = [];
      let command: ((attrs: { id: string; label: string }) => void) | null = null;

      const dismiss = () => {
        const view = activeEditor?.view;
        if (view) exitSuggestion(view, pluginKey);
      };

      // Dismiss on outside/editor clicks so a literal "#" does not trap the caret.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bindDismissHandlers = (props: any) => {
        removeDismissHandlers?.();
        activeEditor = props.editor;
        const ownerDocument = props.editor?.view?.dom?.ownerDocument ?? document;
        const onPointerDown = (event: PointerEvent) => {
          const target = event.target as Node | null;
          if (target && popup?.contains(target)) return;
          dismiss();
        };
        ownerDocument.addEventListener("pointerdown", onPointerDown, true);
        removeDismissHandlers = () => {
          ownerDocument.removeEventListener("pointerdown", onPointerDown, true);
        };
      };

      const pick = (index: number) => {
        const item = items[index];
        if (item && command) command({ id: item.id, label: item.title });
      };

      const draw = () => {
        if (!popup) return;
        popup.innerHTML = "";
        if (items.length === 0) {
          popup.style.display = "none";
          return;
        }
        popup.style.display = "block";
        items.forEach((d, i) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.textContent = d.title;
          btn.className = cn(
            "flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm truncate",
            i === selectedIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted",
          );
          btn.addEventListener("mousedown", (e) => {
            e.preventDefault();
            pick(i);
          });
          popup!.appendChild(btn);
        });
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const place = (props: any) => {
        if (!popup || !props.clientRect) return;
        const rect = props.clientRect();
        if (!rect) return;
        const { width, height } = popup.getBoundingClientRect();
        const margin = 8;
        const spaceBelow = window.innerHeight - rect.bottom - margin;
        const flipUp = spaceBelow < height && rect.top > spaceBelow;
        const maxH = Math.max(120, Math.floor((flipUp ? rect.top : spaceBelow) - margin));
        popup.style.maxHeight = `${Math.min(224, maxH)}px`;
        const left = Math.max(margin, Math.min(rect.left, window.innerWidth - width - margin));
        popup.style.left = `${left}px`;
        popup.style.top = flipUp
          ? `${Math.max(margin, rect.top - Math.min(height, maxH) - 4)}px`
          : `${rect.bottom + 4}px`;
      };

      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onStart: (props: any) => {
          items = props.items;
          command = props.command;
          selectedIndex = 0;
          activeEditor = props.editor;
          popup = document.createElement("div");
          popup.className =
            "fixed z-[100] max-h-56 w-72 overflow-auto rounded-lg border border-glass-border bg-popover p-1 shadow-lg pointer-events-auto";
          const stop = (e: Event) => e.stopPropagation();
          popup.addEventListener("pointerdown", stop);
          popup.addEventListener("mousedown", stop);
          document.body.appendChild(popup);
          bindDismissHandlers(props);
          draw();
          place(props);
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onUpdate: (props: any) => {
          items = props.items;
          command = props.command;
          activeEditor = props.editor;
          selectedIndex = 0;
          draw();
          place(props);
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onKeyDown: (props: any) => {
          if (props.event.key === "Escape") return true;
          if (items.length === 0) return false;
          if (props.event.key === "ArrowDown") {
            selectedIndex = (selectedIndex + 1) % items.length;
            draw();
            return true;
          }
          if (props.event.key === "ArrowUp") {
            selectedIndex = (selectedIndex - 1 + items.length) % items.length;
            draw();
            return true;
          }
          if (props.event.key === "Enter" || props.event.key === "Tab") {
            pick(selectedIndex);
            return true;
          }
          return false;
        },
        onExit: () => {
          removeDismissHandlers?.();
          removeDismissHandlers = null;
          popup?.remove();
          popup = null;
          activeEditor = null;
        },
      };
    },
  };
}

/** Attach a click handler that opens tagged documents in the preview modal. */
export function bindDocMentionClicks(dom: HTMLElement) {
  const handler = (e: MouseEvent) => {
    const el = (e.target as HTMLElement)?.closest?.(
      '[data-type="docMention"]',
    ) as HTMLElement | null;
    if (!el) return;
    const id = el.getAttribute("data-id");
    if (!id) return;
    e.preventDefault();
    e.stopPropagation();
    openDocumentViewer(id);
  };
  dom.addEventListener("click", handler);
  return () => dom.removeEventListener("click", handler);
}

// ---------- Plain-text document tags (work log notes) ----------

/** Storage token for a document tag inside a plain text field. */
const DOC_TAG_REGEX = /#\[([^\]]+)\]\(([0-9a-fA-F-]{36})\)/g;

export function formatDocTag(doc: DocumentTag) {
  return `#[${doc.title}](${doc.id})`;
}

/** Render plain text, turning `#[Title](id)` tokens into clickable chips. */
export function renderTextWithDocTags(text: string): Array<string | ReactElement> {
  const out: Array<string | ReactElement> = [];
  let last = 0;
  let key = 0;
  let match: RegExpExecArray | null;
  DOC_TAG_REGEX.lastIndex = 0;
  while ((match = DOC_TAG_REGEX.exec(text)) !== null) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const [, title, id] = match;
    out.push(
      <button
        key={`doc-${key++}`}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          openDocumentViewer(id);
        }}
        className={DOC_MENTION_CLASS}
      >
        #{title}
      </button>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
