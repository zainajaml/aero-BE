import { useProjects } from "@/features/projects/project-context";
import { Check, ChevronsUpDown, Building2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

export function AccountSwitcher() {
  const { accounts, accountFilterId, setAccountFilterId } = useProjects();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // The account switcher is always shown once the user can reach an account.
  if (accounts.length === 0) return null;

  const active = accounts.find((a) => a.id === accountFilterId) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      {open && <div className="fixed inset-0 z-40 bg-black/65" aria-hidden />}
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-auto min-h-[2.75rem] w-full justify-between gap-2 bg-transparent py-1.5"
        >
          <span className="flex items-center gap-2 truncate">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-foreground" />
            <span className="flex flex-col items-start truncate text-left leading-none">
              <span className="text-[11px] text-muted-foreground">Account</span>
              <span className="truncate font-medium">
                {active ? active.name : "Select account"}
              </span>
            </span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[280px] border-amber-300/60 p-1">
        {accounts.map((a) => (
          <button
            key={a.id}
            onClick={() => {
              setAccountFilterId(a.id);
              setOpen(false);
              navigate({ to: "/dashboard" });
            }}
            className={cn(
              "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent/60",
              accountFilterId === a.id && "bg-accent/40",
            )}
          >
            <span className="truncate font-medium">{a.name}</span>
            {accountFilterId === a.id && <Check className="h-3.5 w-3.5 text-foreground" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
