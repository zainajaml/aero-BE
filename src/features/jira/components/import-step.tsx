import { ArrowRight, CheckCircle2, Link2, Loader2, RefreshCw, Unlink } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { cn } from "@/shared/lib/utils";
import type { JiraImportProgress } from "../api/jira.api";
import type { useJiraConnection } from "../hooks/use-jira-connection";
import { ImportProgressPanel } from "./import-progress-panel";

type Props = {
  connection: ReturnType<typeof useJiraConnection>;
  selectedKey: string;
  onSelectKey: (key: string) => void;
  accountName: string | undefined;
  canStart: boolean;
  running: boolean;
  checking: boolean;
  progress: JiraImportProgress | null;
  percent: number;
  onStart: () => void;
  onRetry: (importId: string) => void;
};

/** Step 2 — pick a Jira project and migrate. */
export function ImportStep({
  connection,
  selectedKey,
  onSelectKey,
  accountName,
  canStart,
  running,
  checking,
  progress,
  percent,
  onStart,
  onRetry,
}: Props) {
  const { statusQuery, sitesQuery, jiraProjects, switchSite, disconnect, connect, connectToJira } =
    connection;

  return (
    <div className="flex flex-col gap-4">
      <div className="max-h-[calc(100vh-22rem)] overflow-y-auto space-y-8 rounded-lg border border-border p-8 pb-12">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Connected to {statusQuery.data?.siteName ?? "Jira"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full"
            onClick={() => disconnect.mutate()}
            disabled={disconnect.isPending || running}
          >
            {disconnect.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Unlink className="mr-2 h-4 w-4" />
            )}
            Disconnect
          </Button>
        </div>

        {(sitesQuery.data ?? []).length > 1 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Atlassian site</p>
            <Select
              value={statusQuery.data?.cloudId ?? ""}
              onValueChange={(v) => switchSite.mutate(v)}
              disabled={switchSite.isPending || running}
            >
              <SelectTrigger className="h-8 w-full sm:w-64">
                <SelectValue placeholder="Choose the Jira site to import from" />
              </SelectTrigger>
              <SelectContent>
                {(sitesQuery.data ?? []).map((site) => (
                  <SelectItem key={site.cloudId} value={site.cloudId}>
                    {site.name ?? site.url ?? site.cloudId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">Jira project to import</p>
          <div className="flex items-center gap-2">
            <Select value={selectedKey} onValueChange={onSelectKey} disabled={running}>
              <SelectTrigger className="h-8 w-[280px]">
                <SelectValue
                  placeholder={
                    jiraProjects.isLoading ? "Loading Jira projects…" : "Choose a Jira project"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {(jiraProjects.data ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.key}>
                    {p.name} ({p.key})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              onClick={() => jiraProjects.refetch()}
              disabled={jiraProjects.isFetching || running}
            >
              <RefreshCw className={cn("h-4 w-4", jiraProjects.isFetching && "animate-spin")} />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            The new project will be created inside{" "}
            <span className="font-medium text-foreground">
              {accountName ?? "your active account"}
            </span>
            .
          </p>
        </div>

        {progress && <ImportProgressPanel progress={progress} percent={percent} />}
      </div>

      <div className="flex justify-end gap-2">
        {progress?.phase === "error" && progress.needsReconnect && (
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={connectToJira}
            disabled={connect.isPending || running}
          >
            <Link2 className="mr-2 h-4 w-4" /> Reconnect Jira
          </Button>
        )}
        {progress?.phase === "error" && (
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={() => onRetry(progress.id)}
            disabled={running}
          >
            Retry
          </Button>
        )}

        <Button
          size="sm"
          className="rounded-full"
          onClick={onStart}
          disabled={!canStart || running || checking}
        >
          {checking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking…
            </>
          ) : running ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing…
            </>
          ) : (
            <>
              Start import <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
