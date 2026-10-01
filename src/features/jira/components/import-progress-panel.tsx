import { AlertTriangle } from "lucide-react";
import type { JiraImportProgress } from "../api/jira.api";

/** Progress bar and counters for a running (or stopped) import. */
export function ImportProgressPanel({
  progress,
  percent,
}: {
  progress: JiraImportProgress;
  percent: number;
}) {
  return (
    <div className="space-y-3">
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span>
          {progress.processed}
          {progress.total ? ` / ${progress.total}` : ""} issues
        </span>
        <span>{progress.comments} comments</span>
        <span>{progress.worklogs} work logs</span>
        <span>{progress.attachments} files</span>
      </div>
      {progress.phase === "error" && (
        <p className="flex items-start gap-2 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {progress.error ??
            "The import stopped. Everything imported so far is saved — please try again."}
        </p>
      )}
      {progress.phase === "done" && progress.issueWarnings > 0 && (
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          The project was imported, but {progress.issueWarnings} item
          {progress.issueWarnings === 1 ? "" : "s"} could not be brought over. You can run the
          import again later to pick them up.
        </p>
      )}
    </div>
  );
}
