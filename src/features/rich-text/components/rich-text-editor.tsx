import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { CTA_BUTTON } from "@/shared/lib/cta";
import StarterKit from "@tiptap/starter-kit";
import { AppLink, editableLinkClickHandler } from "../lib/tiptap-link";
import { LinkBubble } from "./link-bubble";
import Placeholder from "@tiptap/extension-placeholder";
import { LoadingImage } from "../lib/tiptap-loading-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Youtube from "@tiptap/extension-youtube";
import TextAlign from "@tiptap/extension-text-align";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Minus,
  ImageIcon,
  Table as TableIcon,
  Columns3,
  Rows3,
  Trash2,
  Loader2,
  CheckSquare,
  Youtube as YoutubeIcon,
  Link as LinkIcon,
  Paperclip,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Omega,
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
import {
  resolveDocumentImagesForDisplay,
  normalizeDocumentImagesForStorage,
} from "../lib/document-images";
import {
  UploadingImage,
  insertUploadingImage,
  stripUploadingImages,
} from "../lib/tiptap-upload-image";
import {
  DocMention,
  DOC_MENTION_CLASS,
  createDocSuggestion,
  useDocumentTags,
  bindDocMentionClicks,
  type DocumentTag,
} from "./document-tags";
import Mention from "@tiptap/extension-mention";
import { MENTION_CLASS, createMentionSuggestion, type MentionMember } from "../lib/user-mentions";

interface RichTextEditorProps {
  content: unknown;
  editable?: boolean;
  onChange?: (json: unknown) => void;
  /** Reports the editor's normalized initial content without treating it as a user edit. */
  onContentReady?: (json: unknown) => void;
  /** Hide advanced formatting (italic, strike, code, headings, quote, divider). */
  compact?: boolean;
  className?: string;
  onAttach?: () => void;
  /** Shows an uploading state on the attach button while files are being uploaded. */
  attaching?: boolean;
  /** Called when a user clicks an inline image. Single-click in read-only mode, double-click while editing. */
  onImageClick?: (src: string) => void;
  /** Scopes "#" document tagging suggestions to a project. */
  projectId?: string | null;
  /** People who can be tagged with "@" — pass the current project's members only. */
  members?: MentionMember[];
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn("h-8 w-8", active && "bg-accent text-accent-foreground")}
    >
      {children}
    </Button>
  );
}

const SYMBOL_CATEGORIES = [
  { label: "Arrows", symbols: ["→", "←", "↑", "↓", "↔", "↕", "⇒", "⇐", "⇑", "⇓"] },
  { label: "Bullets", symbols: ["•", "◦", "▪", "▫", "★", "☆", "✓", "✗", "✔", "✘"] },
  { label: "Math", symbols: ["≈", "≠", "≤", "≥", "±", "×", "÷", "∞", "∑", "√"] },
  { label: "Currency", symbols: ["€", "£", "¥", "¢", "₹", "₽", "₩", "A$", "US$", "C$"] },
  { label: "Marks", symbols: ["©", "®", "™", "℠", "§", "¶", "†", "‡", "#", "@"] },
  { label: "Dashes", symbols: ["–", "—", "…", "‹", "›", "«", "»", "‘", "’", "“", "”"] },
];

function SymbolsMenu({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Insert symbol"
          title="Insert symbol"
          className="h-8 w-8"
        >
          <Omega className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-72 w-56 overflow-y-auto p-2">
        {SYMBOL_CATEGORIES.map((category) => (
          <div key={category.label} className="mb-3 last:mb-0">
            <div className="px-1 pb-1 text-xs font-medium text-muted-foreground">
              {category.label}
            </div>
            <div className="grid grid-cols-5 gap-1">
              {category.symbols.map((symbol) => (
                <button
                  key={symbol}
                  type="button"
                  onClick={() => {
                    editor.chain().focus().insertContent(symbol).run();
                    setOpen(false);
                  }}
                  className="flex h-8 items-center justify-center rounded-md text-sm hover:bg-accent hover:text-accent-foreground"
                  title={`Insert ${symbol}`}
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Toolbar({
  editor,
  compact,
  onAttach,
  attaching,
}: {
  editor: Editor;
  compact?: boolean;
  onAttach?: () => void;
  attaching?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [urlDialog, setUrlDialog] = useState<null | "link" | "youtube">(null);
  const [urlValue, setUrlValue] = useState("");
  const [, forceTick] = useState(0);
  useEffect(() => {
    if (!editor) return;
    const update = () => forceTick((t) => t + 1);
    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    editor.on("focus", update);
    editor.on("blur", update);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
      editor.off("focus", update);
      editor.off("blur", update);
    };
  }, [editor]);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    await insertUploadingImage(editor, file);
    setUploading(false);
  }

  function addYoutube() {
    setUrlValue("");
    setUrlDialog("youtube");
  }

  function setLink() {
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

  const inTable = editor.isActive("table");

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 rounded-xl border border-border/60 bg-card/70 p-1 backdrop-blur">
      {urlDialogNode}
      <div className="flex flex-wrap items-center gap-0.5">
        <ToolbarButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        {!compact && (
          <ToolbarButton
            label="Italic"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
        )}
        {!compact && (
          <ToolbarButton
            label="Strikethrough"
            active={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
        )}
        <ToolbarButton
          label="Inline code"
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>
        {!compact && (
          <>
            <div className="mx-1 h-5 w-px bg-border/60" />
            <ToolbarButton
              label="Heading 1"
              active={editor.isActive("heading", { level: 1 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            >
              <Heading1 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              label="Heading 2"
              active={editor.isActive("heading", { level: 2 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              <Heading2 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              label="Heading 3"
              active={editor.isActive("heading", { level: 3 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            >
              <Heading3 className="h-4 w-4" />
            </ToolbarButton>
          </>
        )}
        <div className="mx-1 h-5 w-px bg-border/60" />

        <ToolbarButton
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Task list"
          active={editor.isActive("taskList")}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          <CheckSquare className="h-4 w-4" />
        </ToolbarButton>
        {!compact && (
          <>
            <ToolbarButton
              label="Quote"
              active={editor.isActive("blockquote")}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
              <Quote className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              label="Divider"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
            >
              <Minus className="h-4 w-4" />
            </ToolbarButton>
          </>
        )}
        <div className="mx-1 h-5 w-px bg-border/60" />
        <ToolbarButton
          label="Align left"
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Align center"
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Align right"
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Justify"
          active={editor.isActive({ textAlign: "justify" })}
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        >
          <AlignJustify className="h-4 w-4" />
        </ToolbarButton>
        <SymbolsMenu editor={editor} />
        <div className="mx-1 h-5 w-px bg-border/60" />
        {/* Image upload */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPickFile}
        />
        <ToolbarButton
          label="Insert image"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
        </ToolbarButton>
        {/* YouTube embed */}
        <ToolbarButton label="Embed YouTube video" onClick={addYoutube}>
          <YoutubeIcon className="h-4 w-4" />
        </ToolbarButton>
        {/* Link */}
        <ToolbarButton label="Add link" active={editor.isActive("link")} onClick={setLink}>
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>

        {/* Table menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Table"
              title="Table"
              className={cn("h-8 w-8", inTable && "bg-accent text-accent-foreground")}
            >
              <TableIcon className="h-4 w-4" />
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
        <div className="mx-1 h-5 w-px bg-border/60" />
        <ToolbarButton
          label="Undo"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>
      </div>
      {onAttach && (
        <div className="ml-auto flex items-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={onAttach}
            disabled={attaching}
          >
            {attaching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
            {attaching ? "Uploading…" : "Attach file"}
          </Button>
        </div>
      )}
    </div>
  );
}

export function RichTextEditor({
  content,
  editable = true,
  onChange,
  onContentReady,
  compact,
  className,
  onAttach,
  attaching,
  onImageClick,
  projectId,
  members = [],
}: RichTextEditorProps) {
  // Tracks the last content we emitted (in stored/sentinel form) so the sync
  // effect can ignore echoes of our own edits and avoid cursor jumps.
  const lastEmittedRef = useRef<string | null>(null);
  const onContentReadyRef = useRef(onContentReady);
  onContentReadyRef.current = onContentReady;
  const { data: docTags = [] } = useDocumentTags(projectId);
  const docTagsRef = useRef<DocumentTag[]>(docTags);
  docTagsRef.current = docTags;
  const docSuggestion = useMemo(() => createDocSuggestion(docTagsRef), []);
  const membersRef = useRef<MentionMember[]>(members);
  membersRef.current = members;
  const mentionSuggestion = useMemo(() => createMentionSuggestion(membersRef), []);
  const editor = useEditor({
    immediatelyRender: false,
    editable,
    extensions: [
      StarterKit.configure({ link: false }),
      AppLink.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-2 cursor-pointer",
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Placeholder.configure({ placeholder: "Start writing your page…" }),
      UploadingImage,
      LoadingImage.configure({ inline: false, HTMLAttributes: { class: "cursor-pointer" } }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
      Youtube.configure({ controls: true, nocookie: true, modestBranding: true }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
      }),
      DocMention.configure({
        HTMLAttributes: { class: DOC_MENTION_CLASS },
        deleteTriggerWithBackspace: true,
        suggestion: docSuggestion,
      }),
      Mention.configure({
        HTMLAttributes: { class: MENTION_CLASS },
        deleteTriggerWithBackspace: true,
        suggestion: mentionSuggestion,
      }),
    ],

    content: "",
    onUpdate: ({ editor }) => {
      // Loading and extension normalization can change the editor document
      // without any user interaction. Only a focused editor may mark the
      // document draft as changed.
      if (!editor.isFocused) return;
      const normalized = normalizeDocumentImagesForStorage(stripUploadingImages(editor.getJSON()));
      lastEmittedRef.current = JSON.stringify(normalized);
      onChange?.(normalized);
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose dark:prose-invert max-w-none leading-[1.3] focus:outline-none py-4 text-foreground",
          compact ? "min-h-[160px]" : "min-h-[300px]",
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

  // Sync external content changes (e.g. switching pages). Document images are
  // stored as stable paths, so resolve them into fresh signed URLs for display.
  useEffect(() => {
    if (!editor) return;
    const incoming = JSON.stringify(content ?? "");
    if (incoming === lastEmittedRef.current) return; // echo of our own edit
    let cancelled = false;
    (async () => {
      const resolved = await resolveDocumentImagesForDisplay(content ?? "");
      if (cancelled || editor.isDestroyed) return;
      lastEmittedRef.current = incoming;
      // Loading content must not become an undo step, otherwise the first
      // undo wipes the whole document.
      editor
        .chain()
        .setMeta("addToHistory", false)
        .setContent((resolved as object) ?? "", { emitUpdate: false })
        .run();
      onContentReadyRef.current?.(normalizeDocumentImagesForStorage(editor.getJSON()));
    })();
    return () => {
      cancelled = true;
    };
     
  }, [content, editor]);

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editable, editor]);

  // Open inline images in a modal preview. Single-click when read-only, double-click
  // when editable so normal image selection still works while editing.
  useEffect(() => {
    if (!editor || !onImageClick) return;
    const dom = editor.view.dom as HTMLElement;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== "IMG") return;
      if (editable && e.detail !== 2) return;
      e.preventDefault();
      e.stopPropagation();
      const src = target.getAttribute("src");
      if (src) onImageClick(src);
    };
    dom.addEventListener("click", handler);
    return () => dom.removeEventListener("click", handler);
  }, [editor, editable, onImageClick]);

  // Clicking a "#" document tag opens the shared document preview modal.
  useEffect(() => {
    if (!editor) return;
    return bindDocMentionClicks(editor.view.dom as HTMLElement);
  }, [editor]);

  if (!editor) return null;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {editable && (
        <Toolbar editor={editor} compact={compact} onAttach={onAttach} attaching={attaching} />
      )}
      {editable && <LinkBubble editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
