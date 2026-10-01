import { api, unwrap } from "@/shared/api/client";
import type { components } from "@/shared/api/schema.gen";

export type Project = components["schemas"]["Project"];
export type ProjectType = components["schemas"]["ProjectType"];
export type Account = components["schemas"]["Account"];
export type ProjectStats = components["schemas"]["ProjectStats"];
export type ProjectPerson = components["schemas"]["ProjectPerson"];
export type Rate = components["schemas"]["Rate"];

export const listProjects = () => unwrap(api.GET("/api/v1/projects"));
export const listAccounts = () => unwrap(api.GET("/api/v1/accounts"));
export const createProject = (body: components["schemas"]["CreateProjectRequest"]) =>
  unwrap(api.POST("/api/v1/projects", { body }));
export const updateProject = (
  projectId: string,
  body: components["schemas"]["UpdateProjectRequest"],
) => unwrap(api.PATCH("/api/v1/projects/{projectId}", { params: { path: { projectId } }, body }));
export async function deleteProject(projectId: string): Promise<void> {
  await api.DELETE("/api/v1/projects/{projectId}", { params: { path: { projectId } } });
}
export const archiveProject = (projectId: string) =>
  unwrap(api.POST("/api/v1/projects/{projectId}/archive", { params: { path: { projectId } } }));
export const restoreProject = (projectId: string) =>
  unwrap(api.POST("/api/v1/projects/{projectId}/restore", { params: { path: { projectId } } }));
export const moveProject = (projectId: string, accountId: string) =>
  unwrap(
    api.POST("/api/v1/projects/{projectId}/move", {
      params: { path: { projectId } },
      body: { accountId },
    }),
  );
export const getProjectStats = (ids: string[]) =>
  unwrap(api.GET("/api/v1/projects/stats", { params: { query: { ids: ids.join(",") } } }));
export const listProjectPeople = (projectId: string) =>
  unwrap(api.GET("/api/v1/projects/{projectId}/people", { params: { path: { projectId } } }));
export const listRateCard = (ids: string[]) =>
  unwrap(api.GET("/api/v1/rate-card", { params: { query: { ids: ids.join(",") } } }));
export const createRate = (projectId: string, body: components["schemas"]["RateRequest"]) =>
  unwrap(
    api.POST("/api/v1/projects/{projectId}/rate-card", { params: { path: { projectId } }, body }),
  );
export const updateRate = (
  projectId: string,
  rateId: string,
  body: components["schemas"]["RateRequest"],
) =>
  unwrap(
    api.PUT("/api/v1/projects/{projectId}/rate-card/{rateId}", {
      params: { path: { projectId, rateId } },
      body,
    }),
  );
export async function deleteRate(projectId: string, rateId: string): Promise<void> {
  await api.DELETE("/api/v1/projects/{projectId}/rate-card/{rateId}", {
    params: { path: { projectId, rateId } },
  });
}
