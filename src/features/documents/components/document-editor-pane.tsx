import { useState } from "react";
import { FileText, Loader2, Save, Trash2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { GlassPanel } from "@/shared/ui/glass/glass-panel";
import { RichTextEditor } from "@/features/rich-text/components/rich-text-editor";
import type { DocumentDraft } from "../hooks/use-document-draft";
import { useDocument, useDocumentFileUrl } from "../hooks/document-queries";
import { FileViewer } from "./file-viewer";

/**
 * Right-hand pane: the selected page (rich text) or file. Edit/delete affordances follow the
 * document's `canEdit` / `canDelete` from the API.
 */
export function DocumentEditorPane({
  draft,
  allProjects,
  canWrite,
  onDelete,
}: {
  draft: DocumentDraft;
  allProjects: boolean;
  /** Cosmetic hint for the empty-state copy only. */
  canWrite: boolean;
  onDelete: (id: string) => void;
}) {
  const { selected, titleDraft, dirty, saving } = draft;
  const { data: detail, isLoading: detailLoading } = useDocument(selected?.id);
  const { url: fileUrl, loading: fileUrlLoading } = useDocumentFileUrl(
    selected?.file ? selected.id : null,
  );
  const [fileSearchQuery, setFileSearchQuery] = useState("");

  const current = detail && detail.id === selected?.id ? detail : null;
  const canEdit = current?.canEdit ?? false;
  const canDelete = current?.canDelete ?? false;

  if (!selected) {
    return (
      <GlassPanel className="h-full min-h-0 flex flex-col overflow-hidden p-6">
        <div className="flex-1 grid min-h-0 place-items-center text-center">
          <div className="max-w-sm space-y-2">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {allProjects ? (
                <>Select a page to read{canWrite && " or edit"}.</>
              ) : (
                <>Select a page to read{canWrite && " or edit"}, or create a new one.</>
              )}
            </p>
          </div>
        </div>
      </GlassPanel>
    );
  }

  const deleteButton = canDelete && (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onDelete(selected.id)}
      className="gap-1.5 border-destructive/60 text-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      <Trash2 className="h-4 w-4" />
      Delete
    </Button>
  );
  const saveButton = canEdit && (
    <Button
      size="sm"
      onClick={() => void draft.saveDoc()}
      disabled={!dirty || saving}
      className="gap-1.5"
    >
      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      Save Document
    </Button>
  );

  return (
    <GlassPanel className="h-full min-h-0 flex flex-col overflow-hidden p-6">
      <div className="flex h-full min-h-0 flex-col gap-4">
        <div className="flex shrink-0 items-start justify-between gap-3">
          <Input
            value={titleDraft}
            disabled={!canEdit}
            onChange={(e) => draft.updateTitleDraft(e.target.value)}
            placeholder="Page title"
            aria-label="Page title"
            className="h-auto border-0 bg-transparent px-0 font-bold shadow-none focus-visible:ring-0 !text-[22pt]"
          />
          {allProjects ? (
            (canEdit || canDelete) && (
              <div className="flex shrink-0 items-center gap-2 pt-2">
                {deleteButton}
                {saveButton}
              </div>
            )
          ) : (
            <div className="flex shrink-0 items-center gap-2 pt-2">
              {deleteButton}
              {saveButton}
            </div>
          )}
        </div>
        <div
          className={cn("flex-1 min-h-0", selected.file ? "overflow-hidden" : "overflow-y-auto")}
        >
          {selected.file ? (
            <FileViewer
              mime={selected.file.mime}
              url={fileUrl}
              loading={fileUrlLoading}
              name={selected.title}
              searchQuery={fileSearchQuery}
              onSearchChange={setFileSearchQuery}
            />
          ) : !current ? (
            <div className="grid min-h-[40vh] place-items-center text-muted-foreground">
              {detailLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <p className="text-sm">This document is no longer available.</p>
              )}
            </div>
          ) : (
            <RichTextEditor
              projectId={selected.projectId}
              key={selected.id}
              content={current.content}
              editable={canEdit}
              ariaLabel="Page content"
              onChange={draft.updateContentDraft}
              onContentReady={draft.initializeContentDraft}
            />
          )}
        </div>
      </div>
    </GlassPanel>
  );
}
