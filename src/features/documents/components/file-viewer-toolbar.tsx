import {
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCcw,
  Search,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

/** Search / match navigation / zoom / download bar above a previewed file. */
export function FileViewerToolbar({
  variant,
  url,
  name,
  searchQuery,
  onSearchChange,
  isSearchable,
  isZoomable,
  zoom,
  onZoom,
  totalMatches,
  currentMatch,
  onGoToMatch,
}: {
  variant: "page" | "modal";
  url: string;
  name: string;
  searchQuery: string;
  onSearchChange?: (q: string) => void;
  isSearchable: boolean;
  isZoomable: boolean;
  zoom: number;
  onZoom: (zoom: number) => void;
  totalMatches: number;
  currentMatch: number;
  onGoToMatch: (delta: number) => void;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-card/50 p-2",
        variant === "modal" && "justify-between",
      )}
    >
      {onSearchChange && (
        <div
          className={cn(
            "flex flex-1 items-center gap-2",
            variant === "modal" ? "min-w-0" : "min-w-[180px]",
          )}
        >
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search in document..."
            className="h-8 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
          />
          {isSearchable && searchQuery.trim() && (
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {totalMatches > 0 ? `${currentMatch + 1} / ${totalMatches}` : "0 / 0"}
            </span>
          )}
        </div>
      )}
      <div className="flex items-center gap-2">
        {isSearchable && searchQuery.trim() && totalMatches > 0 && (
          <div className="flex items-center gap-1 rounded-md border border-border/60 bg-background/50 p-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onGoToMatch(-1)}
              aria-label="Previous match"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onGoToMatch(1)}
              aria-label="Next match"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="flex items-center gap-1 rounded-md border border-border/60 bg-background/50 p-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={!isZoomable || zoom <= 0.5}
            onClick={() => onZoom(Math.max(0.5, +(zoom - 0.1).toFixed(2)))}
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="min-w-[3ch] text-center text-xs font-medium tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={!isZoomable || zoom >= 3}
            onClick={() => onZoom(Math.min(3, +(zoom + 0.1).toFixed(2)))}
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={!isZoomable || zoom === 1}
            onClick={() => onZoom(1)}
            aria-label="Reset zoom"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
        <Button asChild size="sm" variant="outline" className="h-8 gap-1.5">
          <a href={url} download={name} target="_blank" rel="noreferrer">
            <Download className="h-3.5 w-3.5" />
            Download
          </a>
        </Button>
      </div>
    </div>
  );
}
