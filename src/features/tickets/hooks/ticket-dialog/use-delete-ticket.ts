import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteTicket, type Ticket } from "../../api/tickets.api";
import { ticketErrorMessage } from "../../lib/ticket-errors";
import { invalidateProjectTickets } from "../ticket-queries";

/**
 * Deletes the ticket. The server refuses tickets with logged time (HAS_LOGGED_TIME), in a
 * completed sprint, or for non-managers; its message is shown as the toast.
 */
export function useDeleteTicket(ticket: Ticket, assertUnlocked: () => void, onDeleted: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      assertUnlocked();
      await deleteTicket(ticket.id);
    },
    onSuccess: () => {
      toast.success("Ticket deleted");
      invalidateProjectTickets(qc, ticket.projectId);
      onDeleted();
    },
    onError: (e) => toast.error(ticketErrorMessage(e)),
  });
}
