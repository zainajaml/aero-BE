import { Badge } from "@/shared/ui/badge";
import { Checkbox } from "@/shared/ui/checkbox";
import type { JiraTeamStep } from "../hooks/use-jira-team-step";

/** New people found in Jira who can be invited as Team. */
export function InvitableUsersSection({ team }: { team: JiraTeamStep }) {
  const { invitableUsers, invited, selectedEmails, setSelectedEmails, sendInvites } = team;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">
          {invitableUsers.length} new {invitableUsers.length === 1 ? "person" : "people"} from
          Jira <Badge variant="secondary">Team</Badge>
        </p>
        {!invited && (
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => setSelectedEmails(invitableUsers.map((u) => u.email as string))}
            >
              Select all
            </button>
            <button
              type="button"
              className="text-muted-foreground hover:underline"
              onClick={() => setSelectedEmails([])}
            >
              Clear
            </button>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Their tickets are already assigned. Tick anyone you want to invite as Team (changeable
        later) — anyone you skip stays inactive and gets no email.
      </p>
      <div className="divide-y divide-border rounded-md border border-border">
        {invitableUsers.map((u) => {
          const email = u.email as string;
          return (
            <label key={u.key} className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm">
              <Checkbox
                checked={selectedEmails.includes(email)}
                disabled={invited || sendInvites.isPending}
                onCheckedChange={(v) =>
                  setSelectedEmails((prev) =>
                    v ? [...prev, email] : prev.filter((e) => e !== email),
                  )
                }
              />
              <span className="min-w-0 flex-1 truncate">
                {u.name ?? email}
                <span className="ml-2 text-muted-foreground">{email}</span>
              </span>
              {u.tickets > 0 && (
                <span className="text-xs text-muted-foreground">
                  {u.tickets} ticket{u.tickets === 1 ? "" : "s"}
                </span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}
