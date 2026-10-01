import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { normalizeDocumentImagesForStorage } from "@/features/rich-text/lib/document-images";
import { stripUploadingImages } from "@/features/rich-text/lib/tiptap-upload-image";
import { displayName } from "@/features/users/lib/names";
import { descriptionHasContent } from "@/shared/lib/ticket-description";
import { createTicket, uploadAttachment } from "../../api/tickets.api";
import type { EpicTag } from "../../components/epics/epic-tag-input";
import { ticketErrorMessage } from "../../lib/ticket-errors";
import {
  invalidateProjectTickets,
  ticketKeys,
  useAssignablePeople,
  useColumns,
  useSprints,
} from "../ticket-queries";
import { estimateRowMinutes, useEstimateDraft } from "./use-estimate-draft";

export type TicketType = "task" | "bug" | "story" | "epic";
export type TicketPriority = "low" | "medium" | "high" | "urgent";

/**
 * State and submit of the "New ticket" modal. Lookups load only while the modal is open.
 * The ticket (code, position, stage history, epics, estimates) is created in one call; files
 * are uploaded afterwards.
 */
export function useCreateTicketForm({
  projectId,
  sprintId,
  open,
  onCreated,
}: {
  projectId: string;
  sprintId: string | null;
  open: boolean;
  onCreated: () => void;
}) {
  const qc = useQueryClient();
  const lookupId = open ? projectId : null;
  const { data: members = [] } = useAssignablePeople(lookupId);
  const { data: sprintRows = [] } = useSprints(lookupId);
  const sprints = useMemo(
    () => sprintRows.slice().sort((a, b) => a.position - b.position),
    [sprintRows],
  );
  const { data: columns = [] } = useColumns(lookupId);

  const fileRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"description" | "estimates">("description");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState<unknown>(null);
  const [type, setType] = useState<TicketType>("task");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [storyPoints, setStoryPoints] = useState<string>("");
  const [assigneeId, setAssigneeId] = useState<string>("unassigned");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [epics, setEpics] = useState<EpicTag[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<string>("none");
  // "" = the default stage: the backlog column, else the first column.
  const [pickedColumnId, setPickedColumnId] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const estimates = useEstimateDraft();

  // Default the sprint to the prop (per-sprint create buttons), else no sprint (backlog).
  useEffect(() => {
    if (open) setSelectedSprintId(sprintId ?? "none");
  }, [open, sprintId]);

  const defaultColumnId =
    (columns.find((c) => c.name.toLowerCase() === "backlog") ?? columns[0])?.id ?? "";
  const columnId = pickedColumnId || defaultColumnId;

  function reset() {
    setTitle("");
    setDescription(null);
    setType("task");
    setPriority("medium");
    setStoryPoints("");
    setAssigneeId("unassigned");
    setDueDate(undefined);
    setEpics([]);
    setSelectedSprintId("none");
    setPickedColumnId("");
    setFiles([]);
    setActiveTab("description");
    estimates.reset();
    if (fileRef.current) fileRef.current.value = "";
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    const picked = Array.from(list);
    setFiles((prev) => [...prev, ...picked]);
    if (fileRef.current) fileRef.current.value = "";
  }
  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const mentionMembers = useMemo(
    () =>
      members
        .map((m) => ({ user_id: m.userId, name: displayName(m, "") }))
        .filter((m) => m.name.length > 0),
    [members],
  );

  const create = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Title required");
      if (!descriptionHasContent(description)) throw new Error("Description required");
      const targetSprintId = selectedSprintId === "none" ? null : selectedSprintId;
      if (
        targetSprintId &&
        sprints.some((s) => s.id === targetSprintId && s.status === "completed")
      ) {
        throw new Error("You cannot assign tickets to completed sprints");
      }

      const ticket = await createTicket(projectId, {
        title: title.trim(),
        descriptionJson: normalizeDocumentImagesForStorage(
          stripUploadingImages(description),
        ) as Record<string, unknown>,
        type,
        priority,
        columnId: columnId || null,
        sprintId: targetSprintId,
        assigneeId: assigneeId === "unassigned" ? null : assigneeId,
        storyPoints: storyPoints.trim() === "" ? null : Math.max(0, parseInt(storyPoints, 10) || 0),
        dueDate: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
        epicIds: epics.map((e) => e.id),
        estimates: estimates.estimates
          .map((e) => ({
            resourceType: e.resourceType,
            minutes: estimateRowMinutes(e),
            estimatedAt: e.estimatedAt,
          }))
          .filter((e) => e.minutes > 0),
      });

      // Attachments upload in parallel once the ticket exists; a failed file never undoes it.
      const results = await Promise.allSettled(
        files.map((file) => uploadAttachment(ticket.id, file)),
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      return { ticket, failed };
    },
    onSuccess: ({ ticket, failed }) => {
      toast.success("Ticket created");
      if (failed > 0) {
        toast.warning(
          `${failed} attachment${failed === 1 ? "" : "s"} could not be uploaded. Open the ticket to try again.`,
        );
      }
      invalidateProjectTickets(qc, projectId);
      void qc.invalidateQueries({ queryKey: ticketKeys.attachments(ticket.id) });
      onCreated();
      reset();
    },
    onError: (e) => toast.error(ticketErrorMessage(e)),
  });

  return {
    members,
    sprints,
    columns,
    mentionMembers,
    fileRef,
    activeTab,
    setActiveTab,
    title,
    setTitle,
    description,
    setDescription,
    type,
    setType,
    priority,
    setPriority,
    storyPoints,
    setStoryPoints,
    assigneeId,
    setAssigneeId,
    dueDate,
    setDueDate,
    epics,
    setEpics,
    selectedSprintId,
    setSelectedSprintId,
    columnId,
    setColumnId: setPickedColumnId,
    files,
    addFiles,
    removeFile,
    estimates,
    create,
    reset,
  };
}

export type CreateTicketForm = ReturnType<typeof useCreateTicketForm>;
