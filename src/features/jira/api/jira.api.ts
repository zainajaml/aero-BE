import { api, unwrap } from "@/shared/api/client";
import type { components } from "@/shared/api/schema.gen";
export type JiraProject = components["schemas"]["JiraProject"];
export type JiraImportProgress = components["schemas"]["JiraImportProgress"];
export type JiraStartImportRequest = components["schemas"]["JiraStartImportRequest"];
export type JiraAssignMapping =
  components["schemas"]["JiraAssignImportUsersRequest"]["mappings"][number];

/* Connection */
export const getJiraStatus = () => unwrap(api.GET("/api/v1/jira/status"));
export const startJiraConnect = () => unwrap(api.POST("/api/v1/jira/connect"));
export async function disconnectJira(): Promise<void> {
  await api.DELETE("/api/v1/jira/connection");
}
export const listJiraSites = () => unwrap(api.GET("/api/v1/jira/sites"));
export const selectJiraSite = (cloudId: string) =>
  unwrap(api.PUT("/api/v1/jira/site", { body: { cloudId } }));

/* Browse */
export const listJiraProjects = () => unwrap(api.GET("/api/v1/jira/projects"));

/* Import */
export const checkJiraProjectImported = (
  jiraProjectId: string,
  accountId: string,
  cloudId?: string,
) =>
  unwrap(
    api.GET("/api/v1/jira/projects/{jiraProjectId}/imported", {
      params: { path: { jiraProjectId }, query: { accountId, cloudId } },
    }),
  );
export const startJiraImport = (body: JiraStartImportRequest) =>
  unwrap(api.POST("/api/v1/jira/imports", { body }));
export const getJiraImport = (importId: string) =>
  unwrap(api.GET("/api/v1/jira/imports/{importId}", { params: { path: { importId } } }));
export const stepJiraImport = (importId: string) =>
  unwrap(api.POST("/api/v1/jira/imports/{importId}/step", { params: { path: { importId } } }));
export const listJiraImportCandidates = (importId: string) =>
  unwrap(api.GET("/api/v1/jira/imports/{importId}/candidates", { params: { path: { importId } } }));
export const assignJiraImportUsers = (importId: string, mappings: JiraAssignMapping[]) =>
  unwrap(
    api.POST("/api/v1/jira/imports/{importId}/assign-users", {
      params: { path: { importId } },
      body: { mappings },
    }),
  );
export const inviteJiraImportedUsers = (importId: string, emails: string[]) =>
  unwrap(
    api.POST("/api/v1/jira/imports/{importId}/invite-users", {
      params: { path: { importId } },
      body: { emails },
    }),
  );
