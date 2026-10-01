import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { Check, Copy, ExternalLink, Link2Off, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";

/**
 * Gmail-style link bubble: when the caret sits inside a link, a small floating
 * bar shows the URL with actions to open, copy, change or remove the link.
 */
export function LinkBubble({ editor }: { editor: Editor }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [href, setHref] = useState("");

  // Keep the displayed URL in sync with the caret position: without this the
  // bubble can render its actions before the href is known.
  useEffect(() => {
    const sync = () => {
      const next = (editor.getAttributes("link").href as string | undefined) ?? "";
      setHref((prev) => (prev === next ? prev : next));
      if (!editor.isActive("link")) setEditing(false);
    };
    sync();
    editor.on("transaction", sync);
    editor.on("selectionUpdate", sync);
    return () => {
      editor.off("transaction", sync);
      editor.off("selectionUpdate", sync);
    };
  }, [editor]);

  function apply() {
    const raw = value.trim();
    if (!raw) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
    setEditing(false);
  }

  function remove() {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setEditing(false);
  }

  function copy() {
    if (!href) return;
    navigator.clipboard
      .writeText(href)
      .then(() => toast.success("Link copied"))
      .catch(() => toast.error("Could not copy link"));
  }

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor: e }) => e.isEditable && e.isActive("link")}
      options={{ placement: "bottom-start", offset: 8, flip: true, shift: { padding: 8 } }}
      getReferencedVirtualElement={() => {
        // Keep the bubble inside the editor container and left-aligned with it.
        const dom = editor.view.dom as HTMLElement;
        const container = dom.getBoundingClientRect();
        const { from, to } = editor.state.selection;
        let top = container.top;
        let bottom = container.bottom;
        try {
          const start = editor.view.coordsAtPos(from);
          const end = editor.view.coordsAtPos(to);
          top = Math.min(start.top, end.top);
          bottom = Math.max(start.bottom, end.bottom);
        } catch {
          /* fall back to the container box */
        }
        const rect = {
          x: container.left,
          y: top,
          top,
          bottom,
          left: container.left,
          right: container.right,
          width: container.width,
          height: bottom - top,
        };
        return { getBoundingClientRect: () => rect as DOMRect };
      }}
      className="z-50 flex max-w-full items-center gap-1 rounded-lg border border-border/60 bg-popover p-1 shadow-lg"
    >
      {editing ? (
        <>
          <Input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                apply();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setEditing(false);
              }
            }}
            placeholder="https://example.com"
            className="h-7 w-56 text-xs"
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            title="Save"
            onClick={apply}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            title="Cancel"
            onClick={() => setEditing(false)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </>
      ) : (
        <>
          <a
            href={href || undefined}
            target="_blank"
            rel="noopener noreferrer"
            title={href}
            className="flex max-w-[220px] items-center gap-1 truncate px-2 text-xs text-primary underline underline-offset-2"
          >
            <ExternalLink className="h-3 w-3 shrink-0" />
            <span className="truncate">{href || "\u2026"}</span>
          </a>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            title="Copy link"
            onClick={copy}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            title="Change link"
            onClick={() => {
              setValue(href);
              setEditing(true);
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            title="Remove link"
            onClick={remove}
          >
            <Link2Off className="h-3.5 w-3.5" />
          </Button>
        </>
      )}
    </BubbleMenu>
  );
}
