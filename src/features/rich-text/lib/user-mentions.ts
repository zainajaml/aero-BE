import { cn } from "@/shared/lib/utils";
import type { MentionMember } from "../components/mention-textarea";
import { PluginKey } from "@tiptap/pm/state";
import { exitSuggestion } from "@tiptap/suggestion";

export type { MentionMember };

export const MENTION_CLASS = "rounded bg-accent/40 px-1 font-medium text-foreground";

/** Build a vanilla-DOM "@" mention suggestion popup driven by a live members ref. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createMentionSuggestion(membersRef: { current: MentionMember[] }): any {
  const pluginKey = new PluginKey("userMentionSuggestion");

  return {
    char: "@",
    pluginKey,
    items: ({ query }: { query: string }) =>
      membersRef.current
        .filter((m) => m.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 6),
    render: () => {
      let popup: HTMLDivElement | null = null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let activeEditor: any = null;
      let removeDismissHandlers: (() => void) | null = null;
      let selectedIndex = 0;
      let items: MentionMember[] = [];
      let command: ((attrs: { id: string; label: string }) => void) | null = null;

      const dismiss = () => {
        const view = activeEditor?.view;
        if (view) exitSuggestion(view, pluginKey);
      };

      // Jira-style behavior: once the suggestion is open, any click outside the
      // suggestion list dismisses it, including clicking elsewhere in the editor.
      // That lets users place the caret after a literal "@" and keep typing.
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

      const draw = () => {
        if (!popup) return;
        popup.innerHTML = "";
        if (items.length === 0) {
          popup.style.display = "none";
          return;
        }
        popup.style.display = "block";
        items.forEach((m, i) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.textContent = m.name;
          btn.className = cn(
            "flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm",
            i === selectedIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted",
          );
          btn.addEventListener("mousedown", (e) => {
            e.preventDefault();
            pick(i);
          });
          popup!.appendChild(btn);
        });
      };

      const pick = (index: number) => {
        const item = items[index];
        if (item && command) command({ id: item.user_id, label: item.name });
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const place = (props: any) => {
        if (!popup || !props.clientRect) return;
        const rect = props.clientRect();
        if (!rect) return;
        // Measure after draw so flipping uses the real popup height.
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
            "fixed z-[100] max-h-56 w-64 overflow-auto rounded-lg border border-glass-border bg-popover p-1 shadow-lg pointer-events-auto";
          popup.style.pointerEvents = "auto";
          // Prevent Radix dialog/popover dismiss handlers from treating clicks
          // inside this body-portaled popup as "outside" interactions.
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
