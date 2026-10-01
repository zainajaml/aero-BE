import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Settings2, Trash2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { ConfirmDelete } from "@/shared/ui/confirm-delete";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { NeonBadge } from "@/shared/ui/glass/neon-badge";
import { Input } from "@/shared/ui/input";
import type { BoardColumn } from "@/features/tickets/api/planning.api";
import { useColumnMutations } from "../hooks/use-column-mutations";

/** "Columns" button and dialog: add, rename, reorder, toggle done, delete. */
export function ManageColumnsDialog({
  projectId,
  columns,
}: {
  projectId: string;
  columns: BoardColumn[];
}) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const { add, remove, toggleDone, rename, reorder } = useColumnMutations(projectId, columns);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-transparent px-3 text-xs font-normal text-foreground shadow-sm transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
        >
          <Settings2 className="h-4 w-4" />
          Columns
        </button>
      </DialogTrigger>
      <DialogContent className="glass border-glass-border">
        <DialogHeader>
          <DialogTitle>Manage columns</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {columns.map((c, i) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-glass-border bg-card/40 px-3 py-2"
            >
              <div className="flex flex-col">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-6"
                  disabled={i === 0 || reorder.isPending}
                  onClick={() => reorder.mutate({ index: i, dir: -1 })}
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-6"
                  disabled={i === columns.length - 1 || reorder.isPending}
                  onClick={() => reorder.mutate({ index: i, dir: 1 })}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Input
                defaultValue={c.name}
                className="h-8 flex-1 border-transparent bg-transparent px-2 text-sm font-medium focus-visible:border-input focus-visible:bg-background"
                onBlur={(e) => {
                  if (e.target.value.trim() && e.target.value.trim() !== c.name) {
                    rename.mutate({ id: c.id, name: e.target.value });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                }}
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleDone.mutate({ id: c.id, isDone: !c.isDone })}
                >
                  {c.isDone ? (
                    <NeonBadge tone="lime">Done</NeonBadge>
                  ) : (
                    <NeonBadge tone="muted">Open</NeonBadge>
                  )}
                </Button>
                <ConfirmDelete
                  title="Delete column?"
                  description={`Delete the "${c.name}" column? This cannot be undone.`}
                  onConfirm={() => remove.mutate(c.id)}
                  trigger={
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New column name"
          />
          <Button
            onClick={() => add.mutate(newName, { onSuccess: () => setNewName("") })}
            disabled={add.isPending}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
