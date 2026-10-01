import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { errorMessage } from "@/shared/api/errors";
import { projectKeys } from "@/features/projects/hooks/project-queries";
import { useProjects } from "@/features/projects/project-context";
import {
  checkJiraProjectImported,
  getJiraImport,
  startJiraImport,
  stepJiraImport,
  type JiraImportProgress,
  type JiraProject,
} from "../api/jira.api";

export type DuplicateImport = { name: string; tickets: number };

type ImportTarget = { accountId: string; cloudId: string | undefined; project: JiraProject };

/** Starts a Jira import and drives it slice by slice until the server reports done or error. */
export function useJiraImportRunner() {
  const queryClient = useQueryClient();
  const { refetch } = useProjects();
  const [progress, setProgress] = useState<JiraImportProgress | null>(null);
  const [running, setRunning] = useState(false);
  const [checking, setChecking] = useState(false);
  const [duplicate, setDuplicate] = useState<DuplicateImport | null>(null);
  const cancelled = useRef(false);

  useEffect(() => {
    // React's development safety check mounts, cleans up, then mounts again.
    // Reset the flag on each mount so the import driver is not left permanently
    // cancelled after that first cleanup.
    cancelled.current = false;
    return () => {
      cancelled.current = true;
    };
  }, []);

  /** Drives the whole migration by repeatedly asking the server for one slice. */
  const drive = async (importId: string) => {
    setRunning(true);
    try {
      for (let i = 0; i < 5000; i += 1) {
        if (cancelled.current) return;
        const next = await stepJiraImport(importId);
        setProgress(next);
        if (next.phase === "done") {
          await queryClient.invalidateQueries({ queryKey: projectKeys.all });
          refetch();
          break;
        }
        if (next.phase === "error") {
          toast.error(next.error ?? "The import stopped.");
          break;
        }
      }
    } catch (e) {
      toast.error(errorMessage(e, "The import stopped unexpectedly."));
      try {
        setProgress(await getJiraImport(importId));
      } catch {
        /* keep the last known progress */
      }
    } finally {
      setRunning(false);
    }
  };

  /** Runs the migration; existing Jira ids update in place, so this is also the refresh. */
  const runImport = async ({ accountId, cloudId, project }: ImportTarget) => {
    if (!cloudId) return;
    setDuplicate(null);
    try {
      const started = await startJiraImport({
        accountId,
        cloudId,
        jiraProjectId: project.id,
        jiraProjectKey: project.key,
        jiraProjectName: project.name,
      });
      setProgress(started);
      await drive(started.id);
    } catch (e) {
      toast.error(errorMessage(e, "Could not start the import."));
    }
  };

  /** Start import first checks for an existing SpaceScope project for this Jira project. */
  const beginImport = async (target: ImportTarget) => {
    // Stay in the busy state right through to the first import slice so the
    // button never flickers back to "Start import" in between.
    setChecking(true);
    try {
      try {
        const found = await checkJiraProjectImported(
          target.project.id,
          target.accountId,
          target.cloudId,
        );
        if (found.imported) {
          setDuplicate({ name: found.projectName ?? target.project.name, tickets: found.tickets });
          return;
        }
      } catch {
        /* fall through to a normal import if the check fails */
      }
      await runImport(target);
    } finally {
      setChecking(false);
    }
  };

  return {
    progress,
    setProgress,
    running,
    checking,
    duplicate,
    setDuplicate,
    drive,
    runImport,
    beginImport,
  };
}
