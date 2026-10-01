import { Download, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { CloseButton } from "@/shared/ui/close-button";
import { MediaImage } from "@/shared/ui/media-image";

type PreviewType = "image" | "pdf" | "text";

/** A file shown in the preview viewer; `url` is null while its link is being prepared. */
export interface PreviewAttachment {
  name: string;
  url: string | null;
  forcedType?: PreviewType;
}

function filePreviewType(name: string): PreviewType | "other" {
  // Strip query strings and hash fragments so signed URLs don't hide the extension.
  let clean = name.split("?")[0].split("#")[0];
  try {
    const url = new URL(clean);
    clean = url.pathname;
  } catch {
    // not a URL, use as-is
  }
  const ext = clean.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "avif"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (
    ["txt", "md", "csv", "json", "js", "ts", "tsx", "jsx", "html", "css", "log", "xml"].includes(
      ext,
    )
  )
    return "text";
  return "other";
}

/** Derive a filename with extension from a signed URL so preview type detection works. */
function fileNameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const base = pathname.split("/").pop() || "file";
    return base || "file";
  } catch {
    return "file";
  }
}

/** Inline-image click → open it in the viewer. */
export const imagePreview = (src: string): PreviewAttachment => ({
  name: fileNameFromUrl(src),
  url: src,
  forcedType: "image",
});

export function AttachmentPreviewDialog({
  preview,
  onClose,
}: {
  preview: PreviewAttachment | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!preview} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        hideCloseButton
        onInteractOutside={(e) => {
          // Closing the preview must never reach the ticket modal behind it.
          e.preventDefault();
          onClose();
        }}
        className="flex h-[85vh] max-h-[85vh] w-[90vw] max-w-[90vw] flex-col gap-0 overflow-hidden border border-[var(--tk-divider)] bg-[var(--tk-bg)] p-0 sm:rounded-2xl"
      >
        {preview && (
          <>
            <DialogHeader className="flex shrink-0 flex-row items-center justify-between border-b border-[var(--tk-divider)] px-4 py-3">
              <DialogTitle className="truncate pr-4 text-sm font-medium text-[var(--tk-text)]">
                {preview.name}
              </DialogTitle>
              <div className="flex items-center gap-2">
                {preview.url && (
                  <a
                    href={preview.url}
                    download={preview.name}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--tk-surface)] px-3 py-1.5 text-xs font-medium text-[var(--tk-body)] hover:bg-[var(--tk-border)]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                )}
                <CloseButton onClick={onClose} />
              </div>
            </DialogHeader>
            <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden bg-foreground/20 p-4">
              <PreviewBody preview={preview} />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PreviewBody({ preview }: { preview: PreviewAttachment }) {
  const type = preview.forcedType ?? filePreviewType(preview.name);
  if (type === "image") {
    return (
      <MediaImage
        src={preview.url}
        alt={preview.name}
        className="h-full w-full object-contain"
        containerClassName="h-full w-full max-h-full max-w-full rounded-none"
        containerStyle={{ aspectRatio: "auto", minWidth: 0 }}
        loading="eager"
      />
    );
  }
  if (!preview.url) {
    return (
      <div className="flex items-center gap-2 text-sm text-[var(--tk-muted)]">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading file…
      </div>
    );
  }
  if (type === "pdf" || type === "text") {
    return (
      <iframe
        src={preview.url}
        title={preview.name}
        className="h-full w-full rounded-lg bg-[var(--tk-surface)]"
      />
    );
  }
  return (
    <div className="text-center">
      <p className="mb-3 text-sm text-[var(--tk-muted)]">
        Preview is not available for this file type.
      </p>
      <a
        href={preview.url}
        download={preview.name}
        className="inline-flex items-center gap-2 rounded-lg bg-[var(--tk-accent)] px-4 py-2 text-sm font-semibold text-[var(--tk-on-accent)] hover:bg-[var(--tk-accent-hover)]"
      >
        <Download className="h-4 w-4" />
        Download File
      </a>
    </div>
  );
}
