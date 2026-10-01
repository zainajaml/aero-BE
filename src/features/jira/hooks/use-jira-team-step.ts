import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { errorMessage } from "@/shared/api/errors";
import {
  assignJiraImportUsers,
  inviteJiraImportedUsers,
  type JiraImportProgress,
} from "../api/jira.api";
import { jiraImportCandidatesQuery } from "./jira-queries";

/** Step 3 state: invite the Jira people the server found, and match the unmatched ones. */
export function useJiraTeamStep(
  progress: JiraImportProgress | null,
  setProgress: (progress: JiraImportProgress) => void,
) {
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [invited, setInvited] = useState(false);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [skippedMapping, setSkippedMapping] = useState(false);

  // Unique Jira people, grouped by the server — never one row per ticket.
  const invitableUsers = useMemo(
    () => (progress?.jiraUsers ?? []).filter((u) => u.status === "invitable" && !!u.email),
    [progress?.jiraUsers],
  );
  const unmatchedUsers = useMemo(
    () => (progress?.jiraUsers ?? []).filter((u) => u.status === "unmatched"),
    [progress?.jiraUsers],
  );

  const candidates = useQuery(
    jiraImportCandidatesQuery(
      progress?.id,
      progress?.phase === "done" && unmatchedUsers.length > 0,
    ),
  );

  useEffect(() => {
    if (invitableUsers.length) {
      setSelectedEmails(invitableUsers.map((u) => u.email as string));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress?.phase, invitableUsers.length]);

  const inviteEmails = useMemo(() => Array.from(new Set(selectedEmails)), [selectedEmails]);

  const sendInvites = useMutation({
    mutationFn: () => inviteJiraImportedUsers(progress!.id, inviteEmails),
    onSuccess: (res) => {
      setInvited(true);
      if (res.sent > 0) toast.success(`Invitations sent to ${res.sent} teammate(s).`);
      if (res.failed.length > 0) toast.error(`Could not invite: ${res.failed.join(", ")}`);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const saveAssignments = useMutation({
    mutationFn: () =>
      assignJiraImportUsers(
        progress!.id,
        Object.entries(mappings)
          .filter(([, userId]) => !!userId)
          .map(([key, userId]) => ({ key, userId })),
      ),
    onSuccess: (res) => {
      setProgress(res.progress);
      setMappings({});
      toast.success(res.assigned > 0 ? `${res.assigned} ticket(s) reassigned.` : "Assignments saved.");
    },
    onError: (e) =>
      toast.error(errorMessage(e, "We couldn't save those assignments. Please try again.")),
  });

  const skipInvites = () => {
    setSelectedEmails([]);
    setInvited(true);
    toast.success("Skipped — no invitations sent.");
  };

  return {
    invitableUsers,
    unmatchedUsers,
    candidates,
    selectedEmails,
    setSelectedEmails,
    inviteEmails,
    invited,
    skipInvites,
    sendInvites,
    mappings,
    setMappings,
    skippedMapping,
    setSkippedMapping,
    saveAssignments,
  };
}

export type JiraTeamStep = ReturnType<typeof useJiraTeamStep>;
