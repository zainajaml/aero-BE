import { useCallback, useMemo } from "react";
import { useAuth } from "@/features/auth/auth-context";
import {
  ARCHIVED_MSG,
  VIEW_ONLY_MSG,
  useCanWrite,
  useProjectArchived,
} from "@/features/auth/hooks/use-can-write";
import { displayName } from "@/features/users/lib/names";
import type { MentionMember } from "@/features/rich-text/components/mention-textarea";
import type { Ticket } from "../../api/tickets.api";
import {
  useAssignablePeople,
  useColumns,
  useEpics,
  usePeople,
  useSprints,
  useTicketComments,
  useTicketWorkLogs,
} from "../ticket-queries";

const SPRINT_LOCKED_MSG = "This ticket is in a closed sprint. Re-open the sprint to make changes.";

/**
 * Everything the open ticket modal reads besides the ticket's own children:
 * project lookups (sprints, stages, epics, people) and the lock state.
 *
 * A ticket in a completed sprint is read-only until the sprint is re-opened;
 * viewers and archived projects are read-only everywhere. The server enforces
 * the same rules — this only drives the disabled controls and notices.
 */
export function useTicketDialogData(ticket: Ticket) {
  const { user, hasAnyRole } = useAuth();
  const isManager = hasAnyRole(["super_admin", "account_admin", "admin"]);
  const projectId = ticket.projectId;

  const { data: sprintRows = [] } = useSprints(projectId);
  const sprints = useMemo(
    () => sprintRows.slice().sort((a, b) => a.position - b.position),
    [sprintRows],
  );
  const { data: columns = [] } = useColumns(projectId);
  const { data: epics = [] } = useEpics(projectId);
  const { data: members = [] } = useAssignablePeople(projectId);

  // ---- lock state
  const lockingSprint = ticket.sprintId ? sprints.find((s) => s.id === ticket.sprintId) : undefined;
  const sprintClosed = lockingSprint?.status === "completed";
  // Checks the ticket's own project, so a ticket opened from another screen
  // (e.g. My Work Log) is still locked when its project is archived.
  const canWrite = useCanWrite(projectId);
  const projectArchived = useProjectArchived(projectId);
  const viewOnly = !canWrite;
  const sprintLocked = sprintClosed || viewOnly;
  const viewMsg = projectArchived ? ARCHIVED_MSG : VIEW_ONLY_MSG;
  const lockedMsg = viewOnly ? viewMsg : SPRINT_LOCKED_MSG;
  const assertUnlocked = useCallback(() => {
    if (sprintLocked) throw new Error(lockedMsg);
  }, [sprintLocked, lockedMsg]);

  // ---- people: members plus anyone referenced who is no longer assignable
  // (archived users keep their real name on comments, work logs, reporter).
  const { data: comments = [] } = useTicketComments(ticket.id);
  const { data: workLogs = [] } = useTicketWorkLogs(ticket.id);
  const referencedIds = useMemo(() => {
    const known = new Set(members.map((m) => m.userId));
    const ids = new Set<string>();
    const add = (id: string | null | undefined) => {
      if (id && !known.has(id)) ids.add(id);
    };
    add(ticket.reporterId);
    add(ticket.assigneeId);
    for (const c of comments) add(c.authorId);
    for (const l of workLogs) add(l.userId);
    return Array.from(ids);
  }, [members, comments, workLogs, ticket.reporterId, ticket.assigneeId]);
  const { map: otherPeople } = usePeople(referencedIds);

  const memberName = useCallback(
    (id: string | null | undefined, fallback = "User") => {
      if (!id) return fallback;
      const member = members.find((m) => m.userId === id);
      if (member) return displayName(member, fallback);
      return displayName(otherPeople.get(id), fallback);
    },
    [members, otherPeople],
  );

  const mentionMembers: MentionMember[] = useMemo(
    () =>
      members
        .map((m) => ({ user_id: m.userId, name: displayName(m, "") }))
        .filter((m) => m.name.length > 0),
    [members],
  );

  return {
    user,
    isManager,
    sprints,
    columns,
    epics,
    members,
    otherPeople,
    memberName,
    mentionMembers,
    viewOnly,
    sprintLocked,
    viewMsg,
    assertUnlocked,
  };
}

export type TicketDialogData = ReturnType<typeof useTicketDialogData>;
