import { Loader2 } from "lucide-react";
import { CommentEditor } from "@/features/rich-text/components/comment-editor";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { CommentItem, type CommentThreadContext } from "./comment-item";
import { PendingFileList } from "./dialog-ui";

export function CommentsTab({ hidden, ctx }: { hidden: boolean; ctx: CommentThreadContext }) {
  const { comments } = ctx;
  const { composer } = comments;
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", hidden && "hidden")}>
      <div className="tk-scroll min-h-[50%] max-h-[50%] space-y-4 overflow-y-auto pr-1">
        {comments.topComments.length === 0 && (
          <div className="py-6 text-sm text-[var(--tk-muted)]">No comments yet.</div>
        )}
        {comments.topComments.map((c) => (
          <CommentItem
            key={c.id}
            comment={c}
            depth={0}
            topParentId={c.id}
            isLastInThread={(comments.repliesByParent[c.id] ?? []).length === 0}
            ctx={ctx}
          />
        ))}
      </div>
      {!ctx.sprintLocked && (
        <div className="mt-3 flex min-h-[50%] max-h-[50%] flex-1 flex-col border-t border-[var(--tk-divider)] pt-3">
          <label className="field-label mb-1.5 block">Comment</label>
          <CommentEditor
            key={composer.key}
            projectId={ctx.projectId}
            members={ctx.members}
            onChange={composer.setDoc}
            placeholder="Write a comment… use @ to mention"
            className="tk-editor flex min-h-0 flex-1 flex-col rounded-xl border-[var(--tk-border)] bg-[var(--tk-surface)]"
            editorClassName="h-full overflow-y-auto"
            onAttach={() => composer.fileRef.current?.click()}
          />
          <PendingFileList files={composer.files} onRemove={composer.removeFile} />
          <div className="mt-2 flex items-center justify-end gap-2">
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
            <Button
              type="button"
              size="sm"
              disabled={!composer.canSend || comments.add.isPending}
              className="bg-[var(--tk-accent)] font-semibold text-[var(--tk-on-accent)] hover:bg-[var(--tk-accent-hover)]"
              onClick={() => comments.add.mutate()}
            >
              {comments.add.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              {comments.add.isPending && composer.files.length > 0 ? "Uploading…" : "Add Comment"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
