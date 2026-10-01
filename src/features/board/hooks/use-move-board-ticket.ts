import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { moveTicket, type TicketSummary } from "@/features/tickets/api/tickets.api";
import { invalidateProjectTickets, ticketKeys } from "@/features/tickets/hooks/ticket-queries";
import { ticketErrorMessage } from "@/features/tickets/lib/ticket-errors";
import type { BoardDrop } from "../lib/board-drop";

/**
 * Moves a card to a column and/or between neighbours. The server records stage history when
 * the column changes. The cache is patched synchronously so the card doesn't flicker back.
 */
export function useMoveBoardTicket(projectId: string | null | undefined) {
  const qc = useQueryClient();
  const key = ticketKeys.project(projectId);
  return useMutation({
    mutationFn: ({ ticketId, drop }: { ticketId: string; drop: BoardDrop }) =>
      moveTicket(ticketId, {
        ...(drop.columnChanged ? { columnId: drop.columnId } : {}),
        afterTicketId: drop.afterTicketId,
        beforeTicketId: drop.beforeTicketId,
      }),
    onMutate: async ({ ticketId, drop }) => {
      const prev = qc.getQueryData<TicketSummary[]>(key);
      qc.setQueryData<TicketSummary[]>(key, (old) =>
        (old ?? []).map((t) =>
          t.id === ticketId
            ? {
                ...t,
                columnId: drop.columnChanged ? drop.columnId : t.columnId,
                position: drop.optimisticPosition,
              }
            : t,
        ),
      );
      await qc.cancelQueries({ queryKey: key });
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
      toast.error(ticketErrorMessage(e));
    },
    onSettled: () => invalidateProjectTickets(qc, projectId),
  });
}
