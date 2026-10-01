import { queryOptions } from "@tanstack/react-query";
import {
  getJiraStatus,
  listJiraImportCandidates,
  listJiraProjects,
  listJiraSites,
} from "../api/jira.api";

export const jiraKeys = {
  all: ["jira"] as const,
  status: () => [...jiraKeys.all, "status"] as const,
  projects: () => [...jiraKeys.all, "projects"] as const,
  sites: (cloudId?: string | null) =>
    cloudId === undefined
      ? ([...jiraKeys.all, "sites"] as const)
      : ([...jiraKeys.all, "sites", cloudId] as const),
  candidates: (importId: string | undefined) =>
    [...jiraKeys.all, "import-candidates", importId] as const,
};

export const jiraStatusQuery = () =>
  queryOptions({ queryKey: jiraKeys.status(), queryFn: getJiraStatus, retry: false });

export const jiraProjectsQuery = (enabled: boolean) =>
  queryOptions({
    queryKey: jiraKeys.projects(),
    queryFn: listJiraProjects,
    enabled,
    retry: false,
  });

export const jiraSitesQuery = (cloudId: string | null, enabled: boolean) =>
  queryOptions({
    queryKey: jiraKeys.sites(cloudId),
    queryFn: listJiraSites,
    enabled,
    retry: false,
    placeholderData: (previousData) => previousData,
  });

export const jiraImportCandidatesQuery = (importId: string | undefined, enabled: boolean) =>
  queryOptions({
    queryKey: jiraKeys.candidates(importId),
    queryFn: () => listJiraImportCandidates(importId!),
    enabled: !!importId && enabled,
    retry: false,
  });
