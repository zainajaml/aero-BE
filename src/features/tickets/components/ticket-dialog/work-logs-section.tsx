import { format } from "date-fns";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { renderTextWithDocTags } from "@/features/rich-text/components/document-tags";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { ConfirmDelete } from "@/shared/ui/confirm-delete";
import { formatDHM } from "@/shared/lib/format";
import type { TicketWorkLogs } from "../../hooks/ticket-dialog/use-ticket-work-logs";
import { initials } from "./dialog-ui";
import { parseSpentToMinutes } from "./time-utils";
import { WorkLogForm } from "./work-log-form";

export function WorkLogsSection({
  logs,
  projectId,
  sprintLocked,
  isManager,
  currentUserId,
  memberName,
}: {
  logs: TicketWorkLogs;
  projectId: string;
  sprintLocked: boolean;
  isManager: boolean;
  currentUserId: string | undefined;
  memberName: (id: string, fallback?: string) => string;
}) {
  const { form, edit } = logs;
  return (
    <>
      <h1 className="text-lg font-semibold text-[var(--tk-text)] mt-6 mb-1.5">Work Logs</h1>

      {/* Add work log trigger */}
      {!logs.showForm && !sprintLocked && (
        <button
          type="button"
          onClick={() => logs.setShowForm(true)}
          className="mb-3 mt-2 flex items-center gap-2 text-sm font-semibold text-[var(--tk-accent)]"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--tk-surface)] border border-[var(--tk-border)]">
            <Plus className="h-4 w-4 text-[var(--tk-accent)]" />
          </span>
          Add Work Log
        </button>
      )}

      {/* Entry form */}
      {logs.showForm && (
        <div className="mb-3 mt-2">
          <WorkLogForm
            fields={form}
            projectId={projectId}
            people={logs.people}
            personLocked={!isManager}
            keepTimeOf="now"
            actions={
              <>
                <Button
                  type="button"
                  onClick={() => logs.add.mutate()}
                  disabled={
                    logs.add.isPending ||
                    !form.note.trim() ||
                    !form.resource.trim() ||
                    parseSpentToMinutes(form.spent) <= 0
                  }
                  className="h-9 shrink-0 rounded-lg bg-[var(--tk-accent)] px-4 font-semibold text-[var(--tk-on-accent)] hover:bg-[var(--tk-accent-hover)]"
                >
                  Add Log
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={logs.cancelAdd}
                  className="h-9 w-9 shrink-0 rounded-lg border-[var(--tk-border)] bg-transparent p-0 text-[var(--tk-body)]"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            }
          />
        </div>
      )}

      {logs.workLogs.length === 0 && (
        <div className="py-1.5 text-sm text-[var(--tk-muted)]">No time logged yet.</div>
      )}
      {logs.workLogs.map((l) => {
        const canEdit = l.userId === currentUserId || isManager;
        const name = memberName(l.userId) || l.resourceType || "User";
        if (logs.editingId === l.id) {
          return (
            <div key={l.id} className="border-b border-[var(--tk-divider)] py-2">
              <WorkLogForm
                fields={edit}
                projectId={projectId}
                people={logs.people}
                personLocked={!isManager}
                keepTimeOf="previous"
                actions={
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={() => logs.save.mutate(l.id)}
                      disabled={
                        logs.save.isPending ||
                        !edit.note.trim() ||
                        parseSpentToMinutes(edit.spent) <= 0
                      }
                      className="h-9 flex-1 rounded-xl bg-[var(--tk-accent)] px-4 font-semibold text-[var(--tk-on-accent)] hover:bg-[var(--tk-accent-hover)]"
                    >
                      Save
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => logs.setEditingId(null)}
                      className="h-9 rounded-xl border-[var(--tk-border)] bg-transparent px-3 text-[var(--tk-body)]"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                }
              />
            </div>
          );
        }
        return (
          <div
            key={l.id}
            className="group flex items-start gap-3 border-b border-t border-[var(--tk-divider)] py-3"
          >
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarFallback className="bg-[var(--tk-border)] text-[10px] font-semibold text-[var(--tk-accent)]">
                {initials(name)}
              </AvatarFallback>
            </Avatar>
            <span className="shrink-0 text-sm font-semibold leading-6 text-[var(--tk-text)]">
              {name}
            </span>
            <span className="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--tk-body)]">
              {l.note ? renderTextWithDocTags(l.note) : "—"}
            </span>
            <span className="w-24 shrink-0 text-right font-mono text-sm leading-6 tabular-nums text-[var(--tk-accent)]">
              {formatDHM(l.minutes)}
            </span>
            <span className="w-16 shrink-0 text-right text-xs leading-6 tabular-nums text-[var(--tk-muted)]">
              {format(new Date(l.loggedAt), "MMM d")}
            </span>
            <div className="flex h-6 w-[52px] shrink-0 items-center justify-end gap-0.5">
              {canEdit && !sprintLocked && (
                <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-[var(--tk-muted)] hover:text-[var(--tk-text)]"
                    onClick={() => logs.startEdit(l)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <ConfirmDelete
                    title="Delete work log?"
                    description="Remove this logged time entry? This cannot be undone."
                    onConfirm={() => logs.remove.mutate(l.id)}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-[var(--tk-muted)] hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    }
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
