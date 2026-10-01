import { Check } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { STEPS } from "./onboarding-constants";

export function ProgressSteps({ step }: { step: number }) {
  return (
    <div className="mb-8 flex items-center">
      {STEPS.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] font-medium tabular-nums transition-colors",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && "border-primary text-primary",
                  !done && !active && "border-border text-muted-foreground",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  "hidden text-xs sm:inline",
                  active
                    ? "font-medium text-foreground"
                    : done
                      ? "text-foreground/70"
                      : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-3 h-px flex-1 transition-colors",
                  done ? "bg-primary/60" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
