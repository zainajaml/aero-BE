import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { CTA_BUTTON } from "@/shared/lib/cta";
import StarterKit from "@tiptap/starter-kit";
import { AppLink, editableLinkClickHandler } from "../lib/tiptap-link";
import { LinkBubble } from "./link-bubble";
import Placeholder from "@tiptap/extension-placeholder";
import Mention from "@tiptap/extension-mention";
import { LoadingImage } from "../lib/tiptap-loading-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Youtube from "@tiptap/extension-youtube";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bold,
  List,
  ListOrdered,
  Code,
  Link as LinkIcon,
  CheckSquare,
  ImageIcon,
  Youtube as YoutubeIcon,
  Table as TableIcon,
  Columns3,
  Rows3,
  Trash2,
  Loader2,
  Undo,
  Redo,
  Paperclip,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { resolveDocumentImagesForDisplay } from "../lib/document-images";
import { UploadingImage, insertUploadingImage } from "../lib/tiptap-upload-image";
import type { MentionMember } from "./mention-textarea";
import {
  DocMention,
  DOC_MENTION_CLASS,
  createDocSuggestion,
  useDocumentTags,
  bindDocMentionClicks,
  type DocumentTag,
} from "./document-tags";

import { MENTION_CLASS, createMentionSuggestion } from "../lib/user-mentions";

const LINK_CLASS = "text-primary underline underline-offset-2 cursor-pointer";

function editableExtensions(
  membersRef: { current: MentionMember[] },
  placeholder: string,
  docsRef: { current: DocumentTag[] },
) {
  return [
    StarterKit.configure({ link: false }),
    AppLink.configure({
      openOnClick: false,
      autolink: true,
      linkOnPaste: true,
      HTMLAttributes: { class: LINK_CLASS, rel: "noopener noreferrer", target: "_blank" },
    }),
    Placeholder.configure({ placeholder }),
    Mention.configure({
      HTMLAttributes: { class: MENTION_CLASS },
      deleteTriggerWithBackspace: true,
      suggestion: createMentionSuggestion(membersRef),
    }),
    UploadingImage,
    LoadingImage.configure({ inline: false, HTMLAttributes: { class: "cursor-pointer" } }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    TaskList,
    TaskItem.configure({ nested: true }),
    Youtube.configure({ controls: true, nocookie: true, modestBranding: true }),
    DocMention.configure({
      HTMLAttributes: { class: DOC_MENTION_CLASS },
      deleteTriggerWithBackspace: true,
      suggestion: createDocSuggestion(docsRef),
    }),
  ];
}

function readonlyExtensions() {
  return [
    StarterKit.configure({
      link: {
        openOnClick: true,
        HTMLAttributes: { class: LINK_CLASS, rel: "noopener noreferrer", target: "_blank" },
      },
    }),
    Mention.configure({ HTMLAttributes: { class: MENTION_CLASS } }),
    DocMention.configure({ HTMLAttributes: { class: DOC_MENTION_CLASS } }),
    LoadingImage.configure({ inline: false, HTMLAttributes: { class: "cursor-pointer" } }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    TaskList,
    TaskItem.configure({ nested: true }),
    Youtube.configure({ controls: true, nocookie: true, modestBranding: true }),
  ];
}

interface CommentEditorProps {
  onChange: (doc: unknown) => void;
  members: MentionMember[];
  placeholder?: string;
  className?: string;
  editorClassName?: string;
  initialContent?: unknown;
  autoFocus?: boolean;
  /** Scopes "#" document tagging suggestions to a project. */
  projectId?: string | null;
  onAttach?: () => void;
  /** Shows an uploading state on the attach button while files are being uploaded. */
  attaching?: boolean;
  /** Hide the formatting toolbar for a plain, minimal input. */
  minimal?: boolean;
}

function Toolbar({
  editor,
  onAttach,
  attaching,
}: {
  editor: Editor;
  onAttach?: () => void;
  attaching?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [urlDialog, setUrlDialog] = useState<null | "link" | "youtube">(null);
  const [urlValue, setUrlValue] = useState("");

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    await insertUploadingImage(editor, file);
    setUploading(false);
  }

  function openYoutubeDialog() {
    setUrlValue("");
    setUrlDialog("youtube");
  }

  function openLinkDialog() {
    const previous = editor.getAttributes("link").href as string | undefined;
    setUrlValue(previous ?? "");
    setUrlDialog("link");
  }

  function submitUrl() {
    const raw = urlValue.trim();
    if (urlDialog === "youtube") {
      if (raw) editor.commands.setYoutubeVideo({ src: raw, width: 640, height: 360 });
    } else if (urlDialog === "link") {
      if (!raw) {
        editor.chain().focus().extendMarkRange("link").unsetLink().run();
      } else {
        const href = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
        editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
      }
    }
    setUrlDialog(null);
    setUrlValue("");
  }

  const urlDialogNode = (
    <Dialog open={urlDialog !== null} onOpenChange={(o) => !o && setUrlDialog(null)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">
            {urlDialog === "youtube" ? "Embed YouTube video" : "Add link"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">URL</label>
          <Input
            autoFocus
            value={urlValue}
            placeholder={
              urlDialog === "youtube" ? "https://youtube.com/watch?v=…" : "https://example.com"
            }
            onChange={(e) => setUrlValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitUrl();
              }
            }}
          />
          {urlDialog === "link" && (
            <p className="text-xs text-muted-foreground">Leave empty to remove the link.</p>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => setUrlDialog(null)}
          >
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={submitUrl} className={CTA_BUTTON}>
            {urlDialog === "youtube" ? "Embed" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // TipTap v3 doesn't re-render on every transaction, so toolbar active/disabled
  // state can go stale (e.g. table controls staying disabled after deleting a row).
  const [, forceRender] = useState(0);
  useEffect(() => {
    const update = () => forceRender((n) => n + 1);
    editor.on("transaction", update);
    editor.on("selectionUpdate", update);
    return () => {
      editor.off("transaction", update);
      editor.off("selectionUpdate", update);
    };
  }, [editor]);

  const inTable =
    editor.isActive("table") ||
    editor.can().chain().focus().addRowAfter().run() ||
    editor.can().chain().focus().addColumnAfter().run();

  const btn = (
    active: boolean,
    onClick: () => void,
    label: string,
    icon: React.ReactNode,
    disabled?: boolean,
  ) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn("h-7 w-7", active && "bg-accent text-accent-foreground")}
    >
      {icon}
    </Button>
  );
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border/50 px-1 py-1">
      {urlDialogNode}
      <div className="flex flex-wrap items-center gap-0.5">
        {btn(
          editor.isActive("bold"),
          () => editor.chain().focus().toggleBold().run(),
          "Bold",
          <Bold className="h-3.5 w-3.5" />,
        )}
        {btn(
          editor.isActive("code"),
          () => editor.chain().focus().toggleCode().run(),
          "Inline code",
          <Code className="h-3.5 w-3.5" />,
        )}
        <div className="mx-1 h-4 w-px bg-border/60" />
        {btn(
          editor.isActive("bulletList"),
          () => editor.chain().focus().toggleBulletList().run(),
          "Bullet list",
          <List className="h-3.5 w-3.5" />,
        )}
        {btn(
          editor.isActive("orderedList"),
          () => editor.chain().focus().toggleOrderedList().run(),
          "Numbered list",
          <ListOrdered className="h-3.5 w-3.5" />,
        )}
        {btn(
          editor.isActive("taskList"),
          () => editor.chain().focus().toggleTaskList().run(),
          "Task list",
          <CheckSquare className="h-3.5 w-3.5" />,
        )}
        <div className="mx-1 h-4 w-px bg-border/60" />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPickFile}
        />
        {btn(
          false,
          () => fileRef.current?.click(),
          "Insert image",
          uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ImageIcon className="h-3.5 w-3.5" />
          ),
          uploading,
        )}
        {btn(
          false,
          openYoutubeDialog,
          "Embed YouTube video",
          <YoutubeIcon className="h-3.5 w-3.5" />,
        )}
        {btn(
          editor.isActive("link"),
          openLinkDialog,
          "Add link",
          <LinkIcon className="h-3.5 w-3.5" />,
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Table"
              title="Table"
              className={cn("h-7 w-7", inTable && "bg-accent text-accent-foreground")}
            >
              <TableIcon className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuItem
              onClick={() =>
                editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
              }
            >
              <TableIcon className="h-4 w-4" />
              Insert table
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={!inTable}
              onClick={() => editor.chain().focus().addColumnAfter().run()}
            >
              <Columns3 className="h-4 w-4" />
              Add column
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!inTable}
              onClick={() => editor.chain().focus().deleteColumn().run()}
            >
              <Columns3 className="h-4 w-4" />
              Delete column
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!inTable}
              onClick={() => editor.chain().focus().addRowAfter().run()}
            >
              <Rows3 className="h-4 w-4" />
              Add row
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!inTable}
              onClick={() => editor.chain().focus().deleteRow().run()}
            >
              <Rows3 className="h-4 w-4" />
              Delete row
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!inTable}
              onClick={() => editor.chain().focus().toggleHeaderRow().run()}
            >
              <TableIcon className="h-4 w-4" />
              Toggle header row
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={!inTable}
              className="text-destructive"
              onClick={() => editor.chain().focus().deleteTable().run()}
            >
              <Trash2 className="h-4 w-4" />
              Delete table
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="mx-1 h-4 w-px bg-border/60" />
        {btn(
          false,
          () => editor.chain().focus().undo().run(),
          "Undo",
          <Undo className="h-3.5 w-3.5" />,
          !editor.can().undo(),
        )}
        {btn(
          false,
          () => editor.chain().focus().redo().run(),
          "Redo",
          <Redo className="h-3.5 w-3.5" />,
          !editor.can().redo(),
        )}
      </div>
      {onAttach && (
        <div className="ml-auto flex items-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 text-[var(--tk-muted)] hover:text-[var(--tk-text)]"
            onClick={onAttach}
            disabled={attaching}
          >
            {attaching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Paperclip className="h-3.5 w-3.5" />
            )}
            {attaching ? "Uploading…" : "Attach"}
          </Button>
        </div>
      )}
    </div>
  );
}

export function CommentEditor({
  onChange,
  members,
  placeholder = "Write a comment… use @ to mention",
  className,
  editorClassName,
  initialContent,
  autoFocus,
  onAttach,
  attaching,
  projectId,
  minimal = false,
}: CommentEditorProps) {
  const membersRef = useRef(members);
  membersRef.current = members;
  const { data: docTags = [] } = useDocumentTags(projectId);
  const docsRef = useRef<DocumentTag[]>(docTags);
  docsRef.current = docTags;
  // Stable extensions (suggestion reads the live ref), built once per mount.
  const extensions = useMemo(
    () => editableExtensions(membersRef, placeholder, docsRef),
    [placeholder],
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content: (initialContent as object) ?? "",
    autofocus: autoFocus ? "end" : false,
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none px-3 py-2 text-sm text-foreground",
          editorClassName,
        ),
      },
      handleClick: editableLinkClickHandler,
      handlePaste: (_view, event) => {
        const file = event.clipboardData?.files?.[0];
        if (file && file.type.startsWith("image/") && editor?.isEditable) {
          event.preventDefault();
          void insertUploadingImage(editor, file);
          return true;
        }
        return false;
      },
      handleDrop: (_view, event) => {
        const file = (event as DragEvent).dataTransfer?.files?.[0];
        if (file && file.type.startsWith("image/") && editor?.isEditable) {
          event.preventDefault();
          void insertUploadingImage(editor, file);
          return true;
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    return bindDocMentionClicks(editor.view.dom as HTMLElement);
  }, [editor]);

  // Stored image srcs are stable storage paths (or expired signed URLs); re-sign
  // them once on mount so they render instead of showing as broken tiny images.
  useEffect(() => {
    if (!editor || !initialContent) return;
    let cancelled = false;
    void (async () => {
      const resolved = await resolveDocumentImagesForDisplay(initialContent);
      if (cancelled || editor.isDestroyed || resolved === initialContent) return;
      const { from, to } = editor.state.selection;
      // Re-signing image URLs must not create an undo step, otherwise undo
      // wipes the entire description/comment.
      editor
        .chain()
        .setMeta("addToHistory", false)
        .setContent((resolved as object) ?? "", { emitUpdate: false })
        .run();
      try {
        editor.commands.setTextSelection({ from, to });
      } catch {
        /* selection may no longer be valid */
      }
    })();
    return () => {
      cancelled = true;
    };
    // Intentionally runs only for the content the editor mounted with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  if (!editor) return null;

  return (
    <div className={cn("flex flex-col rounded-md border border-input bg-transparent", className)}>
      {!minimal && <Toolbar editor={editor} onAttach={onAttach} attaching={attaching} />}
      <LinkBubble editor={editor} />
      <div className="tk-scroll h-auto min-h-0 overflow-hidden">
        <EditorContent editor={editor} className="max-h-[180px] overflow-y-auto" />
      </div>
    </div>
  );
}

interface CommentContentProps {
  doc: unknown;
  /** Called when a user clicks an inline image in the read-only comment. */
  onImageClick?: (src: string) => void;
}

/** Read-only renderer for a stored rich comment document. */
export function CommentContent({ doc, onImageClick }: CommentContentProps) {
  const editor = useEditor({
    immediatelyRender: false,
    editable: false,
    extensions: readonlyExtensions(),
    content: (doc as object) ?? "",
  });

  // Private bucket images are stored as stable paths (or stale signed URLs);
  // re-sign them before rendering so they don't show as broken images.
  useEffect(() => {
    if (!editor) return;
    let cancelled = false;
    void (async () => {
      const resolved = await resolveDocumentImagesForDisplay(doc ?? "");
      if (!cancelled) {
        editor
          .chain()
          .setMeta("addToHistory", false)
          .setContent((resolved as object) ?? "")
          .run();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [doc, editor]);

  useEffect(() => {
    if (!editor || !onImageClick) return;
    const dom = editor.view.dom as HTMLElement;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== "IMG") return;
      e.preventDefault();
      e.stopPropagation();
      const src = target.getAttribute("src");
      if (src) onImageClick(src);
    };
    dom.addEventListener("click", handler);
    return () => dom.removeEventListener("click", handler);
  }, [editor, onImageClick]);

  useEffect(() => {
    if (!editor) return;
    return bindDocMentionClicks(editor.view.dom as HTMLElement);
  }, [editor]);

  if (!editor) return null;
  return (
    <EditorContent
      editor={editor}
      className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed"
    />
  );
}

// ---------- Helpers for storage, mentions and email previews ----------

type Node = { type?: string; text?: string; attrs?: Record<string, unknown>; content?: Node[] };

function walk(node: unknown, visit: (n: Node) => void) {
  if (Array.isArray(node)) {
    node.forEach((c) => walk(c, visit));
    return;
  }
  if (node && typeof node === "object") {
    const n = node as Node;
    visit(n);
    if (Array.isArray(n.content)) n.content.forEach((c) => walk(c, visit));
  }
}

const MEDIA_NODE_TYPES = new Set([
  "image",
  "table",
  "youtube",
  "horizontalRule",
  "taskList",
  "codeBlock",
]);

/** True when a comment doc has any text, mention, or media content. */
export function commentDocHasContent(doc: unknown): boolean {
  let found = false;
  walk(doc, (n) => {
    if (found) return;
    if (n.type === "mention" || n.type === "docMention") found = true;
    else if (typeof n.type === "string" && MEDIA_NODE_TYPES.has(n.type)) found = true;
    else if (typeof n.text === "string" && n.text.trim()) found = true;
  });
  return found;
}

const RICH_PREFIX = "";

/** Serialize a comment doc for storage in the text `body` column. */
export function serializeCommentDoc(doc: unknown): string {
  return RICH_PREFIX + JSON.stringify(doc);
}

export type ParsedComment = { kind: "rich"; doc: unknown } | { kind: "legacy"; text: string };

/** Detect whether a stored body is a rich TipTap doc or legacy plain text. */
export function parseStoredComment(body: string): ParsedComment {
  const trimmed = body.trimStart();
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(body);
      if (parsed && typeof parsed === "object" && parsed.type === "doc") {
        return { kind: "rich", doc: parsed };
      }
    } catch {
      // fall through to legacy
    }
  }
  return { kind: "legacy", text: body };
}
