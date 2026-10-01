import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { CTA_BUTTON } from "@/shared/lib/cta";
import { cn } from "@/shared/lib/utils";
import {
  CommentContent,
  CommentEditor,
  commentDocHasContent,
  parseStoredComment,
} from "@/features/rich-text/components/comment-editor";
import type { SupportMessage } from "../api/support.api";
import { useEditSupportMessage } from "../hooks/use-support-mutations";
import { fmtTime } from "../lib/support-format";
import { SupportAvatar } from "./support-avatar";
import type { SupportLightboxItem } from "./support-lightbox";
import { SupportMessageAttachment } from "./support-message-attachment";

function toEditableDoc(body: string): unknown {
  const parsed = parseStoredComment(body);
  if (parsed.kind === "rich") return parsed.doc;
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        ...(parsed.text ? { content: [{ type: "text", text: parsed.text }] } : {}),
      },
    ],
  };
}

/** One message bubble in a ticket thread, with inline editing for the author while it's open. */
export function SupportMessageItem({
  issueId,
  message: m,
  mine,
  editing,
  onEditingChange,
  onOpenMedia,
}: {
  issueId: string;
  message: SupportMessage;
  mine: boolean;
  /** Only one message is edited at a time; the thread owns which one. */
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
  onOpenMedia: (item: SupportLightboxItem) => void;
}) {
  const setEditing = onEditingChange;
  const [editDoc, setEditDoc] = useState<unknown>(null);
  const editMessage = useEditSupportMessage(issueId, () => {
    setEditing(false);
    setEditDoc(null);
  });

  const parsed = parseStoredComment(m.body);
  const name = mine ? "You" : m.author.name;
  const avatar = (
    <SupportAvatar
      id={m.authorId}
      name={name}
      avatarPath={m.author.avatarUrl}
      className="h-6 w-6"
    />
  );

  return (
    <div className={cn("flex flex-col gap-1.5", mine ? "items-end" : "items-start")}>
      <div className="flex items-center gap-2 px-1 text-xs">
        {mine ? (
          <>
            <span className="text-muted-foreground">{fmtTime(m.createdAt)}</span>
            <span className={cn("font-semibold", "text-primary")}>{name}</span>
            {avatar}
          </>
        ) : (
          <>
            {avatar}
            <span className="font-semibold text-foreground">{name}</span>
            <span className="text-muted-foreground">{fmtTime(m.createdAt)}</span>
          </>
        )}
        {m.editedAt && <span className="italic text-muted-foreground">(edited)</span>}
        {m.canEdit && !editing && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Edit message"
            title="Edit message"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setEditing(true);
              setEditDoc(toEditableDoc(m.body));
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      {editing ? (
        <div
          className={cn("flex w-full max-w-[85%] flex-col gap-2", mine ? "self-end" : "self-start")}
        >
          <CommentEditor
            members={[]}
            initialContent={editDoc}
            placeholder="Edit your message…"
            onChange={setEditDoc}
            className="rounded-2xl border-border/70 bg-background/40"
            editorClassName="min-h-0"
            minimal
          />
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full"
              onClick={() => {
                setEditing(false);
                setEditDoc(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className={CTA_BUTTON}
              disabled={
                editMessage.isPending || (!commentDocHasContent(editDoc) && !m.attachmentKey)
              }
              onClick={() =>
                editMessage.mutate({ id: m.id, doc: editDoc ?? { type: "doc", content: [] } })
              }
            >
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "flex max-w-[85%] flex-col gap-2 rounded-2xl px-4 py-2.5 text-sm",
            "bg-muted text-foreground dark:bg-secondary dark:text-secondary-foreground",
            mine ? "self-end" : "self-start",
          )}
        >
          {m.attachmentKey && (
            <SupportMessageAttachment attachmentKey={m.attachmentKey} onOpen={onOpenMedia} />
          )}
          {parsed.kind === "rich"
            ? commentDocHasContent(parsed.doc) && (
                <CommentContent
                  doc={parsed.doc}
                  onImageClick={(src) => onOpenMedia({ url: src, isVideo: false })}
                />
              )
            : m.body && <span className="whitespace-pre-wrap break-words">{m.body}</span>}
        </div>
      )}
    </div>
  );
}
