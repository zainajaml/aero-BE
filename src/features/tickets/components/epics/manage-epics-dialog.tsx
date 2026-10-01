import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCanWrite } from "@/features/auth/hooks/use-can-write";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { ConfirmDelete } from "@/shared/ui/confirm-delete";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createEpic as apiCreateEpic,
  deleteEpic as apiDeleteEpic,
  renameEpic as apiRenameEpic,
  type Epic,
} from "../../api/planning.api";
import {
  invalidateEpics,
  invalidateProjectTickets,
  planningKeys,
  useEpics,
} from "../../hooks/ticket-queries";
import { ticketErrorMessage } from "../../lib/ticket-errors";

interface Props {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageEpicsDialog({ projectId, open, onOpenChange }: Props) {
  const canWrite = useCanWrite();
  const qc = useQueryClient();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const invalidate = () => invalidateEpics(qc, projectId);

  const { data: epics = [], isLoading } = useEpics(open ? projectId : null);

  const createEpic = useMutation({
    mutationFn: (name: string) => apiCreateEpic(projectId, name.trim()),
    onSuccess: () => {
      invalidate();
      setNewName("");
      toast.success("Epic created");
    },
    onError: (e) => toast.error(ticketErrorMessage(e)),
  });

  const renameEpic = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      apiRenameEpic(projectId, id, name.trim()),
    onSuccess: () => {
      invalidate();
      setEditingId(null);
      setEditName("");
      toast.success("Epic updated");
    },
    onError: (e) => toast.error(ticketErrorMessage(e)),
  });

  // The server removes the epic's ticket links together with the epic.
  const deleteEpic = useMutation({
    mutationFn: (id: string) => apiDeleteEpic(projectId, id),
    onSuccess: (_data, id) => {
      // remove the row from the cache immediately so the UI updates with the toast
      qc.setQueryData<Epic[]>(planningKeys.epics(projectId), (prev) =>
        (prev ?? []).filter((e) => e.id !== id),
      );
      invalidate();
      invalidateProjectTickets(qc, projectId);
      toast.success("Epic deleted");
    },
    onError: (e) => toast.error(ticketErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[440px] max-h-[85vh] flex-col gap-4 sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Manage Epics</DialogTitle>
          <DialogDescription>
            {canWrite
              ? "Create, rename and delete epics for this project."
              : "Epics for this project (view only)."}
          </DialogDescription>
        </DialogHeader>

        {canWrite && (
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const trimmed = newName.trim();
              if (!trimmed) return;
              if (trimmed.length > 80) {
                toast.error("Epic title must be 80 characters or less");
                return;
              }
              createEpic.mutate(newName);
            }}
          >
            <div className="relative w-full">
              <Input
                placeholder="New epic name…"
                value={newName}
                maxLength={80}
                onChange={(e) => setNewName(e.target.value)}
                className="h-9 w-full pr-12"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                {newName.length}/80
              </span>
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={!newName.trim() || createEpic.isPending}
                className="rounded-full disabled:opacity-60"
              >
                {createEpic.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {createEpic.isPending ? "Adding…" : "Add"}
              </Button>
            </div>
          </form>
        )}

        <ScrollArea className="-mr-2 min-h-0 w-full flex-1 pr-2 [&>[data-radix-scroll-area-viewport]>div]:!block [&>[data-radix-scroll-area-viewport]>div]:w-full">
          <div className="w-full min-w-0 space-y-1">
            {isLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
            ) : epics.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No epics yet.</p>
            ) : (
              epics.map((epic) => (
                <div
                  key={epic.id}
                  className="w-full min-w-0 overflow-hidden rounded-xl border border-input bg-background px-3 py-2 shadow-sm"
                >
                  {!canWrite ? (
                    <div className="flex items-center gap-3">
                      <span title={epic.name} className="flex-1 truncate text-sm">
                        {epic.name}
                      </span>
                    </div>
                  ) : editingId === epic.id ? (
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 min-w-0">
                        <Input
                          autoFocus
                          value={editName}
                          maxLength={80}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && editName.trim()) {
                              if (editName.trim().length > 80) {
                                toast.error("Epic title must be 80 characters or less");
                                return;
                              }
                              renameEpic.mutate({ id: epic.id, name: editName });
                            }
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="h-8 pr-3"
                        />
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 shrink-0"
                          disabled={!editName.trim() || renameEpic.isPending}
                          onClick={() => {
                            const trimmed = editName.trim();
                            if (trimmed.length > 80) {
                              toast.error("Epic title must be 80 characters or less");
                              return;
                            }
                            renameEpic.mutate({ id: epic.id, name: editName });
                          }}
                          aria-label="Save"
                        >
                          {renameEpic.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 shrink-0"
                          onClick={() => setEditingId(null)}
                          aria-label="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex w-full min-w-0 items-center gap-3">
                      <span title={epic.name} className="min-w-0 flex-1 truncate text-sm">
                        {epic.name}
                      </span>
                      <div className="flex w-[72px] shrink-0 items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 shrink-0"
                          onClick={() => {
                            setEditingId(epic.id);
                            setEditName(epic.name);
                          }}
                          aria-label={`Edit ${epic.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <ConfirmDelete
                          onConfirm={() => deleteEpic.mutate(epic.id)}
                          title="Delete epic?"
                          description={`This will remove "${epic.name}" and unassign it from all tickets.`}
                          trigger={
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 shrink-0 text-muted-foreground"
                              aria-label={`Delete ${epic.name}`}
                              disabled={deleteEpic.isPending && deleteEpic.variables === epic.id}
                            >
                              {deleteEpic.isPending && deleteEpic.variables === epic.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
