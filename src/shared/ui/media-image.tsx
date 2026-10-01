import { useEffect, useState } from "react";
import { RefreshCw, ImageOff, Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface MediaImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  /** Source URL. Pass `null`/`undefined` while it is still being resolved. */
  src?: string | null;
  alt: string;
  /** Classes for the wrapper that reserves space (skeleton + error live here). */
  containerClassName?: string;
  /** CSS aspect-ratio used to reserve space before the media has loaded. */
  aspectRatio?: string;
  /** Inline styles applied to the space-reserving wrapper. */
  containerStyle?: React.CSSProperties;
}

/**
 * Image with a universal loading experience: an immediate skeleton, reserved
 * dimensions to avoid layout shift, and an error state with retry.
 */
export function MediaImage({
  src,
  alt,
  className,
  containerClassName,
  aspectRatio = "16 / 10",
  style,
  containerStyle,
  ...rest
}: MediaImageProps) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setState("loading");
  }, [src, attempt]);

  const pending = !src || state !== "ready";

  return (
    <span
      className={cn(
        "relative block overflow-hidden rounded-lg",
        pending && "bg-muted/50",
        containerClassName,
      )}
      style={pending ? { aspectRatio, minWidth: "6rem", ...containerStyle } : containerStyle}
    >
      {src && (
        <img
          {...rest}
          key={attempt}
          src={src}
          alt={alt}
          style={style}

          loading={rest.loading ?? "lazy"}
          decoding="async"
          onLoad={() => setState("ready")}
          onError={() => setState("error")}
          className={cn(
            className,
            state === "ready" ? "opacity-100" : "absolute inset-0 h-full w-full opacity-0",
            "transition-opacity duration-200",
          )}
        />
      )}

      {pending && state !== "error" && (
        <span
          className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-lg bg-muted/70"
          aria-label="Loading image"
          role="status"
        >
          <span className="absolute inset-0 animate-pulse bg-muted" aria-hidden />
          <Loader2 className="relative h-6 w-6 animate-spin text-muted-foreground" aria-hidden />
        </span>
      )}

      {state === "error" && (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 bg-muted/40 p-2 text-center">
          <ImageOff className="h-4 w-4 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">Couldn’t load media</span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setAttempt((a) => a + 1);
            }}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] hover:bg-accent"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </span>
      )}
    </span>
  );
}

interface MediaVideoProps extends Omit<React.VideoHTMLAttributes<HTMLVideoElement>, "src"> {
  src?: string | null;
  containerClassName?: string;
  aspectRatio?: string;
}

/** Video with the same skeleton / reserved-space / retry behaviour. */
export function MediaVideo({
  src,
  className,
  containerClassName,
  aspectRatio = "16 / 9",
  style,
  ...rest
}: MediaVideoProps) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setState("loading");
  }, [src, attempt]);

  const pending = !src || state !== "ready";

  return (
    <span
      className={cn(
        "relative block overflow-hidden rounded-lg",
        pending && "bg-muted/50",
        containerClassName,
      )}
      style={pending ? { aspectRatio, ...style } : style}
    >
      {src && (
        <video
          {...rest}
          key={attempt}
          src={src}
          preload={rest.preload ?? "metadata"}
          onLoadedData={() => setState("ready")}
          onError={() => setState("error")}
          className={cn(
            className,
            state === "ready" ? "opacity-100" : "absolute inset-0 h-full w-full opacity-0",
            "transition-opacity duration-200",
          )}
        />
      )}
      {pending && state !== "error" && (
        <span className="absolute inset-0 animate-pulse rounded-lg bg-muted/70" aria-hidden />
      )}
      {state === "error" && (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 bg-muted/40 text-center">
          <span className="text-[11px] text-muted-foreground">Couldn’t load media</span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setAttempt((a) => a + 1);
            }}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] hover:bg-accent"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </span>
      )}
    </span>
  );
}
