import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { RichTextEditor } from "@/features/rich-text/components/rich-text-editor";
import { onOpenDocumentViewer } from "@/features/rich-text/lib/document-viewer-bus";
import type { DocumentDetail } from "../api/documents.api";
import { useDocument, useDocumentFileUrl } from "../hooks/document-queries";
import { FileViewer } from "./file-viewer";

function extractTextFromContent(content: unknown): string {
  if (content == null) return "";
  if (typeof content === "string") return content;
  try {
    return JSON.stringify(content);
  } catch {
    return "";
  }
}

function FilePreview({ doc }: { doc: DocumentDetail }) {
  const { url, loading } = useDocumentFileUrl(doc.id);
  return (
    <FileViewer
      variant="modal"
      mime={doc.file?.mime ?? null}
      url={url}
      loading={loading}
      name={doc.title}
    />
  );
}

/**
 * Read-only rich text preview with in-document search using the browser's
 * built-in find API. The editor is rendered normally; window.find highlights
 * matches and scrolls them into view.
 */
function RichTextPreview({ doc }: { doc: DocumentDetail }) {
  const [searchQuery, setSearchQuery] = useState("");
  const contentText = extractTextFromContent(doc.content);
  const hasMatch = searchQuery.trim()
    ? contentText.toLowerCase().includes(searchQuery.trim().toLowerCase())
    : false;

  const findNext = (forward: boolean) => {
    const q = searchQuery.trim();
    if (!q) return;
    (window as unknown as { find?: (...args: unknown[]) => boolean }).find?.(
      q,
      false,
      !forward,
      true,
      false,
      true,
      false,
    );
  };

  return (
    <div className="flex max-h-[65vh] min-h-0 flex-col gap-3">
      <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-card/50 p-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in document..."
            className="h-8 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
          />
          {searchQuery.trim() && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {hasMatch ? "Match found" : "No match"}
            </span>
          )}
        </div>
        {searchQuery.trim() && (
          <div className="flex items-center gap-1 rounded-md border border-border/60 bg-background/50 p-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => findNext(false)}
              aria-label="Previous match"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => findNext(true)}
              aria-label="Next match"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <RichTextEditor content={doc.content} editable={false} />
      </div>
    </div>
  );
}

/**
 * Single global host for the document preview modal. Mounted once inside the
 * authenticated shell; any editor can open it via `openDocumentViewer(id)`.
 */
export function DocumentViewerHost() {
  const [docId, setDocId] = useState<string | null>(null);

  useEffect(() => onOpenDocumentViewer(setDocId), []);

  const { data: doc, isLoading } = useDocument(docId);

  return (
    <Dialog open={!!docId} onOpenChange={(o) => !o && setDocId(null)}>
      <DialogContent className="max-h-[85vh] w-[70vw] max-w-[70vw] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="truncate">{doc?.title ?? "Document"}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="grid min-h-[30vh] place-items-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : !doc ? (
          <div className="grid min-h-[20vh] place-items-center text-sm text-muted-foreground">
            This document is no longer available.
          </div>
        ) : doc.file ? (
          <FilePreview doc={doc} />
        ) : (
          <RichTextPreview doc={doc} />
        )}
      </DialogContent>
    </Dialog>
  );
}
