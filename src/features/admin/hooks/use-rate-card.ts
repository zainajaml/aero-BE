import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { errorMessage } from "@/shared/api/errors";
import {
  createRate,
  deleteRate,
  listRateCard,
  updateRate,
} from "@/features/projects/api/projects.api";
import { projectKeys } from "@/features/projects/hooks/project-queries";

/** Rate card rows of the given projects (sorted server-side by role). */
export function useRateCard(projectIds: string[]) {
  return useQuery({
    queryKey: projectKeys.rateCard(projectIds),
    enabled: projectIds.length > 0,
    queryFn: () => listRateCard(projectIds),
  });
}

/** Rate card writes also refresh the job-title lists the ticket estimates read (planning rates). */
function useInvalidateRates() {
  const queryClient = useQueryClient();
  return () => {
    // Prefix of projectKeys.rateCard(ids) / planning rates(ids): every id set.
    void queryClient.invalidateQueries({ queryKey: ["rate-card"] });
    void queryClient.invalidateQueries({ queryKey: ["planning", "rates"] });
  };
}

export type RateInput = { role: string; location: string | null; hourlyRate: number };

export function useSaveRate(target: { projectId: string; rateId?: string }, onDone: () => void) {
  const invalidate = useInvalidateRates();
  const isEdit = !!target.rateId;
  return useMutation({
    mutationFn: (body: RateInput) =>
      target.rateId
        ? updateRate(target.projectId, target.rateId, body)
        : createRate(target.projectId, body),
    onSuccess: () => {
      invalidate();
      toast.success(isEdit ? "Rate updated" : "Rate added");
      onDone();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}

export function useDeleteRate() {
  const invalidate = useInvalidateRates();
  return useMutation({
    mutationFn: ({ projectId, rateId }: { projectId: string; rateId: string }) =>
      deleteRate(projectId, rateId),
    onSuccess: () => {
      invalidate();
      toast.success("Role removed");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}
