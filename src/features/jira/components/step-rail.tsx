import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/shared/lib/utils";

const STEPS = ["Connect Jira", "Import project", "Invite team"] as const;

export function StepRail({ current }: { current: number }) {
  return (
    <div className="flex w-full items-center">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={label}>
            <div className="flex items-center gap-2 sm:gap-3">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && !done && "border-primary text-primary",
                  !done && !active && "border-border text-muted-foreground",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-sm sm:text-base",
                  active ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span className={cn("mx-3 h-px flex-1 sm:mx-6", done ? "bg-primary" : "bg-border")} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
