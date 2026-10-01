import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  bulkDeleteTickets,
  bulkMoveTickets,
  moveTicket,
  setTicketEpics,
  type TicketSummary,
} from "@/features/tickets/api/tickets.api";
import type { Sprint } from "@/features/tickets/api/planning.api";
import {
  invalidateProjectTickets,
  planningKeys,
  ticketKeys,
} from "@/features/tickets/hooks/ticket-queries";
import { skipReasonLabel, ticketErrorMessage } from "@/features/tickets/lib/ticket-errors";
import { COMPLETED_SPRINT_MSG } from "../lib/backlog-types";

type Patch = Partial<Pick<TicketSummary, "sprintId" | "columnId" | "position" | "epicIds">>;

/** Ticket writes of the backlog page, all optimistic with rollback. */
export function useBacklogTicketMutations(projectId: string | null | undefined) {
  const qc = useQueryClient();
  const key = ticketKeys.project(projectId);

  const sprints = () => qc.getQueryData<Sprint[]>(planningKeys.sprints(projectId)) ?? [];
  const isCompletedSprintId = (id: string | null | undefined) =>
    !!id && sprints().some((s) => s.id === id && s.status === "completed");
  const sprintName = (id: string | null) =>
    id ? (sprints().find((s) => s.id === id)?.name ?? id) : "Backlog";

  /** Applies a patch to the cached ticket list and returns the snapshot for rollback. */
  const patchCache = async (ids: string[], patch: Patch | null) => {
    await qc.cancelQueries({ queryKey: key });
    const prev = qc.getQueryData<TicketSummary[]>(key);
    qc.setQueryData<TicketSummary[]>(key, (old) =>
      patch === null
        ? (old ?? []).filter((t) => !ids.includes(t.id))
        : (old ?? []).map((t) => (ids.includes(t.id) ? { ...t, ...patch } : t)),
    );
    return { prev };
  };
  const rollback = (e: unknown, ctx: { prev?: TicketSummary[] } | undefined) => {
    if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    toast.error(ticketErrorMessage(e));
  };
  const settle = () => invalidateProjectTickets(qc, projectId);

  /** Move to another sprint/backlog (non-manual sort: lands at the server's default place). */
  const moveToSprint = useMutation({
    mutationFn: async ({ ticketId, sprintId }: { ticketId: string; sprintId: string | null }) => {
      if (isCompletedSprintId(sprintId)) throw new Error(COMPLETED_SPRINT_MSG);
      return moveTicket(ticketId, { sprintId });
    },
    onMutate: ({ ticketId, sprintId }) => patchCache([ticketId], { sprintId }),
    onError: (e, _v, ctx) => rollback(e, ctx),
    onSettled: settle,
  });

  /** Manual reorder: the server places the ticket between its new neighbours. */
  const reorder = useMutation({
    mutationFn: async (v: {
      ticketId: string;
      sprintId: string | null;
      afterTicketId: string | null;
      beforeTicketId: string | null;
      optimisticPosition: number;
    }) => {
      if (isCompletedSprintId(v.sprintId)) throw new Error(COMPLETED_SPRINT_MSG);
      return moveTicket(v.ticketId, {
        sprintId: v.sprintId,
        afterTicketId: v.afterTicketId,
        beforeTicketId: v.beforeTicketId,
      });
    },
    onMutate: (v) =>
      patchCache([v.ticketId], { sprintId: v.sprintId, position: v.optimisticPosition }),
    onError: (e, _v, ctx) => rollback(e, ctx),
    onSettled: settle,
  });

  const bulkMove = useMutation({
    mutationFn: async ({ ids, sprintId }: { ids: string[]; sprintId: string | null }) => {
      if (!projectId) throw new Error("No project selected");
      if (isCompletedSprintId(sprintId)) throw new Error(COMPLETED_SPRINT_MSG);
      return bulkMoveTickets(projectId, ids, sprintId);
    },
    onMutate: ({ ids, sprintId }) => patchCache(ids, { sprintId }),
    onError: (e, _v, ctx) => rollback(e, ctx),
    onSuccess: (_d, v) => {
      toast.success(
        `Moved ${v.ids.length} ticket${v.ids.length === 1 ? "" : "s"} to ${sprintName(v.sprintId)}`,
      );
    },
    onSettled: settle,
  });

  /**
   * Bulk delete: the server skips tickets with logged time or in a completed sprint and
   * reports them; `optimisticIds` are the ones expected to go.
   */
  const bulkDelete = useMutation({
    mutationFn: async ({ ids }: { ids: string[]; optimisticIds: string[] }) => {
      if (!projectId) throw new Error("No project selected");
      return bulkDeleteTickets(projectId, ids);
    },
    onMutate: ({ optimisticIds }) => patchCache(optimisticIds, null),
    onError: (e, _v, ctx) => rollback(e, ctx),
    onSuccess: (d, _v, ctx) => {
      const deleted = d.deleted.length;
      if (d.skipped.length > 0) {
        const codeById = new Map((ctx?.prev ?? []).map((t) => [t.id, t.code]));
        const details = d.skipped
          .map((s) => `${codeById.get(s.id) ?? "Ticket"} (${skipReasonLabel(s.reason)})`)
          .join(", ");
        toast.warning(
          `Deleted ${deleted} ticket${deleted === 1 ? "" : "s"}; ${d.skipped.length} could not be deleted: ${details}.`,
        );
      } else {
        toast.success(`Deleted ${deleted} ticket${deleted === 1 ? "" : "s"}`);
      }
    },
    onSettled: settle,
  });

  const setStage = useMutation({
    mutationFn: ({ ticketId, columnId }: { ticketId: string; columnId: string }) =>
      moveTicket(ticketId, { columnId }),
    onMutate: ({ ticketId, columnId }) => patchCache([ticketId], { columnId }),
    onError: (e, _v, ctx) => rollback(e, ctx),
    onSuccess: () => toast.success("Stage updated"),
    onSettled: settle,
  });

  /** Single-epic dropdown: replaces the ticket's epic set with the chosen one (or none). */
  const setEpic = useMutation({
    mutationFn: ({ ticketId, epicId }: { ticketId: string; epicId: string | null }) =>
      setTicketEpics(ticketId, epicId ? [epicId] : []),
    onMutate: ({ ticketId, epicId }) => patchCache([ticketId], { epicIds: epicId ? [epicId] : [] }),
    onError: (e, _v, ctx) => rollback(e, ctx),
    onSuccess: () => toast.success("Epic updated"),
    onSettled: settle,
  });

  return { moveToSprint, reorder, bulkMove, bulkDelete, setStage, setEpic, isCompletedSprintId };
}
