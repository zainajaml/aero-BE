import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RESOURCE_TYPES } from "@/shared/lib/format";
import { normalizeHM } from "@/shared/ui/stepper-num-input";
import {
  addEstimate,
  deleteEstimate,
  updateEstimate,
  type Estimate,
  type Ticket,
} from "../../api/tickets.api";
import { ticketErrorMessage } from "../../lib/ticket-errors";
import { invalidateTicket, useTicketEstimates as useEstimatesQuery } from "../ticket-queries";
import { useRateCardRoles } from "../use-rate-card-roles";

/** Hours/minutes pair with the 999h 59m cap applied on every change. */
function useHM() {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [capped, setCapped] = useState(false);
  const apply = (h: number, m: number) => {
    const n = normalizeHM(h, m);
    setHours(n.hours);
    setMinutes(n.minutes);
    setCapped(n.capped);
  };
  const set = (h: number, m: number) => {
    setHours(h);
    setMinutes(m);
  };
  return { hours, minutes, capped, apply, set, total: Math.max(0, hours * 60 + minutes) };
}

/** Estimates by role: list, the "Add estimate" bar and inline edit. The server keeps the total. */
export function useTicketEstimates(ticket: Ticket, assertUnlocked: () => void) {
  const qc = useQueryClient();
  const ticketId = ticket.id;
  const { data: rows = [] } = useEstimatesQuery(ticketId);
  const estimates = useMemo(
    () => rows.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [rows],
  );
  const total = estimates.reduce((s, e) => s + (e.minutes ?? 0), 0);

  const { data: rateRoles = [] } = useRateCardRoles(ticket.projectId);
  const resourceOptions: readonly string[] = rateRoles.length > 0 ? rateRoles : RESOURCE_TYPES;

  const refresh = () => invalidateTicket(qc, ticketId, ticket.projectId);
  const onError = (e: unknown) => toast.error(ticketErrorMessage(e));

  // ---- add form
  const [showForm, setShowForm] = useState(false);
  const [role, setRole] = useState<string>(RESOURCE_TYPES[0]);
  const draft = useHM();

  const add = useMutation({
    mutationFn: async () => {
      assertUnlocked();
      if (draft.total <= 0) throw new Error("Enter estimated time");
      if (!role.trim()) throw new Error("Select a role");
      await addEstimate(ticketId, { resourceType: role, minutes: draft.total });
    },
    onSuccess: () => {
      draft.set(0, 0);
      refresh();
      toast.success("Estimate added");
    },
    onError,
  });

  const cancelAdd = () => {
    setShowForm(false);
    draft.set(0, 0);
  };

  // ---- inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<string>(RESOURCE_TYPES[0]);
  const edit = useHM();

  const startEdit = (e: Estimate) => {
    setEditingId(e.id);
    edit.set(Math.floor(e.minutes / 60), e.minutes % 60);
    setEditRole(e.resourceType || RESOURCE_TYPES[0]);
  };

  const save = useMutation({
    mutationFn: async (id: string) => {
      assertUnlocked();
      if (edit.total <= 0) throw new Error("Enter estimated time");
      if (!editRole.trim()) throw new Error("Select a role");
      await updateEstimate(ticketId, id, { minutes: edit.total, resourceType: editRole });
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
      await deleteEstimate(ticketId, id);
    },
    onSuccess: refresh,
    onError,
  });

  return {
    estimates,
    total,
    resourceOptions,
    showForm,
    setShowForm,
    role,
    setRole,
    draft,
    add,
    cancelAdd,
    editingId,
    setEditingId,
    editRole,
    setEditRole,
    edit,
    startEdit,
    save,
    remove,
  };
}

export type TicketEstimates = ReturnType<typeof useTicketEstimates>;
