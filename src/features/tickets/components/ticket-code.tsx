import { cn } from "@/shared/lib/utils";

/**
 * Fixed-width, left-aligned ticket key so titles always start at the same X position.
 * Long keys truncate with an ellipsis instead of pushing the title right.
 */
export function TicketCode({
  code,
  className,
  size = "sm",
}: {
  code: string;
  className?: string;
  size?: "sm" | "xs";
}) {
  return (
    <span
      title={code}
      className={cn(
        "block w-[72px] shrink-0 truncate text-left font-mono uppercase tracking-widest text-muted-foreground",
        size === "sm" ? "text-[10px]" : "text-[11px]",
        className,
      )}
    >
      {code}
    </span>
  );
}
