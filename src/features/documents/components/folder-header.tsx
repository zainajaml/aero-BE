import {
  Check,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Input } from "@/shared/ui/input";
import type { DocumentFolder } from "../api/documents.api";

/** Folder row of a project's tree: expand/collapse, inline rename, add page, delete. */
export function FolderHeader({
  folder,
  isOpen,
  canEdit,
  isEditing,
  nameDraft,
  onNameDraftChange,
  onToggle,
  onStartRename,
  onCommitRename,
  onCancelRename,
  onAddPage,
  onDelete,
}: {
  folder: DocumentFolder;
  isOpen: boolean;
  canEdit: boolean;
  isEditing: boolean;
  nameDraft: string;
  onNameDraftChange: (value: string) => void;
  onToggle: () => void;
  onStartRename: () => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  onAddPage: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group flex items-center gap-1 rounded-lg pr-1 text-sm hover:bg-accent/40">
      <button
        className="grid h-7 w-5 shrink-0 place-items-center text-muted-foreground"
        onClick={onToggle}
        aria-label={isOpen ? "Collapse folder" : "Expand folder"}
      >
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
      </button>
      <span className="shrink-0 text-muted-foreground">
        {isOpen ? <FolderOpen className="h-3.5 w-3.5" /> : <Folder className="h-3.5 w-3.5" />}
      </span>
      {isEditing ? (
        <Input
          autoFocus
          value={nameDraft}
          onChange={(ev) => onNameDraftChange(ev.target.value)}
          onBlur={onCommitRename}
          onKeyDown={(ev) => {
            if (ev.key === "Enter") onCommitRename();
            if (ev.key === "Escape") onCancelRename();
          }}
          className="h-6 flex-1 px-1 py-0 text-sm"
        />
      ) : (
        <button
          onDoubleClick={() => {
            if (!canEdit) return;
            onStartRename();
          }}
          onClick={onToggle}
          className="min-w-0 flex-1 truncate py-1.5 text-left font-medium"
          title={canEdit ? "Double-click to rename" : undefined}
        >
          {folder.name}
        </button>
      )}
      {canEdit && !isEditing && (
        <>
          <button
            onClick={onAddPage}
            className="hidden h-6 w-6 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent group-hover:grid"
            aria-label="Add page to folder"
            title="Add page"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="hidden h-6 w-6 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent group-hover:grid"
            aria-label="Delete folder"
            title="Delete folder"
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </button>
        </>
      )}
      {canEdit && isEditing && (
        <>
          <button
            onMouseDown={(ev) => ev.preventDefault()}
            onClick={onCommitRename}
            className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent"
            aria-label="Save name"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            onMouseDown={(ev) => ev.preventDefault()}
            onClick={onCancelRename}
            className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent"
            aria-label="Cancel"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </>
      )}
    </div>
  );
}
