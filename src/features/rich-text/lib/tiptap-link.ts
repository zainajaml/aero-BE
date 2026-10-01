import Link from "@tiptap/extension-link";

/**
 * Link mark that never "bleeds" into text typed after it.
 * - inclusive: false -> the cursor at the end of a link is *outside* the mark,
 *   so newly typed characters are plain text.
 * - Space explicitly clears the link mark before inserting, so pressing space
 *   right after a link always ends the link formatting.
 */
export const AppLink = Link.extend({
  inclusive: false,

  addKeyboardShortcuts() {
    return {
      ...(this.parent?.() ?? {}),
      Space: () => {
        if (!this.editor.isActive(this.name)) return false;
        return this.editor
          .chain()
          .unsetMark(this.name, { extendEmptyMarkRange: false })
          .insertContent(" ")
          .run();
      },
    };
  },
});

/**
 * Gmail-style click behaviour for links in an editable editor:
 * - first click just places the caret (the link bubble appears)
 * - clicking again while the caret already sits in that link opens it
 */
export function editableLinkClickHandler(view: unknown, _pos: number, event: MouseEvent) {
  const target = (event.target as HTMLElement | null)?.closest("a");
  if (!target) return false;
  const editorView = view as {
    editable?: boolean;
    state: { selection: { from: number; to: number } };
  };
  if (editorView.editable === false) return false;

  const wasActive = target.dataset["linkArmed"] === "1";
  // Disarm every other link inside this editor.
  target
    .closest(".ProseMirror")
    ?.querySelectorAll<HTMLElement>("a[data-link-armed]")
    .forEach((el) => {
      if (el !== target) delete el.dataset["linkArmed"];
    });

  if (wasActive) {
    delete target.dataset["linkArmed"];
    const href = target.getAttribute("href");
    if (href) window.open(href, "_blank", "noopener,noreferrer");
    event.preventDefault();
    return true;
  }

  target.dataset["linkArmed"] = "1";
  event.preventDefault();
  return false;
}
