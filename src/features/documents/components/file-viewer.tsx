import { useState } from "react";
import { File as FileIcon, Loader2 } from "lucide-react";
import { MediaImage, MediaVideo } from "@/shared/ui/media-image";
import { FileViewerToolbar } from "./file-viewer-toolbar";
import { PdfViewer } from "./pdf-viewer";

// Renders an uploaded file (image / PDF inline, everything else as a download).
// `page` = the documents page editor pane; `modal` = the shared document preview dialog.
export function FileViewer({
  variant = "page",
  mime,
  url,
  loading,
  name,
  searchQuery: controlledQuery,
  onSearchChange,
}: {
  variant?: "page" | "modal";
  mime: string | null;
  url: string | null;
  loading: boolean;
  name: string;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [ownQuery, setOwnQuery] = useState("");
  const [totalMatches, setTotalMatches] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);
  const modal = variant === "modal";
  const searchQuery = controlledQuery ?? ownQuery;
  const setSearchQuery = onSearchChange ?? (modal ? setOwnQuery : undefined);

  if (loading) {
    return (
      <div
        className={`grid ${modal ? "min-h-[40vh]" : "min-h-[50vh]"} place-items-center text-muted-foreground`}
      >
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }
  if (!url) {
    return modal ? (
      <div className="grid min-h-[30vh] place-items-center text-sm text-muted-foreground">
        Could not load this file.
      </div>
    ) : (
      <div className="grid min-h-[40vh] place-items-center text-center text-sm text-muted-foreground">
        Could not load this file.
      </div>
    );
  }
  const isImage = mime?.startsWith("image/");
  const isPdf = mime === "application/pdf";
  const isVideo = mime?.startsWith("video/");
  const isAudio = mime?.startsWith("audio/");
  const isZoomable = !!(isImage || isPdf);
  const isSearchable = isPdf;
  const vh = modal ? 65 : 75;

  const handleSearchChange = setSearchQuery
    ? (q: string) => {
        setSearchQuery(q);
        setCurrentMatch(0);
        setTotalMatches(0);
      }
    : undefined;

  const goToMatch = (delta: number) => {
    if (totalMatches <= 0) return;
    setCurrentMatch((i) => {
      const next = i + delta;
      if (next < 0) return totalMatches - 1;
      if (next >= totalMatches) return 0;
      return next;
    });
  };

  return (
    <div
      className={
        modal ? "flex max-h-[65vh] min-h-0 flex-col gap-3" : "flex h-full min-h-0 flex-col gap-3"
      }
    >
      <FileViewerToolbar
        variant={variant}
        url={url}
        name={name}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        isSearchable={isSearchable}
        isZoomable={isZoomable}
        zoom={zoom}
        onZoom={setZoom}
        totalMatches={totalMatches}
        currentMatch={currentMatch}
        onGoToMatch={goToMatch}
      />
      <div className="flex-1 min-h-0 overflow-y-auto">
        {isImage ? (
          <div className="flex min-h-full items-start justify-center p-4">
            <MediaImage
              src={url}
              alt={name}
              className="rounded-lg object-contain"
              style={{ zoom, maxHeight: `${vh / zoom}vh` }}
              containerClassName="w-full max-w-3xl"
            />
          </div>
        ) : isPdf ? (
          <PdfViewer
            url={url}
            name={name}
            zoom={zoom}
            searchQuery={searchQuery}
            currentMatch={currentMatch}
            onMatchesChange={setTotalMatches}
          />
        ) : isVideo ? (
          <MediaVideo
            src={url}
            controls
            className={`mx-auto ${modal ? "max-h-[65vh]" : "max-h-[75vh]"} w-full rounded-lg`}
            containerClassName="mx-auto w-full max-w-3xl"
          />
        ) : isAudio ? (
          <audio src={url} controls className="w-full" />
        ) : modal ? (
          <div className="grid min-h-[25vh] place-items-center rounded-lg border border-dashed border-border/60 text-center text-sm text-muted-foreground">
            This file type can't be previewed.
          </div>
        ) : (
          <div className="grid min-h-[30vh] place-items-center rounded-lg border border-dashed border-border/60 text-center">
            <div className="space-y-2">
              <FileIcon className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">This file type can't be previewed.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
