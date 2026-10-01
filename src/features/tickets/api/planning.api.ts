import { api, unwrap } from "@/shared/api/client";
import type { components } from "@/shared/api/schema.gen";

type Schemas = components["schemas"];

export type Sprint = Schemas["Sprint"];
export type SprintStatus = Sprint["status"];
export type CreateSprintRequest = Schemas["CreateSprintRequest"];
export type UpdateSprintRequest = Schemas["UpdateSprintRequest"];
export type BoardColumn = Schemas["BoardColumn"];
export type Epic = Schemas["Epic"];
export type Person = Schemas["Person"];
export type ProjectPerson = Schemas["ProjectPerson"];
export type Rate = Schemas["Rate"];

const projectPath = (projectId: string) => ({ params: { path: { projectId } } });

// ---------------------------------------------------------------- sprints

export const listSprints = (projectId: string) =>
  unwrap(api.GET("/api/v1/projects/{projectId}/sprints", projectPath(projectId)));
export const createSprint = (projectId: string, body: CreateSprintRequest) =>
  unwrap(api.POST("/api/v1/projects/{projectId}/sprints", { ...projectPath(projectId), body }));
export const updateSprint = (projectId: string, sprintId: string, body: UpdateSprintRequest) =>
  unwrap(
    api.PATCH("/api/v1/projects/{projectId}/sprints/{sprintId}", {
      params: { path: { projectId, sprintId } },
      body,
    }),
  );
export async function deleteSprint(projectId: string, sprintId: string): Promise<void> {
  await api.DELETE("/api/v1/projects/{projectId}/sprints/{sprintId}", {
    params: { path: { projectId, sprintId } },
  });
}
export const startSprint = (projectId: string, sprintId: string) =>
  unwrap(
    api.POST("/api/v1/projects/{projectId}/sprints/{sprintId}/start", {
      params: { path: { projectId, sprintId } },
    }),
  );
/** Completes the sprint; open tickets go to `moveOpenTicketsTo` (null = backlog). */
export const completeSprint = (
  projectId: string,
  sprintId: string,
  moveOpenTicketsTo: string | null,
) =>
  unwrap(
    api.POST("/api/v1/projects/{projectId}/sprints/{sprintId}/complete", {
      params: { path: { projectId, sprintId } },
      body: { moveOpenTicketsTo },
    }),
  );
export const moveSprint = (
  projectId: string,
  sprintId: string,
  body: { afterSprintId?: string | null; beforeSprintId?: string | null },
) =>
  unwrap(
    api.POST("/api/v1/projects/{projectId}/sprints/{sprintId}/move", {
      params: { path: { projectId, sprintId } },
      body,
    }),
  );

// ---------------------------------------------------------------- board columns

export const listColumns = (projectId: string) =>
  unwrap(api.GET("/api/v1/projects/{projectId}/columns", projectPath(projectId)));
export const addColumn = (projectId: string, name: string) =>
  unwrap(
    api.POST("/api/v1/projects/{projectId}/columns", { ...projectPath(projectId), body: { name } }),
  );
export const updateColumn = (
  projectId: string,
  columnId: string,
  body: { name?: string; isDone?: boolean },
) =>
  unwrap(
    api.PATCH("/api/v1/projects/{projectId}/columns/{columnId}", {
      params: { path: { projectId, columnId } },
      body,
    }),
  );
export async function deleteColumn(projectId: string, columnId: string): Promise<void> {
  await api.DELETE("/api/v1/projects/{projectId}/columns/{columnId}", {
    params: { path: { projectId, columnId } },
  });
}
export const reorderColumns = (projectId: string, columnIds: string[]) =>
  unwrap(
    api.PUT("/api/v1/projects/{projectId}/columns/order", {
      ...projectPath(projectId),
      body: { columnIds },
    }),
  );

// ---------------------------------------------------------------- epics

export const listEpics = (projectId: string) =>
  unwrap(api.GET("/api/v1/projects/{projectId}/epics", projectPath(projectId)));
export const createEpic = (projectId: string, name: string) =>
  unwrap(
    api.POST("/api/v1/projects/{projectId}/epics", { ...projectPath(projectId), body: { name } }),
  );
export const renameEpic = (projectId: string, epicId: string, name: string) =>
  unwrap(
    api.PATCH("/api/v1/projects/{projectId}/epics/{epicId}", {
      params: { path: { projectId, epicId } },
      body: { name },
    }),
  );
export async function deleteEpic(projectId: string, epicId: string): Promise<void> {
  await api.DELETE("/api/v1/projects/{projectId}/epics/{epicId}", {
    params: { path: { projectId, epicId } },
  });
}

// ---------------------------------------------------------------- people & rate card

/** Users who can be assigned in a project (replaces RPC list_project_accessible_users). */
export const listAssignablePeople = (projectId: string) =>
  unwrap(api.GET("/api/v1/projects/{projectId}/people", projectPath(projectId)));

/** Public profile cards for the given user ids (replaces list_visible_profiles). */
export const listPeople = (ids: string[]) =>
  unwrap(api.GET("/api/v1/people", { params: { query: { ids: ids.join(",") } } }));

export const listRates = (projectIds: string[]) =>
  unwrap(api.GET("/api/v1/rate-card", { params: { query: { ids: projectIds.join(",") } } }));
