import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";

// Polyfill for Map.prototype.getOrInsertComputed, used by pdfjs-dist v6 in
// environments where the TC39 proposal isn't yet native (e.g. older Chromium).
if (typeof Map !== "undefined") {
  const proto = Map.prototype as unknown as Record<string, unknown>;
  if (typeof proto.getOrInsertComputed !== "function") {
    proto.getOrInsertComputed = function <K, V>(
      this: Map<K, V>,
      key: K,
      callback: (key: K) => V,
    ): V {
      if (!this.has(key)) {
        this.set(key, callback(key));
      }
      return this.get(key) as V;
    };
  }
}

// Render PDFs with pdf.js to canvases. The app preview runs inside a sandboxed
// iframe where Chrome's native PDF plugin (used by <iframe>/<embed>) is blocked,
// so we rasterize each page ourselves to guarantee it renders everywhere.
//
// Supports in-document text search with highlight overlays and current-match
// navigation. Search state (query + current match index) is owned by the parent.

type PDFDocumentProxy = import("pdfjs-dist").PDFDocumentProxy;
type PDFPageProxy = import("pdfjs-dist").PDFPageProxy;

interface Highlight {
  x: number;
  y: number;
  width: number;
  height: number;
  isCurrent: boolean;
}

interface TextRun {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

function PdfPage({
  doc,
  pageNumber,
  zoom,
  query,
  currentMatch,
  onMatchCount,
}: {
  doc: PDFDocumentProxy;
  pageNumber: number;
  zoom: number;
  query: string;
  currentMatch: number | null;
  onMatchCount: (count: number) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [page, setPage] = useState<PDFPageProxy | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [render, setRender] = useState<{
    width: number;
    height: number;
    scale: number;
  } | null>(null);

  // Load the page proxy.
  useEffect(() => {
    let cancelled = false;
    setPage(null);
    doc.getPage(pageNumber).then((p) => {
      if (!cancelled) setPage(p);
    });
    return () => {
      cancelled = true;
    };
  }, [doc, pageNumber]);

  // Render the page to a canvas whenever the page or zoom changes.
  useEffect(() => {
    if (!page || !canvasRef.current || !wrapperRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Measure the available width from the scroll parent, not the wrapper: the
    // wrapper gets an explicit width after the first render, which would make a
    // second measurement pick up the previous render's width.
    const containerWidth =
      wrapperRef.current.parentElement?.clientWidth ||
      wrapperRef.current.clientWidth ||
      800;
    const baseViewport = page.getViewport({ scale: 1 });
    const fitScale = Math.min(2, containerWidth / baseViewport.width);
    const scale = fitScale * zoom;
    const viewport = page.getViewport({ scale });

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    ctx.scale(dpr, dpr);

    setRender({ width: viewport.width, height: viewport.height, scale });

    const renderTask = page.render({ canvasContext: ctx, viewport, canvas });
    renderTask.promise.catch(() => {});

    return () => {
      try {
        renderTask.cancel();
      } catch {
        // ignore
      }
    };
  }, [page, zoom]);

  // Extract text and compute highlight overlays for the current query.
  useEffect(() => {
    if (!page || !render) {
      onMatchCount(0);
      return;
    }
    const q = query.trim().toLowerCase();
    if (!q) {
      setHighlights([]);
      onMatchCount(0);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        // Use exactly the viewport the canvas was rendered with.
        const viewport = page.getViewport({ scale: render.scale });

        const textContent = await page.getTextContent();
        const runs: TextRun[] = [];
        for (const item of textContent.items) {
          const raw = item as {
            str?: string;
            width?: number;
            height?: number;
            transform?: number[];
          };
          if (!raw.str || !raw.str.trim() || !raw.transform) continue;
          const t = pdfjs.Util.transform(viewport.transform, raw.transform);
          // t = [a, b, c, d, e, f]: e/f is the baseline origin in device space.
          const fontHeight = Math.hypot(t[2], t[3]) || Math.abs(t[3]) || 10;
          const runWidth = (raw.width || 0) * render.scale;
          runs.push({
            str: raw.str,
            x: t[4],
            y: t[5],
            width: runWidth,
            height: fontHeight,
          });
        }

        const pageHighlights: Highlight[] = [];
        for (const run of runs) {
          if (run.width <= 0) continue;
          const lower = run.str.toLowerCase();
          const perChar = run.str.length > 0 ? run.width / run.str.length : 0;
          let start = 0;
          while (start < run.str.length) {
            const idx = lower.indexOf(q, start);
            if (idx === -1) break;
            pageHighlights.push({
              x: run.x + perChar * idx,
              y: run.y - run.height * 0.85,
              width: Math.max(2, perChar * q.length),
              height: run.height * 1.1,
              isCurrent: false,
            });
            start = idx + q.length;
          }
        }


        if (cancelled) return;
        setHighlights(pageHighlights);
        onMatchCount(pageHighlights.length);
      } catch {
        if (!cancelled) {
          setHighlights([]);
          onMatchCount(0);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [page, query, render, onMatchCount]);


  // Mark the current global match and scroll it into view.
  const currentLocalIndex = useMemo(() => {
    if (currentMatch === null || highlights.length === 0) return null;
    return currentMatch;
  }, [currentMatch, highlights.length]);

  useEffect(() => {
    if (currentLocalIndex === null || currentLocalIndex >= highlights.length) return;
    const el = wrapperRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [currentLocalIndex]);

  const effectiveHighlights = highlights.map((h, i) => ({
    ...h,
    isCurrent: currentLocalIndex === i,
  }));

  return (
    <div
      ref={wrapperRef}
      className="relative mx-auto w-fit"
      style={{ width: render?.width }}
    >
      <canvas
        ref={canvasRef}
        className="rounded-lg border border-border/60 shadow-sm"
      />
      {effectiveHighlights.map((h, i) => (
        <div
          key={i}
          className={cn(
            "absolute pointer-events-none rounded-[2px] mix-blend-multiply transition-colors",
            h.isCurrent
              ? "bg-orange-400/80 ring-1 ring-orange-500/80"
              : "bg-yellow-300/70"
          )}
          style={{
            left: h.x,
            top: h.y,
            width: h.width,
            height: h.height,
          }}
        />
      ))}

    </div>
  );
}

export function PdfViewer({
  url,
  name,
  zoom = 1,
  searchQuery = "",
  currentMatch = 0,
  onMatchesChange,
}: {
  url: string;
  name: string;
  zoom?: number;
  searchQuery?: string;
  currentMatch?: number;
  onMatchesChange?: (total: number) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [matchCounts, setMatchCounts] = useState<Record<number, number>>({});

  // Load the PDF document.
  useEffect(() => {
    let cancelled = false;
    const cleanups: Array<() => void> = [];
    setLoading(true);
    setError(false);
    setDoc(null);
    setMatchCounts({});
    onMatchesChange?.(0);

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        const workerSrc = (
          await import("pdfjs-dist/build/pdf.worker.min.mjs?url")
        ).default;
        pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

        const loadingTask = pdfjs.getDocument({ url });
        const d = await loadingTask.promise;
        if (cancelled) return;
        setDoc(d);
        setLoading(false);
        cleanups.push(() => void loadingTask.destroy());
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
    };
  }, [url, onMatchesChange]);

  const totalMatches = useMemo(
    () => Object.values(matchCounts).reduce((a, b) => a + b, 0),
    [matchCounts]
  );

  useEffect(() => {
    onMatchesChange?.(totalMatches);
  }, [totalMatches, onMatchesChange]);

  // Compute the global current match index per page.
  const currentMatchByPage = useMemo(() => {
    if (!doc) return {} as Record<number, number | null>;
    const result: Record<number, number | null> = {};
    let remaining = currentMatch;
    for (let i = 1; i <= doc.numPages; i++) {
      const count = matchCounts[i] || 0;
      if (remaining < count) {
        result[i] = remaining;
        remaining = -1;
      } else {
        result[i] = null;
        remaining -= count;
      }
    }
    return result;
  }, [doc, matchCounts, currentMatch]);

  const handleMatchCount = useCallback(
    (pageNumber: number, count: number) => {
      setMatchCounts((prev) => (prev[pageNumber] === count ? prev : { ...prev, [pageNumber]: count }));
    },
    [],
  );

  return (
    <div className="relative">
      {loading && (
        <div className="grid min-h-[50vh] place-items-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}
      {error && !loading && (
        <div className="grid min-h-[40vh] place-items-center text-center text-sm text-muted-foreground">
          Could not render this PDF. Use the download button to open it.
        </div>
      )}
      <div
        aria-label={name}
        className="flex max-h-[75vh] flex-col gap-4 overflow-y-auto"
      >
        {doc &&
          Array.from({ length: doc.numPages }, (_, i) => i + 1).map((pageNumber) => (
            <PdfPage
              key={`${url}-${pageNumber}-${zoom}`}
              doc={doc}
              pageNumber={pageNumber}
              zoom={zoom}
              query={searchQuery}
              currentMatch={currentMatchByPage[pageNumber] ?? null}
              onMatchCount={(count) => handleMatchCount(pageNumber, count)}
            />
          ))}
      </div>
    </div>
  );
}
