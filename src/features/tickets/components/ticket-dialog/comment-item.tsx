import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import {
  CommentContent,
  CommentEditor,
  commentDocHasContent,
  parseStoredComment,
} from "@/features/rich-text/components/comment-editor";
import {
  renderCommentBody,
  type MentionMember,
} from "@/features/rich-text/components/mention-textarea";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { ConfirmDelete } from "@/shared/ui/confirm-delete";
import { cn } from "@/shared/lib/utils";
import type { TicketComment } from "../../api/tickets.api";
import type { Composer, TicketComments } from "../../hooks/ticket-dialog/use-ticket-comments";
import type { TicketAttachments } from "../../hooks/ticket-dialog/use-ticket-attachments";
import { AttachmentList } from "./attachment-list";
import { imagePreview, type PreviewAttachment } from "./attachment-preview-dialog";
import { PendingFileList, initials } from "./dialog-ui";

export interface CommentThreadContext {
  projectId: string;
  currentUserId: string | undefined;
  sprintLocked: boolean;
  members: MentionMember[];
  memberName: (id: string) => string;
  comments: TicketComments;
  attachments: TicketAttachments;
  onPreview: (preview: PreviewAttachment) => void;
}

const ACCENT_BUTTON =
  "bg-[var(--tk-accent)] font-semibold text-[var(--tk-on-accent)] hover:bg-[var(--tk-accent-hover)]";
const GHOST_BUTTON = "text-[var(--tk-muted)] hover:text-[var(--tk-text)]";

function HiddenFileInput({ composer }: { composer: Composer }) {
  return (
    <input
      ref={composer.fileRef}
      type="file"
      multiple
      className="hidden"
      onChange={(e) => {
        composer.addFiles(e.target.files);
        e.target.value = "";
      }}
    />
  );
}

/** One comment with its inline edit/reply composers; top-level comments render their replies. */
export function CommentItem({
  comment: c,
  depth,
  topParentId,
  isLastInThread,
  ctx,
}: {
  comment: TicketComment;
  depth: number;
  topParentId: string;
  isLastInThread: boolean;
  ctx: CommentThreadContext;
}) {
  const { comments, attachments, sprintLocked } = ctx;
  const parsed = parseStoredComment(c.body);
  const isEditing = comments.editingId === c.id;
  const isAuthor = ctx.currentUserId === c.authorId;
  const name = ctx.memberName(c.authorId);
  const replies = depth === 0 ? (comments.repliesByParent[c.id] ?? []) : [];
  const { editor, reply } = comments;

  return (
    <div className={cn(depth > 0 && "mt-3 border-l-2 border-[var(--tk-divider)] pl-4")}>
      <div className="flex gap-3">
        <Avatar className={cn("shrink-0", depth > 0 ? "h-[26px] w-[26px]" : "h-8 w-8")}>
          <AvatarFallback className="bg-[var(--tk-border)] text-[11px] font-semibold text-[var(--tk-accent)]">
            {initials(name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--tk-text)]">{name}</span>
            <span className="text-xs tabular-nums text-[var(--tk-muted)]">
              {format(new Date(c.createdAt), "MMM d, yyyy")}
            </span>
          </div>
          {isEditing ? (
            <div className="mt-2">
              <CommentEditor
                projectId={ctx.projectId}
                members={ctx.members}
                initialContent={parsed.kind === "rich" ? parsed.doc : undefined}
                onChange={editor.setDoc}
                autoFocus
                className="tk-editor rounded-xl border-[var(--tk-border)] bg-[var(--tk-bg)]"
                onAttach={() => editor.fileRef.current?.click()}
              />
              <PendingFileList files={editor.files} onRemove={editor.removeFile} />
              <div className="mt-2 flex items-center justify-end gap-2">
                <HiddenFileInput composer={editor} />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={GHOST_BUTTON}
                  onClick={comments.cancelEdit}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!editor.canSend || comments.save.isPending}
                  className={ACCENT_BUTTON}
                  onClick={() => comments.save.mutate(c.id)}
                >
                  {comments.save.isPending && (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  )}
                  {comments.save.isPending && editor.files.length > 0 ? "Uploading…" : "Save"}
                </Button>
              </div>
            </div>
          ) : parsed.kind === "rich" ? (
            commentDocHasContent(parsed.doc) ? (
              <div className="mt-0.5 text-sm text-[var(--tk-body)]">
                <CommentContent
                  doc={parsed.doc}
                  onImageClick={(src) => ctx.onPreview(imagePreview(src))}
                />
              </div>
            ) : null
          ) : parsed.text.trim() ? (
            <div className="mt-0.5 text-sm text-[var(--tk-body)]">
              <div className="whitespace-pre-wrap leading-relaxed">
                {renderCommentBody(
                  parsed.text,
                  ctx.members.map((m) => m.name),
                )}
              </div>
            </div>
          ) : null}

          <AttachmentList
            items={attachments.forComment(c.id)}
            onDownload={attachments.open}
            onDelete={(a) => attachments.remove.mutate(a)}
            readOnly={sprintLocked || !isEditing}
          />
          {!isEditing && !sprintLocked && (
            <div className="mt-1.5 flex items-center gap-3 text-xs">
              {isLastInThread && (
                <button
                  type="button"
                  className="font-medium text-[var(--tk-muted)] transition-colors hover:text-[var(--tk-accent)]"
                  onClick={() => comments.toggleReply(c.id, topParentId)}
                >
                  Reply
                </button>
              )}
              {isAuthor && (
                <button
                  type="button"
                  className="text-[var(--tk-muted)] transition-colors hover:text-[var(--tk-text)]"
                  onClick={() =>
                    comments.startEdit(c.id, parsed.kind === "rich" ? parsed.doc : null)
                  }
                >
                  Edit
                </button>
              )}
              {isAuthor && (
                <ConfirmDelete
                  title="Delete this comment?"
                  onConfirm={() => comments.remove.mutate(c.id)}
                  trigger={
                    <button
                      type="button"
                      className="text-[var(--tk-muted)] transition-colors hover:text-destructive"
                    >
                      Delete
                    </button>
                  }
                />
              )}
            </div>
          )}
          {comments.replyingTo?.commentId === c.id && (
            <div className="mt-2">
              <label className="field-label mb-1.5 block">Reply</label>
              <CommentEditor
                key={reply.key}
                projectId={ctx.projectId}
                members={ctx.members}
                placeholder="Write a reply… use @ to mention"
                onChange={reply.setDoc}
                autoFocus
                className="tk-editor rounded-xl border-[var(--tk-border)] bg-[var(--tk-bg)]"
                onAttach={() => reply.fileRef.current?.click()}
              />
              <HiddenFileInput composer={reply} />
              <PendingFileList
                files={reply.files}
                onRemove={reply.removeFile}
                className="mt-1.5 space-y-1"
              />
              <div className="mt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={GHOST_BUTTON}
                  onClick={comments.cancelReply}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!reply.canSend || comments.addReply.isPending}
                  className={ACCENT_BUTTON}
                  onClick={() => comments.addReply.mutate()}
                >
                  {comments.addReply.isPending && (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  )}
                  {comments.addReply.isPending && reply.files.length > 0 ? "Uploading…" : "Reply"}
                </Button>
              </div>
            </div>
          )}
          {replies.map((r, i) => (
            <CommentItem
              key={r.id}
              comment={r}
              depth={depth + 1}
              topParentId={topParentId}
              isLastInThread={i === replies.length - 1}
              ctx={ctx}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
