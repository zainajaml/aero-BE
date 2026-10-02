import { Loader2 } from "lucide-react";
import { RichTextEditor } from "@/features/rich-text/components/rich-text-editor";
import type { MentionMember } from "@/features/rich-text/components/mention-textarea";
import { descriptionToEditorContent } from "@/shared/lib/ticket-description";
import { cn } from "@/shared/lib/utils";
import type { Ticket } from "../../api/tickets.api";
import type { TicketAttachments } from "../../hooks/ticket-dialog/use-ticket-attachments";
import { AttachmentList } from "./attachment-list";
import { imagePreview, type PreviewAttachment } from "./attachment-preview-dialog";

export function DescriptionTab({
  ticket,
  hidden,
  sprintLocked,
  members,
  descriptionRef,
  attachments,
  onPreview,
}: {
  ticket: Ticket;
  hidden: boolean;
  sprintLocked: boolean;
  members: MentionMember[];
  descriptionRef: { current: unknown };
  attachments: TicketAttachments;
  onPreview: (preview: PreviewAttachment) => void;
}) {
  return (
    <div className={cn("desc-tab flex min-h-0 flex-1 flex-col", hidden && "hidden")}>
      <div className="tk-editor tk-scroll flex min-h-0 flex-1 flex-col overflow-y-auto rounded-xl border border-[var(--tk-border)] bg-[var(--tk-surface)] p-[15px]">
        <RichTextEditor
          key={ticket.id}
          compact
          editable={!sprintLocked}
          ariaLabel="Description"
          projectId={ticket.projectId}
          members={members}
          content={descriptionToEditorContent(ticket.descriptionJson)}
          onChange={(json) => {
            descriptionRef.current = json;
          }}
          className="editor-input desc-editor"
          onAttach={() => attachments.fileRef.current?.click()}
          attaching={attachments.upload.isPending}
          onImageClick={(src) => onPreview(imagePreview(src))}
        />
      </div>
      <input
        ref={attachments.fileRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (!e.target.files?.length) return;
          attachments.startUpload(e.target.files);
        }}
      />
      {attachments.uploadingNames.length > 0 && (
        <ul className="mt-2 space-y-1">
          {attachments.uploadingNames.map((name, i) => (
            <li
              key={`${name}-${i}`}
              className="flex items-center gap-2 rounded-md border border-[var(--tk-border)] bg-[var(--tk-bg)] px-2 py-1.5 text-xs text-[var(--tk-muted)]"
            >
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
              <span className="flex-1 truncate">{name}</span>
              <span className="shrink-0">Uploading…</span>
            </li>
          ))}
        </ul>
      )}
      <AttachmentList
        items={attachments.descriptionAttachments}
        onDownload={attachments.open}
        onDelete={(a) => attachments.remove.mutate(a)}
        readOnly={sprintLocked}
      />
    </div>
  );
}
