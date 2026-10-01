import { useState } from "react";
import { toast } from "sonner";
import { dhmToMinutes, RESOURCE_TYPES } from "@/shared/lib/format";
import { normalizeHM } from "@/shared/ui/stepper-num-input";

/** An estimate staged in the create dialog; sent with the create call. */
export interface EstimateRow {
  id: string;
  resourceType: string;
  estimatedAt: string;
  d: number;
  h: number;
  m: number;
}

export const estimateRowMinutes = (e: EstimateRow) => dhmToMinutes(e.d, e.h, e.m);

/** State of the "Add estimate" inline form plus the list of staged estimate rows. */
export function useEstimateDraft() {
  const [estimates, setEstimates] = useState<EstimateRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [resource, setResource] = useState<string>(RESOURCE_TYPES[0]);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [date, setDate] = useState<Date>(() => new Date());
  const [dateOpen, setDateOpen] = useState(false);
  const [capped, setCapped] = useState(false);

  const applyHM = (h: number, m: number) => {
    const n = normalizeHM(h, m);
    setHours(n.hours);
    setMinutes(n.minutes);
    setCapped(n.capped);
  };

  function add() {
    const total = dhmToMinutes(0, hours, minutes);
    if (total <= 0) {
      toast.error("Enter time > 0");
      return;
    }
    setEstimates((rows) => [
      ...rows,
      {
        id: crypto.randomUUID(),
        resourceType: resource,
        estimatedAt: date.toISOString(),
        d: 0,
        h: hours,
        m: minutes,
      },
    ]);
    setHours(0);
    setMinutes(0);
    setDate(new Date());
    setShowForm(false);
  }

  function cancel() {
    setShowForm(false);
    setHours(0);
    setMinutes(0);
  }

  function remove(id: string) {
    setEstimates((rows) => rows.filter((r) => r.id !== id));
  }

  function reset() {
    setEstimates([]);
    setShowForm(false);
    setResource(RESOURCE_TYPES[0]);
    setHours(0);
    setMinutes(0);
    setDate(new Date());
  }

  const total = estimates.reduce((s, e) => s + estimateRowMinutes(e), 0);

  return {
    estimates,
    total,
    showForm,
    setShowForm,
    resource,
    setResource,
    hours,
    minutes,
    applyHM,
    date,
    setDate,
    dateOpen,
    setDateOpen,
    capped,
    add,
    cancel,
    remove,
    reset,
  };
}

export type EstimateDraft = ReturnType<typeof useEstimateDraft>;
