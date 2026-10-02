import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { useCanWrite } from "@/features/auth/hooks/use-can-write";
import { RichTextEditor } from "@/features/rich-text/components/rich-text-editor";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { RESOURCE_TYPES } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { useCreateTicketForm } from "../../hooks/create-ticket/use-create-ticket-form";
import { useRateCardRoles } from "../../hooks/use-rate-card-roles";
import { PendingFileList } from "../ticket-dialog/dialog-ui";
import { CreateEstimatesTab } from "./create-estimates-tab";
import { CreateTicketSidebar } from "./create-ticket-sidebar";

interface Props {
  projectId: string;
  projectKey: string;
  sprintId?: string | null;
  trigger?: ReactNode;
}

/** Viewers are read-only — no ticket creation entry point is rendered for them. */
export function CreateTicketDialog(props: Props) {
  const canWrite = useCanWrite();
  if (!canWrite) return null;
  return <CreateTicketDialogInner {...props} />;
}

function CreateTicketDialogInner({ projectId, projectKey, sprintId = null, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const form = useCreateTicketForm({
    projectId,
    sprintId,
    open,
    onCreated: () => setOpen(false),
  });
  const { data: rateRoles = [] } = useRateCardRoles(projectId);
  const resourceOptions: readonly string[] = rateRoles.length > 0 ? rateRoles : RESOURCE_TYPES;

  const tabs = [
    { id: "description" as const, label: "Description", count: null as number | null },
    { id: "estimates" as const, label: "Estimates", count: form.estimates.estimates.length },
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) form.reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            size="sm"
            className="h-8 gap-1.5 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Ticket
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        hideCloseButton
        onPointerDownOutside={(e) => e.preventDefault()}
        className="ticket-modal flex h-[88vh] max-h-[88vh] w-[1280px] max-w-[96vw] gap-0 overflow-hidden border border-[var(--tk-divider)] bg-[var(--tk-bg)] p-0 sm:rounded-2xl"
      >
        <DialogTitle className="sr-only">New ticket</DialogTitle>

        {/* ---------- MAIN COLUMN ---------- */}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden p-6">
          {/* Header row */}
          <div className="flex shrink-0 items-center gap-2 text-sm">
            <span className="font-mono uppercase tracking-wide text-[var(--tk-muted)]">
              {projectKey}
            </span>
            <span className="text-[var(--tk-faint)]">·</span>
            <span className="text-[var(--tk-muted)]">New ticket</span>
          </div>

          {/* Floating-label title */}
          <div className="relative mt-4 shrink-0 rounded-xl border border-[var(--tk-border)] bg-[var(--tk-surface)] px-3 pb-2 pt-5">
            <label
              htmlFor="new-ticket-title"
              className="field-label pointer-events-none absolute left-3 top-1.5"
            >
              Title
            </label>
            <input
              id="new-ticket-title"
              value={form.title}
              onChange={(e) => form.setTitle(e.target.value)}
              placeholder="Brief, action-oriented"
              autoFocus
              className="w-full bg-transparent text-[18px] font-semibold text-[var(--tk-text)] outline-none placeholder:text-[var(--tk-faint)]"
            />
          </div>

          {/* Tab bar */}
          <div className="mt-5 flex shrink-0 items-center gap-6 border-b border-[var(--tk-divider)]">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => form.setActiveTab(t.id)}
                className={cn(
                  "relative -mb-px flex items-center gap-2 pb-2.5 text-sm font-medium transition-colors",
                  form.activeTab === t.id
                    ? "text-[var(--tk-text)]"
                    : "text-[var(--tk-muted)] hover:text-[var(--tk-body)]",
                )}
              >
                {t.label}
                {t.count != null && t.count > 0 && (
                  <span className="rounded-full bg-[var(--tk-border)] px-1.5 py-0.5 text-[11px] leading-none text-[var(--tk-body)]">
                    {t.count}
                  </span>
                )}
                {form.activeTab === t.id && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[var(--tk-accent)]" />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="mt-4 flex min-h-0 flex-1 flex-col">
            {/* DESCRIPTION */}
            {form.activeTab === "description" && (
              <div className="desc-tab flex min-h-0 flex-1 flex-col">
                <div className="tk-editor tk-scroll flex min-h-0 flex-1 flex-col overflow-y-auto rounded-xl border border-[var(--tk-border)] bg-[var(--tk-surface)] p-[15px]">
                  <RichTextEditor
                    compact
                    ariaLabel="Description"
                    projectId={projectId}
                    members={form.mentionMembers}
                    content={form.description}
                    onChange={form.setDescription}
                    className="editor-input desc-editor"
                    onAttach={() => form.fileRef.current?.click()}
                  />
                </div>
                <input
                  ref={form.fileRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => form.addFiles(e.target.files)}
                />
                <PendingFileList
                  files={form.files}
                  onRemove={form.removeFile}
                  className="mt-1.5 space-y-1"
                />
              </div>
            )}

            {/* ESTIMATES */}
            {form.activeTab === "estimates" && (
              <CreateEstimatesTab draft={form.estimates} resourceOptions={resourceOptions} />
            )}
          </div>
        </main>

        {/* ---------- SIDEBAR ---------- */}
        <CreateTicketSidebar
          projectId={projectId}
          form={form}
          onClose={() => {
            setOpen(false);
            form.reset();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
