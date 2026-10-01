import { Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import type { JiraTeamStep } from "../hooks/use-jira-team-step";

/** Jira people without an email: match them to SpaceScope users to keep their assignments. */
export function UnmatchedUsersSection({ team }: { team: JiraTeamStep }) {
  const { unmatchedUsers, mappings, setMappings, candidates, saveAssignments, setSkippedMapping } =
    team;
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">
        {unmatchedUsers.length} Jira{" "}
        {unmatchedUsers.length === 1 ? "user couldn't" : "users couldn't"} be matched
      </p>
      <p className="text-xs text-muted-foreground">
        We couldn&apos;t access an email address for these Jira users. Match them to a SpaceScope
        user to preserve their ticket assignments.
      </p>
      <div className="divide-y divide-border rounded-md border border-border">
        {unmatchedUsers.map((u) => (
          <div key={u.key} className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
            <span className="min-w-0 flex-1 truncate">
              {u.name ?? "Unknown"}
              {u.tickets > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">
                  {u.tickets} ticket{u.tickets === 1 ? "" : "s"}
                </span>
              )}
            </span>
            <Select
              value={mappings[u.key] ?? ""}
              onValueChange={(v) => setMappings((prev) => ({ ...prev, [u.key]: v }))}
              disabled={saveAssignments.isPending}
            >
              <SelectTrigger className="h-8 w-full sm:w-64">
                <SelectValue
                  placeholder={candidates.isLoading ? "Loading people…" : "Select SpaceScope user"}
                />
              </SelectTrigger>
              <SelectContent>
                {(candidates.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          size="sm"
          variant="ghost"
          className="rounded-full"
          onClick={() => setSkippedMapping(true)}
          disabled={saveAssignments.isPending}
        >
          Skip for now
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          onClick={() => saveAssignments.mutate()}
          disabled={
            saveAssignments.isPending || Object.values(mappings).filter(Boolean).length === 0
          }
        >
          {saveAssignments.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save assignments
        </Button>
      </div>
    </div>
  );
}
