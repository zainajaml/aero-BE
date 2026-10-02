import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { CloseButton } from "@/shared/ui/close-button";
import { Input } from "@/shared/ui/input";
import { CommentEditor } from "@/features/rich-text/components/comment-editor";
import type { SupportIssue } from "../api/support.api";
import { useCreateSupportIssue } from "../hooks/use-support-mutations";

/** Right pane while opening a new ticket: title (required) and an optional rich description. */
export function SupportNewIssueForm({
  onCreated,
  onCancel,
  onClose,
  onPendingChange,
}: {
  onCreated: (issue: SupportIssue) => void;
  onCancel: () => void;
  onClose: () => void;
  onPendingChange?: (pending: boolean) => void;
}) {
  const [newSubject, setNewSubject] = useState("");
  const [newDescDoc, setNewDescDoc] = useState<unknown>(null);
  const createIssue = useCreateSupportIssue(onCreated);

  const submit = (description?: unknown) => {
    onPendingChange?.(true);
    createIssue.mutate(
      { subject: newSubject.trim().slice(0, 100), description },
      { onSettled: () => onPendingChange?.(false) },
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight">
              New support ticket
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tell us what you need help with and we&apos;ll get back to you.
            </p>
          </div>
          <CloseButton onClick={onClose} aria-label="Close support modal" />
        </div>

        <div className="mt-6 space-y-1.5">
          <label htmlFor="support-title" className="field-label block">
            Title <span className="text-destructive">*</span>
          </label>
          <Input
            id="support-title"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value.slice(0, 100))}
            maxLength={100}
            placeholder="Summarize your issue in a few words"
            className="h-10 rounded-lg border-border/60 bg-background/40"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newSubject.trim()) submit();
            }}
          />
          <div className="text-right font-mono text-[11px] tabular-nums text-muted-foreground">
            {newSubject.length}/100
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          <label className="field-label block">
            Description <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <CommentEditor
            members={[]}
            placeholder="Describe the issue in as much detail as possible…"
            ariaLabel="Description"
            onChange={setNewDescDoc}
            className="min-h-[180px] rounded-xl border-border/70 bg-background/40"
          />
          <p className="text-xs text-muted-foreground">
            Include steps to reproduce, expected behaviour, and screenshots if possible.
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[var(--tk-divider)] p-4">
        <Button
          variant="outline"
          size="sm"
          className="w-fit rounded-full px-4 py-2 text-sm font-semibold"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={!newSubject.trim() || createIssue.isPending}
          onClick={() => submit(newDescDoc)}
          className="w-fit rounded-full bg-[var(--tk-accent)] px-4 py-2 text-sm font-semibold text-[var(--tk-on-accent)] hover:bg-[var(--tk-accent-hover)]"
        >
          {createIssue.isPending ? "Creating…" : "Create Ticket"}
        </Button>
      </div>
    </div>
  );
}
