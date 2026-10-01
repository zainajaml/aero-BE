import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "soft";
}

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(variant === "soft" ? "glass-soft" : "glass", "rounded-2xl", className)}
      {...props}
    />
  ),
);
GlassPanel.displayName = "GlassPanel";
