import { ArrowRight, CheckCircle2, Loader2, Mail } from "lucide-react";
import { Button } from "@/shared/ui/button";
import type { JiraImportProgress } from "../api/jira.api";
import type { JiraTeamStep } from "../hooks/use-jira-team-step";
import { InvitableUsersSection } from "./invitable-users-section";
import { UnmatchedUsersSection } from "./unmatched-users-section";

type Props = {
  progress: JiraImportProgress;
  team: JiraTeamStep;
  onOpenProject: () => void;
};

/** Step 3 — invite the people found in Jira. */
export function TeamStep({ progress, team, onOpenProject }: Props) {
  const { invitableUsers, unmatchedUsers, skippedMapping, invited, inviteEmails, sendInvites } =
    team;
  return (
    <div className="flex flex-col gap-4">
      <div className="max-h-[calc(100vh-22rem)] overflow-y-auto space-y-8 rounded-lg border border-border p-8 pb-12">
        <div className="space-y-1">
          <p className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            {progress.projectName} imported
          </p>
          <p className="text-sm text-muted-foreground">
            {progress.processed} issues, {progress.comments} comments, {progress.worklogs} work
            logs and {progress.attachments} files are now in SpaceScope.
          </p>
        </div>

        {invitableUsers.length === 0 && unmatchedUsers.length === 0 && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            All Jira users were matched successfully — no action needed.
          </p>
        )}

        {invitableUsers.length > 0 && <InvitableUsersSection team={team} />}

        {unmatchedUsers.length > 0 && !skippedMapping && <UnmatchedUsersSection team={team} />}

        {invitableUsers.length > 0 && !invited && (
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full"
              onClick={team.skipInvites}
              disabled={sendInvites.isPending}
            >
              Skip invites
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => sendInvites.mutate()}
              disabled={inviteEmails.length === 0 || sendInvites.isPending}
            >
              {sendInvites.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Send invitations
            </Button>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button size="sm" className="rounded-full" onClick={onOpenProject}>
          Open project <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
