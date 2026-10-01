import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { normalizeDocumentImagesForStorage } from "@/features/rich-text/lib/document-images";
import { stripUploadingImages } from "@/features/rich-text/lib/tiptap-upload-image";
import { updateTicket, type Ticket, type UpdateTicketRequest } from "../../api/tickets.api";
import { ticketErrorMessage } from "../../lib/ticket-errors";
import { invalidateTicket, ticketKeys } from "../ticket-queries";
import type { TicketDialogData } from "./use-ticket-dialog-data";

const sameIds = (a: string[], b: string[]) => {
  const left = new Set(a);
  const right = new Set(b);
  return left.size === right.size && [...left].every((id) => right.has(id));
};

/**
 * Pending (unsaved) ticket fields. They are seeded once from the loaded ticket — the modal body
 * mounts only after the ticket has loaded — and are not resynced on refetch, so background
 * refreshes never clobber the user's edits. "Save Ticket" sends one PATCH with the changes.
 */
export function useTicketForm(
  ticket: Ticket,
  data: Pick<TicketDialogData, "sprints" | "assertUnlocked">,
  onSaved: () => void,
) {
  const qc = useQueryClient();
  const [title, setTitle] = useState(ticket.title);
  const [assigneeId, setAssigneeId] = useState<string | null>(ticket.assigneeId ?? null);
  const [columnId, setColumnId] = useState<string | null>(ticket.columnId ?? null);
  const [priority, setPriority] = useState<string>(ticket.priority);
  const [type, setType] = useState<string>(ticket.type);
  const [sprintId, setSprintId] = useState<string | null>(ticket.sprintId ?? null);
  const [storyPoints, setStoryPoints] = useState<number | null>(ticket.storyPoints ?? null);
  const [dueDate, setDueDate] = useState<string | null>(ticket.dueDate ?? null);
  const [epicIds, setEpicIds] = useState<string[]>(ticket.epicIds ?? []);
  const [saving, setSaving] = useState(false);
  // Holds the latest editor content for saving. Kept in a ref (not state) so
  // typing does not re-render and feed the editor's output back into its own
  // `content` prop, which would race with the initial content load.
  const descriptionRef = useRef<unknown>(ticket.descriptionJson ?? null);

  const saveAndClose = async () => {
    if (saving) return;
    const rawDescription = descriptionRef.current ?? ticket.descriptionJson ?? null;
    // Drop transient upload placeholders and store stable storage paths instead
    // of short-lived signed URLs (which would later render as broken images).
    const description = rawDescription
      ? normalizeDocumentImagesForStorage(stripUploadingImages(rawDescription))
      : null;
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    const sprintChanged = (sprintId ?? null) !== (ticket.sprintId ?? null);
    if (
      sprintChanged &&
      sprintId &&
      data.sprints.some((s) => s.id === sprintId && s.status === "completed")
    ) {
      toast.error("You cannot assign tickets to completed sprints");
      return;
    }

    const body: UpdateTicketRequest = { title: title.trim() };
    if (description && typeof description === "object")
      body.descriptionJson = description as Record<string, unknown>;
    if ((assigneeId ?? null) !== (ticket.assigneeId ?? null)) body.assigneeId = assigneeId;
    if (columnId && columnId !== (ticket.columnId ?? null)) body.columnId = columnId;
    if (priority !== ticket.priority) body.priority = priority;
    if (type !== ticket.type) body.type = type;
    if (sprintChanged) body.sprintId = sprintId;
    if ((storyPoints ?? null) !== (ticket.storyPoints ?? null)) body.storyPoints = storyPoints;
    if ((dueDate ?? null) !== (ticket.dueDate ?? null)) body.dueDate = dueDate;
    if (!sameIds(epicIds, ticket.epicIds ?? [])) body.epicIds = epicIds;

    setSaving(true);
    try {
      data.assertUnlocked();
      const updated = await updateTicket(ticket.id, body);
      qc.setQueryData(ticketKeys.detail(ticket.id), updated);
      invalidateTicket(qc, ticket.id, ticket.projectId);
      toast.success("Saved");
      onSaved();
    } catch (e) {
      toast.error(ticketErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return {
    title,
    setTitle,
    assigneeId,
    setAssigneeId,
    columnId,
    setColumnId,
    priority,
    setPriority,
    type,
    setType,
    sprintId,
    setSprintId,
    storyPoints,
    setStoryPoints,
    dueDate,
    setDueDate,
    epicIds,
    setEpicIds,
    descriptionRef,
    saving,
    saveAndClose,
  };
}

export type TicketForm = ReturnType<typeof useTicketForm>;
