import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { errorMessage } from "@/shared/api/errors";
import { archiveProject, restoreProject, type Project } from "../api/projects.api";
import { useProjects } from "../project-context";
import { projectKeys } from "./project-queries";

/**
 * Archive or restore a project (audited server-side). When the project being archived is the one
 * currently open, the next active project in the same account is opened instead.
 */
export function useArchiveProject(onDone?: () => void) {
  const queryClient = useQueryClient();
  const { projects, activeProjectId, setActiveProjectId, refetch } = useProjects();
  return useMutation({
    mutationFn: async ({ project, archived }: { project: Project; archived: boolean }) => {
      await (archived ? archiveProject(project.id) : restoreProject(project.id));
      return { project, archived };
    },
    onSuccess: ({ project, archived }) => {
      toast.success(`${archived ? "Archived" : "Restored"} ${project.name}`);
      if (archived && activeProjectId === project.id) {
        const next = projects.find((p) => p.accountId === project.accountId && p.id !== project.id);
        setActiveProjectId(next ? next.id : null);
      }
      refetch();
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
      onDone?.();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}
