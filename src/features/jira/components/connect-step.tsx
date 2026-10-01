import { AlertTriangle, Link2, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";

type Props = {
  notConfigured: boolean;
  pending: boolean;
  disabled: boolean;
  onConnect: () => void;
};

/** Step 1 — connect the Atlassian account. */
export function ConnectStep({ notConfigured, pending, disabled, onConnect }: Props) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-border p-10 text-center">
      <Link2 className="h-8 w-8 text-muted-foreground" />
      <div className="space-y-1">
        <p className="font-medium">Connect your Atlassian account</p>
        <p className="text-sm text-muted-foreground">
          You will be asked to approve read access to your Jira projects.
        </p>
      </div>
      {notConfigured && (
        <p className="flex items-center gap-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" /> Jira is not configured yet — add the Atlassian
          app credentials first.
        </p>
      )}
      <Button size="sm" className="rounded-full" onClick={onConnect} disabled={disabled}>
        {pending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Link2 className="mr-2 h-4 w-4" />
        )}
        Connect Jira
      </Button>
    </div>
  );
}
