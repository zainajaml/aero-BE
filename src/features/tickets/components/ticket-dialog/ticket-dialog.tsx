import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import { cn } from "@/shared/lib/utils";
import type { Ticket } from "../../api/tickets.api";
import { useTicket } from "../../hooks/ticket-queries";
import { useDeleteTicket } from "../../hooks/ticket-dialog/use-delete-ticket";
import { useTicketAttachments } from "../../hooks/ticket-dialog/use-ticket-attachments";
import { useTicketComments } from "../../hooks/ticket-dialog/use-ticket-comments";
import { useTicketDialogData } from "../../hooks/ticket-dialog/use-ticket-dialog-data";
import { useTicketEstimates } from "../../hooks/ticket-dialog/use-ticket-estimates";
import { useTicketForm } from "../../hooks/ticket-dialog/use-ticket-form";
import { useTicketWorkLogs } from "../../hooks/ticket-dialog/use-ticket-work-logs";
import type { TicketTab } from "../../lib/ticket-tab";
import { AttachmentPreviewDialog, type PreviewAttachment } from "./attachment-preview-dialog";
import { CommentsTab } from "./comments-tab";
import { DescriptionTab } from "./description-tab";
import { EstimatesSection } from "./estimates-section";
import { TicketMainHeader } from "./ticket-main-header";
import { TicketSidebar } from "./ticket-sidebar";
import { WorkLogsSection } from "./work-logs-section";

interface Props {
  ticketId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Which tab to show when the modal opens (deep-linking, e.g. "+ Log time"). */
  initialTab?: TicketTab | string;
}

const TABS: TicketTab[] = ["description", "comments", "estlogs"];
const asTab = (tab: string | undefined): TicketTab =>
  TABS.includes(tab as TicketTab) ? (tab as TicketTab) : "description";

// Public wrapper: the dialog body is mounted only while open and is keyed by
// ticket id. Closing the modal unmounts it, so every unsaved draft (description
// edits, in-progress estimate/log entries, comment composers, pending field
// changes) is discarded and re-opening always starts from a clean slate.
// Anything already persisted via "Add estimate" / "Add log" / "Comment" is
// unaffected — it lives on the server, not in local state.
export function TicketDialog(props: Props) {
  if (!props.open) return null;
  return <TicketDialogBody key={props.ticketId ?? "none"} {...props} />;
}

function TicketDialogBody({ ticketId, open, onOpenChange, initialTab }: Props) {
  const { data: ticket } = useTicket(ticketId);
  const [preview, setPreview] = useState<PreviewAttachment | null>(null);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          hideCloseButton
          onPointerDownOutside={(e) => e.preventDefault()}
          className="ticket-modal flex h-[88vh] max-h-[88vh] w-[1280px] max-w-[96vw] gap-0 overflow-hidden border border-[var(--tk-divider)] bg-[var(--tk-bg)] p-0 sm:rounded-2xl"
        >
          {!ticket ? (
            <div className="flex h-full w-full items-center justify-center">
              <DialogTitle className="sr-only">Loading ticket</DialogTitle>
              <Loader2 className="h-5 w-5 animate-spin text-[var(--tk-muted)]" />
            </div>
          ) : (
            <LoadedTicket
              ticket={ticket}
              initialTab={asTab(initialTab)}
              onClose={() => onOpenChange(false)}
              onPreview={setPreview}
            />
          )}
        </DialogContent>
      </Dialog>

      <AttachmentPreviewDialog preview={preview} onClose={() => setPreview(null)} />
    </>
  );
}

/** Mounted once the ticket has loaded, so the form seeds its pending fields exactly once. */
function LoadedTicket({
  ticket,
  initialTab,
  onClose,
  onPreview,
}: {
  ticket: Ticket;
  initialTab: TicketTab;
  onClose: () => void;
  onPreview: (preview: PreviewAttachment | null) => void;
}) {
  const [activeTab, setActiveTab] = useState<TicketTab>(initialTab);
  const data = useTicketDialogData(ticket);
  const { assertUnlocked, sprintLocked } = data;
  const form = useTicketForm(ticket, data, onClose);
  const attachments = useTicketAttachments(ticket.id, assertUnlocked, onPreview);
  const comments = useTicketComments(ticket.id, assertUnlocked);
  const estimates = useTicketEstimates(ticket, assertUnlocked);
  const logs = useTicketWorkLogs(ticket, data);
  const deleteTicket = useDeleteTicket(ticket, assertUnlocked, onClose);

  return (
    <>
      <DialogTitle className="sr-only">{ticket.title}</DialogTitle>

      {/* ---------- MAIN COLUMN ---------- */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden p-6">
        <TicketMainHeader
          ticket={ticket}
          title={form.title}
          onTitleChange={form.setTitle}
          sprintLocked={sprintLocked}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          commentCount={comments.comments.length}
          estLogCount={estimates.estimates.length + logs.workLogs.length}
        />

        {/* Tab content */}
        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          <DescriptionTab
            ticket={ticket}
            hidden={activeTab !== "description"}
            sprintLocked={sprintLocked}
            members={data.mentionMembers}
            descriptionRef={form.descriptionRef}
            attachments={attachments}
            onPreview={onPreview}
          />

          <CommentsTab
            hidden={activeTab !== "comments"}
            ctx={{
              projectId: ticket.projectId,
              currentUserId: data.user?.id,
              sprintLocked,
              members: data.mentionMembers,
              memberName: data.memberName,
              comments,
              attachments,
              onPreview,
            }}
          />

          {/* ESTIMATES AND WORK LOGS */}
          <div className={cn("flex min-h-0 flex-1 flex-col", activeTab !== "estlogs" && "hidden")}>
            <div className="tk-scroll flex-1 overflow-y-auto">
              <EstimatesSection
                est={estimates}
                sprintLocked={sprintLocked}
                isManager={data.isManager}
              />
              <WorkLogsSection
                logs={logs}
                projectId={ticket.projectId}
                sprintLocked={sprintLocked}
                isManager={data.isManager}
                currentUserId={data.user?.id}
                memberName={data.memberName}
              />
            </div>
          </div>
        </div>
      </main>

      {/* ---------- SIDEBAR ---------- */}
      <TicketSidebar
        ticket={ticket}
        data={data}
        form={form}
        totalEstimate={estimates.total}
        onClose={onClose}
        onDelete={() => deleteTicket.mutate()}
      />
    </>
  );
}
