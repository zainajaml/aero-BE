import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  completeSprint,
  deleteSprint,
  moveSprint,
  startSprint,
  type Sprint,
} from "@/features/tickets/api/planning.api";
import {
  invalidateProjectTickets,
  invalidateSprints,
  planningKeys,
} from "@/features/tickets/hooks/ticket-queries";
import { ticketErrorMessage } from "@/features/tickets/lib/ticket-errors";

/** Sprint lifecycle and ordering writes of the backlog page. */
export function useSprintMutations(projectId: string | null | undefined) {
  const qc = useQueryClient();
  const key = planningKeys.sprints(projectId);
  const requireProject = () => {
    if (!projectId) throw new Error("No project selected");
    return projectId;
  };
  const onError = (e: unknown) => toast.error(ticketErrorMessage(e));

  const start = useMutation({
    mutationFn: (sprintId: string) => startSprint(requireProject(), sprintId),
    onSuccess: () => {
      toast.success("Sprint started");
      invalidateSprints(qc, projectId);
    },
    onError,
  });

  /** Completes the sprint; its unfinished tickets move to `moveTo` (null = backlog) server-side. */
  const complete = useMutation({
    mutationFn: ({ sprintId, moveTo }: { sprintId: string; moveTo: string | null }) =>
      completeSprint(requireProject(), sprintId, moveTo),
    onSuccess: () => {
      toast.success("Sprint completed");
      invalidateSprints(qc, projectId);
      invalidateProjectTickets(qc, projectId);
    },
    onError,
  });

  /** Deletes the sprint; the server returns its tickets to the backlog. */
  const remove = useMutation({
    mutationFn: (sprintId: string) => deleteSprint(requireProject(), sprintId),
    onSuccess: () => {
      toast.success("Sprint deleted");
      invalidateSprints(qc, projectId);
      invalidateProjectTickets(qc, projectId);
    },
    onError,
  });

  /** Reorders an unstarted sprint between its new neighbours. */
  const reorder = useMutation({
    mutationFn: (v: {
      sprintId: string;
      afterSprintId: string | null;
      beforeSprintId: string | null;
      optimisticPosition: number;
    }) =>
      moveSprint(requireProject(), v.sprintId, {
        afterSprintId: v.afterSprintId,
        beforeSprintId: v.beforeSprintId,
      }),
    onMutate: async ({ sprintId, optimisticPosition }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Sprint[]>(key);
      qc.setQueryData<Sprint[]>(key, (old) =>
        (old ?? []).map((s) => (s.id === sprintId ? { ...s, position: optimisticPosition } : s)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
      toast.error("Could not reorder sprint");
    },
    onSettled: () => invalidateSprints(qc, projectId),
  });

  return { start, complete, remove, reorder };
}
