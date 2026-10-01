import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  addColumn,
  deleteColumn,
  reorderColumns,
  updateColumn,
  type BoardColumn,
} from "@/features/tickets/api/planning.api";
import {
  invalidateColumns,
  invalidateProjectTickets,
  planningKeys,
} from "@/features/tickets/hooks/ticket-queries";
import { ticketErrorMessage } from "@/features/tickets/lib/ticket-errors";

/** Column CRUD and ordering for the "Manage columns" dialog. */
export function useColumnMutations(projectId: string, columns: BoardColumn[]) {
  const qc = useQueryClient();
  const key = planningKeys.columns(projectId);
  const refresh = () => invalidateColumns(qc, projectId);
  const onError = (e: unknown) => toast.error(ticketErrorMessage(e));

  const add = useMutation({
    mutationFn: async (name: string) => {
      if (!name.trim()) throw new Error("Name required");
      return addColumn(projectId, name.trim());
    },
    onSuccess: refresh,
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteColumn(projectId, id),
    onSuccess: () => {
      refresh();
      invalidateProjectTickets(qc, projectId);
    },
    onError,
  });

  const toggleDone = useMutation({
    mutationFn: ({ id, isDone }: { id: string; isDone: boolean }) =>
      updateColumn(projectId, id, { isDone }),
    onSuccess: refresh,
    onError,
  });

  const rename = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Name required");
      return updateColumn(projectId, id, { name: trimmed });
    },
    onSuccess: refresh,
    onError,
  });

  /** Swaps a column with its neighbour and saves the full order. */
  const reorder = useMutation({
    mutationFn: async ({ index, dir }: { index: number; dir: -1 | 1 }) => {
      const target = index + dir;
      if (target < 0 || target >= columns.length) return;
      const ids = columns.map((c) => c.id);
      [ids[index], ids[target]] = [ids[target], ids[index]];
      await reorderColumns(projectId, ids);
    },
    onMutate: async ({ index, dir }) => {
      const target = index + dir;
      if (target < 0 || target >= columns.length) return;
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<BoardColumn[]>(key);
      qc.setQueryData<BoardColumn[]>(key, (old) => {
        if (!old) return old;
        const a = old[index];
        const b = old[target];
        return old
          .map((c) =>
            c.id === a.id
              ? { ...c, orderIndex: b.orderIndex }
              : c.id === b.id
                ? { ...c, orderIndex: a.orderIndex }
                : c,
          )
          .sort((x, y) => x.orderIndex - y.orderIndex);
      });
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
      toast.error(ticketErrorMessage(e));
    },
    onSettled: refresh,
  });

  return { add, remove, toggleDone, rename, reorder };
}
