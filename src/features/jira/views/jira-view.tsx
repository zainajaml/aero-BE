import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useProjects } from "@/features/projects/project-context";
import { ConnectStep } from "../components/connect-step";
import { DuplicateImportDialog } from "../components/duplicate-import-dialog";
import { ImportStep } from "../components/import-step";
import { StepRail } from "../components/step-rail";
import { TeamStep } from "../components/team-step";
import { useJiraConnection } from "../hooks/use-jira-connection";
import { useJiraImportRunner } from "../hooks/use-jira-import-runner";
import { useJiraTeamStep } from "../hooks/use-jira-team-step";

export function JiraView() {
  const navigate = useNavigate();
  const { accounts, accountFilterId, setActiveProjectId } = useProjects();
  const [selectedKey, setSelectedKey] = useState<string>("");

  const runner = useJiraImportRunner();
  const { progress, setProgress, running, checking, duplicate, setDuplicate } = runner;
  const connection = useJiraConnection(() => {
    setProgress(null);
    setSelectedKey("");
  });
  const { statusQuery, connected, jiraProjects, connect } = connection;
  const team = useJiraTeamStep(progress, setProgress);

  const activeAccount = useMemo(
    () => accounts.find((a) => a.id === accountFilterId) ?? null,
    [accounts, accountFilterId],
  );

  const chosen = useMemo(
    () => (jiraProjects.data ?? []).find((p) => p.key === selectedKey) ?? null,
    [jiraProjects.data, selectedKey],
  );

  const importTarget = () =>
    activeAccount && chosen
      ? { accountId: activeAccount.id, cloudId: statusQuery.data?.cloudId, project: chosen }
      : null;

  const beginImport = () => {
    const target = importTarget();
    if (target) void runner.beginImport(target);
  };

  const refreshImport = () => {
    const target = importTarget();
    if (target) void runner.runImport(target);
  };

  const openProject = async () => {
    if (progress?.projectId) setActiveProjectId(progress.projectId);
    await navigate({ to: "/board" });
  };

  const step = !connected ? 0 : progress?.phase === "done" ? 2 : 1;
  // Step 3 is complete once invites are sent/skipped and any manual mapping is saved/skipped.
  const step3Done =
    step === 2 &&
    (team.invitableUsers.length === 0 || team.invited) &&
    (team.unmatchedUsers.length === 0 || team.skippedMapping || team.saveAssignments.isSuccess);
  const percent =
    progress && progress.total > 0
      ? Math.min(100, Math.round((progress.processed / progress.total) * 100))
      : progress?.phase === "done"
        ? 100
        : 0;

  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col px-4 py-6">
      <div className="shrink-0">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Jira Import</h1>
        <p className="text-sm text-muted-foreground">
          Bring a Jira project into SpaceScope — issues, sprints, comments, work logs and files are
          migrated automatically.
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center gap-8 overflow-auto py-8">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-2 sm:px-4">
          <StepRail current={step3Done ? 3 : step} />

          {step === 0 && (
            <ConnectStep
              notConfigured={!!statusQuery.data && !statusQuery.data.configured}
              pending={connect.isPending}
              disabled={connect.isPending || statusQuery.isLoading}
              onConnect={connection.connectToJira}
            />
          )}

          {step === 1 && (
            <ImportStep
              connection={connection}
              selectedKey={selectedKey}
              onSelectKey={setSelectedKey}
              accountName={activeAccount?.name}
              canStart={!!chosen && !!activeAccount}
              running={running}
              checking={checking}
              progress={progress}
              percent={percent}
              onStart={beginImport}
              onRetry={(importId) => void runner.drive(importId)}
            />
          )}

          <DuplicateImportDialog
            duplicate={duplicate}
            onClose={() => setDuplicate(null)}
            onChooseAnother={() => {
              setDuplicate(null);
              setSelectedKey("");
            }}
            onRefresh={refreshImport}
          />

          {step === 2 && progress && (
            <TeamStep progress={progress} team={team} onOpenProject={openProject} />
          )}
        </div>
      </div>
    </div>
  );
}
