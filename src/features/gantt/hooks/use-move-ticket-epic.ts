import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { setTicketEpics, type TicketSummary } from "@/features/tickets/api/tickets.api";
import { invalidateProjectTickets, ticketKeys } from "@/features/tickets/hooks/ticket-queries";
import { ticketErrorMessage } from "@/features/tickets/lib/ticket-errors";

interface Vars {
  ticket: TicketSummary;
  fromEpicId: string | null;
  toEpicId: string | null;
}

/** Resulting epic set: drop the source epic, add the target one (null = "No Epic Assigned"). */
const nextEpicIds = ({ ticket, fromEpicId, toEpicId }: Vars) => {
  const next = ticket.epicIds.filter((id) => id !== fromEpicId);
  if (toEpicId && !next.includes(toEpicId)) next.push(toEpicId);
  return next;
};

/** Moves a ticket between epic groups by saving its full resulting epic set. */
export function useMoveTicketEpic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: Vars) => setTicketEpics(v.ticket.id, nextEpicIds(v)),
    onMutate: async (v) => {
      const key = ticketKeys.project(v.ticket.projectId);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<TicketSummary[]>(key);
      const epicIds = nextEpicIds(v);
      qc.setQueryData<TicketSummary[]>(key, (old) =>
        (old ?? []).map((t) => (t.id === v.ticket.id ? { ...t, epicIds } : t)),
      );
      return { prev, key };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(ctx.key, ctx.prev);
      toast.error(ticketErrorMessage(e));
    },
    onSettled: (_d, _e, v) => invalidateProjectTickets(qc, v.ticket.projectId),
  });
}
