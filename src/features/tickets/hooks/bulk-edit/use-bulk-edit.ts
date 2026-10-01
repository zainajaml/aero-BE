import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { displayName } from "@/features/users/lib/names";
import {
  bulkUpdateTickets,
  setTicketEpics,
  type BulkUpdateTicketsRequest,
  type TicketSummary,
} from "../../api/tickets.api";
import { invalidateProjectTickets, ticketKeys, useAssignablePeople } from "../ticket-queries";
import { ticketErrorMessage } from "../../lib/ticket-errors";
import type { EpicTag } from "../../components/epics/epic-tag-input";

export const KEEP = "__keep__";
export const CLEAR = "__clear__";
export type DueMode = typeof KEEP | typeof CLEAR | "set";

export interface BulkEditOptions {
  projectId: string;
  ticketIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone?: () => void;
  columns: { id: string; name: string }[];
  sprints: { id: string; name: string; status: string }[];
}

/** Field choices ("keep as is" by default), the change summary and the single bulk-update call. */
export function useBulkEdit({
  projectId,
  ticketIds,
  open,
  onOpenChange,
  onDone,
  columns,
  sprints,
}: BulkEditOptions) {
  const qc = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [stage, setStage] = useState(KEEP);
  const [assignee, setAssignee] = useState(KEEP);
  const [priority, setPriority] = useState(KEEP);
  const [type, setType] = useState(KEEP);
  const [sprint, setSprint] = useState(KEEP);
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [dueMode, setDueMode] = useState<DueMode>(KEEP);
  const [epics, setEpics] = useState<EpicTag[]>([]);

  useEffect(() => {
    if (!open) return;
    setStage(KEEP);
    setAssignee(KEEP);
    setPriority(KEEP);
    setType(KEEP);
    setSprint(KEEP);
    setDueDate(undefined);
    setDueMode(KEEP);
    setEpics([]);
  }, [open]);

  const { data: people = [] } = useAssignablePeople(open ? projectId : null);
  const members = useMemo(
    () => people.map((p) => ({ id: p.userId, name: displayName(p, "Unnamed") })),
    [people],
  );

  const changes = useMemo(() => {
    const list: { label: string; value: string }[] = [];
    if (stage !== KEEP)
      list.push({ label: "Stage", value: columns.find((c) => c.id === stage)?.name ?? "—" });
    if (assignee !== KEEP)
      list.push({
        label: "Assignee",
        value:
          assignee === CLEAR ? "Unassigned" : (members.find((m) => m.id === assignee)?.name ?? "—"),
      });
    if (priority !== KEEP) list.push({ label: "Priority", value: priority });
    if (type !== KEEP) list.push({ label: "Type", value: type });
    if (sprint !== KEEP)
      list.push({
        label: "Sprint",
        value: sprint === CLEAR ? "Backlog" : (sprints.find((s) => s.id === sprint)?.name ?? "—"),
      });
    if (dueMode === "set" && dueDate)
      list.push({ label: "Due date", value: format(dueDate, "MMM d, yyyy") });
    if (dueMode === CLEAR) list.push({ label: "Due date", value: "Cleared" });
    if (epics.length > 0)
      list.push({ label: "Epics", value: `Add ${epics.map((e) => e.name).join(", ")}` });
    return list;
  }, [stage, assignee, priority, type, sprint, dueDate, dueMode, epics, columns, sprints, members]);

  const save = useMutation({
    mutationFn: async () => {
      const set: BulkUpdateTicketsRequest["set"] = {};
      if (stage !== KEEP) set.columnId = stage;
      if (assignee !== KEEP) set.assigneeId = assignee === CLEAR ? null : assignee;
      if (priority !== KEEP) set.priority = priority;
      if (type !== KEEP) set.type = type;
      if (sprint !== KEEP) set.sprintId = sprint === CLEAR ? null : sprint;
      if (dueMode === CLEAR) set.dueDate = null;
      if (dueMode === "set" && dueDate) set.dueDate = format(dueDate, "yyyy-MM-dd");
      const addEpicIds = epics.map((e) => e.id);

      if (Object.keys(set).length > 0) {
        await bulkUpdateTickets(projectId, {
          ticketIds,
          set,
          ...(addEpicIds.length ? { addEpicIds } : {}),
        });
        return;
      }
      // Epics-only edit: bulk-update requires at least one `set` field, so add the
      // epics per ticket on top of each ticket's current epic set.
      const cached = qc.getQueryData<TicketSummary[]>(ticketKeys.project(projectId)) ?? [];
      const current = new Map(cached.map((t) => [t.id, t.epicIds ?? []]));
      await Promise.all(
        ticketIds.map((id) =>
          setTicketEpics(id, [...new Set([...(current.get(id) ?? []), ...addEpicIds])]),
        ),
      );
    },
    onSuccess: () => {
      toast.success(`Updated ${ticketIds.length} ticket${ticketIds.length === 1 ? "" : "s"}`);
      setConfirmOpen(false);
      onOpenChange(false);
      onDone?.();
    },
    onError: (e) => toast.error(ticketErrorMessage(e)),
    onSettled: () => {
      invalidateProjectTickets(qc, projectId);
      for (const id of ticketIds) void qc.invalidateQueries({ queryKey: ticketKeys.detail(id) });
    },
  });

  return {
    confirmOpen,
    setConfirmOpen,
    stage,
    setStage,
    assignee,
    setAssignee,
    priority,
    setPriority,
    type,
    setType,
    sprint,
    setSprint,
    dueDate,
    setDueDate,
    dueMode,
    setDueMode,
    epics,
    setEpics,
    members,
    changes,
    save,
  };
}
