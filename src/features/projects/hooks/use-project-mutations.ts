import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { errorMessage } from "@/shared/api/errors";
import {
  createProject,
  deleteProject,
  moveProject,
  updateProject,
  type Project,
} from "../api/projects.api";
import { useProjects } from "../project-context";
import { projectKeys } from "./project-queries";

type CreateProjectInput = Parameters<typeof createProject>[0];
type UpdateProjectInput = Parameters<typeof updateProject>[1];

/** Create a project in the open account (audited server-side). */
export function useCreateProject(onCreated: (project: Project) => void) {
  const queryClient = useQueryClient();
  const { refetch, setActiveProjectId } = useProjects();
  return useMutation({
    mutationFn: (input: CreateProjectInput) => createProject(input),
    onSuccess: async (project) => {
      toast.success(`Created ${project.name}`);
      refetch();
      await queryClient.invalidateQueries({ queryKey: projectKeys.all });
      setActiveProjectId(project.id);
      onCreated(project);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}

/** Edit project details; a changed account (super admins) goes through the move endpoint. */
export function useUpdateProject(project: Project, onDone: () => void) {
  const queryClient = useQueryClient();
  const { refetch } = useProjects();
  return useMutation({
    mutationFn: async ({ patch, accountId }: { patch: UpdateProjectInput; accountId?: string }) => {
      await updateProject(project.id, patch);
      if (accountId && accountId !== project.accountId) await moveProject(project.id, accountId);
    },
    onSuccess: (_data, { accountId }) => {
      toast.success("Project updated");
      refetch();
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
      if (accountId && accountId !== project.accountId)
        void queryClient.invalidateQueries({ queryKey: ["accounts"] });
      onDone();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}

/** Permanently delete a project and its content (account admins; audited server-side). */
export function useDeleteProject(onDone: () => void) {
  const queryClient = useQueryClient();
  const { refetch } = useProjects();
  return useMutation({
    mutationFn: async (project: Project) => {
      await deleteProject(project.id);
      return project;
    },
    onSuccess: (project) => {
      toast.success(`Deleted ${project.name}`);
      refetch();
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["accounts"] });
      onDone();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}
