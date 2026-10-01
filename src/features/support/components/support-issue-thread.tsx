import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/features/auth/auth-context";
import type { SupportIssue } from "../api/support.api";
import { useSupportIssue } from "../hooks/support-queries";
import { groupMessagesByDay } from "../lib/support-format";
import { SupportComposer } from "./support-composer";
import { SupportIssueHeader } from "./support-issue-header";
import type { SupportLightboxItem } from "./support-lightbox";
import { SupportMessageItem } from "./support-message-item";

/** Right pane for a selected ticket: header, day-grouped conversation and composer. */
export function SupportIssueThread({
  issue,
  onClose,
  onDeleted,
  onOpenMedia,
}: {
  issue: SupportIssue;
  onClose: () => void;
  onDeleted: () => void;
  onOpenMedia: (item: SupportLightboxItem) => void;
}) {
  const { user } = useAuth();
  const { data } = useSupportIssue(issue.id, true);
  const messages = data?.messages ?? [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const convoRef = useRef<HTMLDivElement | null>(null);

  // Keep the conversation pinned to the latest message so it sits directly above the composer.
  // Keyed on the message count/last id so background polling doesn't yank the scroll position.
  const lastId = messages[messages.length - 1]?.id;
  useEffect(() => {
    const el = convoRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, lastId, issue.id]);

  return (
    <>
      <SupportIssueHeader issue={issue} onClose={onClose} onDeleted={onDeleted} />

      <div ref={convoRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-6 px-8 py-4">
          {messages.length === 0 && (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No messages yet. Say hello!
            </p>
          )}
          {groupMessagesByDay(messages).map((group) => (
            <div key={group.key} className="flex flex-col gap-5">
              <div className="flex items-center justify-center">
                <span className="text-xs font-semibold text-muted-foreground">{group.label}</span>
              </div>
              {group.items.map((m) => (
                <SupportMessageItem
                  key={m.id}
                  issueId={issue.id}
                  message={m}
                  mine={m.authorId === user?.id}
                  editing={editingId === m.id}
                  onEditingChange={(editing) => setEditingId(editing ? m.id : null)}
                  onOpenMedia={onOpenMedia}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <SupportComposer key={issue.id} issueId={issue.id} />
    </>
  );
}
