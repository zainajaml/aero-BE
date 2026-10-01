import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatHM } from "@/shared/lib/format";
import { displayName } from "@/features/users/lib/names";
import {
  addWorkLog,
  deleteWorkLog,
  updateWorkLog,
  type Ticket,
  type WorkLog,
} from "../../api/tickets.api";
import { ticketErrorMessage } from "../../lib/ticket-errors";
import {
  clockDuration,
  isEndAfterStart,
  minutesToClock,
  parseSpentToMinutes,
  withClockTime,
} from "../../components/ticket-dialog/time-utils";
import { invalidateTicket, useTicketWorkLogs as useWorkLogsQuery } from "../ticket-queries";
import type { TicketDialogData } from "./use-ticket-dialog-data";

/** Fields of the work-log form (shared by "Add Work Log" and inline edit). */
function useLogFields() {
  const [note, setNote] = useState("");
  const [resource, setResource] = useState("");
  const [date, setDate] = useState<Date>(() => new Date());
  const [dateOpen, setDateOpen] = useState(false);
  const [start, setStart] = useState(""); // e.g. "9:30 am"
  const [stop, setStop] = useState(""); // e.g. "11:30 am"
  const [spent, setSpent] = useState(""); // e.g. "2h 15m"
  const noteRef = useRef<HTMLTextAreaElement>(null);
  return {
    note,
    setNote,
    resource,
    setResource,
    date,
    setDate,
    dateOpen,
    setDateOpen,
    start,
    setStart,
    stop,
    setStop,
    spent,
    setSpent,
    noteRef,
  };
}

export type LogFields = ReturnType<typeof useLogFields>;

/** Work logs of the ticket: list, the "Add Work Log" form and inline edit. */
export function useTicketWorkLogs(
  ticket: Ticket,
  data: Pick<TicketDialogData, "user" | "isManager" | "members" | "memberName" | "assertUnlocked">,
) {
  const qc = useQueryClient();
  const ticketId = ticket.id;
  const { user, isManager, members, memberName, assertUnlocked } = data;
  const { data: rows = [] } = useWorkLogsQuery(ticketId);
  const workLogs = useMemo(
    () => rows.slice().sort((a, b) => b.loggedAt.localeCompare(a.loggedAt)),
    [rows],
  );

  const refresh = () => invalidateTicket(qc, ticketId, ticket.projectId);
  const onError = (e: unknown) => toast.error(ticketErrorMessage(e));

  const people = useMemo(
    () =>
      members
        .map((m) => ({ userId: m.userId, name: displayName(m, "").trim() }))
        .filter((m) => m.name.length > 0)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [members],
  );

  // ---- add form
  const [showForm, setShowForm] = useState(false);
  const form = useLogFields();
  // Whether the user typed "Time spent" manually, so auto-calc doesn't clobber it.
  const spentManualRef = useRef(false);
  const { start: logStart, stop: logStop, setSpent: setLogSpent } = form;

  // Auto-calculate "Time spent" from start/stop, wrapping overnight shifts.
  useEffect(() => {
    if (spentManualRef.current) return;
    const d = clockDuration(logStart, logStop);
    if (!d) return;
    setLogSpent(formatHM(d.minutes));
  }, [logStart, logStop, setLogSpent]);

  // Default "Logging for" to the current user; non-managers can only log their own time.
  const { resource: logResource, setResource: setLogResource } = form;
  useEffect(() => {
    if (!people.length) return;
    const me = people.find((p) => p.userId === user?.id);
    if (!isManager && me) {
      if (logResource !== me.name) setLogResource(me.name);
      return;
    }
    if (people.some((p) => p.name === logResource)) return;
    setLogResource(me?.name ?? people[0].name);
  }, [people, logResource, setLogResource, user?.id, isManager]);

  const add = useMutation({
    mutationFn: async () => {
      assertUnlocked();
      const minutes = parseSpentToMinutes(form.spent);
      if (minutes <= 0 || !user) throw new Error("Enter time > 0");
      if (!isEndAfterStart(form.start, form.stop))
        throw new Error("End time must be after start time");
      if (!form.note.trim()) throw new Error("Note is required");
      if (!form.resource.trim()) throw new Error("Select a person");
      // Attribute the log to the selected person (managers can log for anyone).
      const person = people.find((p) => p.name === form.resource);
      await addWorkLog(ticketId, {
        minutes,
        note: form.note.trim(),
        resourceType: form.resource,
        loggedAt: withClockTime(form.date, form.start).toISOString(),
        ...(isManager && person ? { userId: person.userId } : {}),
      });
    },
    onSuccess: () => {
      form.setSpent("");
      form.setStart("");
      form.setStop("");
      form.setNote("");
      form.setDate(new Date());
      setShowForm(false);
      spentManualRef.current = false;
      refresh();
      toast.success("Logged");
    },
    onError,
  });

  const cancelAdd = () => {
    setShowForm(false);
    form.setNote("");
    form.setStart("");
    form.setStop("");
  };

  // ---- inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const edit = useLogFields();
  const { start: editStart, stop: editStop, setSpent: setEditSpent } = edit;
  // Recompute edited duration whenever start/stop change (overnight aware).
  useEffect(() => {
    const d = clockDuration(editStart, editStop);
    if (!d) return;
    setEditSpent(formatHM(d.minutes));
  }, [editStart, editStop, setEditSpent]);

  const startEdit = (l: WorkLog) => {
    setEditingId(l.id);
    edit.setNote(l.note ?? "");
    edit.setDate(new Date(l.loggedAt));
    edit.setResource(l.resourceType || memberName(l.userId, "") || "");
    // loggedAt carries the start of the window; stop is start plus the duration.
    const logged = new Date(l.loggedAt);
    const startMin = logged.getHours() * 60 + logged.getMinutes();
    edit.setStart(minutesToClock(startMin));
    edit.setStop(minutesToClock(startMin + l.minutes));
    edit.setSpent(formatHM(l.minutes));
  };

  const save = useMutation({
    mutationFn: async (id: string) => {
      assertUnlocked();
      const minutes = parseSpentToMinutes(edit.spent);
      if (minutes <= 0) throw new Error("Enter time > 0");
      if (!isEndAfterStart(edit.start, edit.stop))
        throw new Error("End time must be after start time");
      if (!edit.note.trim()) throw new Error("Note is required");
      await updateWorkLog(ticketId, id, {
        minutes,
        note: edit.note.trim(),
        loggedAt: withClockTime(edit.date, edit.start).toISOString(),
        ...(edit.resource ? { resourceType: edit.resource } : {}),
      });
    },
    onSuccess: () => {
      setEditingId(null);
      refresh();
      toast.success("Updated");
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      assertUnlocked();
      await deleteWorkLog(ticketId, id);
    },
    onSuccess: refresh,
    onError,
  });

  return {
    workLogs,
    people,
    showForm,
    setShowForm,
    form,
    add,
    cancelAdd,
    editingId,
    setEditingId,
    edit,
    startEdit,
    save,
    remove,
  };
}

export type TicketWorkLogs = ReturnType<typeof useTicketWorkLogs>;
