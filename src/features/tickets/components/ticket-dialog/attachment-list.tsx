import { Download, X } from "lucide-react";
import { ConfirmDelete } from "@/shared/ui/confirm-delete";
import type { Attachment } from "../../api/tickets.api";

export function AttachmentList({
  items,
  onDownload,
  onDelete,
  readOnly,
}: {
  items: Attachment[];
  onDownload: (item: Attachment) => void;
  onDelete: (item: Attachment) => void;
  readOnly?: boolean;
}) {
  if (!items.length) return null;

  return (
    <ul className="mt-1.5 flex flex-col items-start gap-1">
      {items.map((a) => (
        <li
          key={a.id}
          className="inline-flex w-fit max-w-full items-center gap-2 rounded-full border border-[var(--tk-border)] bg-[var(--tk-surface)] px-3 py-1.5 text-xs font-medium text-[var(--tk-text)] shadow-sm"
        >
          <button
            type="button"
            className="flex items-center gap-1.5 truncate text-left hover:opacity-80"
            onClick={() => onDownload(a)}
          >
            <Download className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{a.name}</span>
          </button>
          {!readOnly && (
            <ConfirmDelete
              title="Delete attachment?"
              description={`Delete "${a.name}"? This cannot be undone.`}
              onConfirm={() => onDelete(a)}
              trigger={
                <button
                  type="button"
                  className="shrink-0 text-[var(--tk-accent)]/70 hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              }
            />
          )}
        </li>
      ))}
    </ul>
  );
}
