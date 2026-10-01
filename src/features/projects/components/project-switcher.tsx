import { useProjects } from "@/features/projects/project-context";
import { Check, ChevronsUpDown, Folder, Layers } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

export function ProjectSwitcher() {
  const {
    visibleProjects: projects,
    activeProject,
    isAllProjects,
    setActiveProjectId,
  } = useProjects();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

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
            {isAllProjects ? (
              <Layers className="h-3.5 w-3.5 shrink-0 text-foreground" />
            ) : (
              <Folder className="h-3.5 w-3.5 shrink-0 text-foreground" />
            )}
            <span className="flex flex-col items-start truncate text-left leading-none">
              <span className="text-[11px] text-muted-foreground">Project</span>
              <span className="truncate">
                {isAllProjects ? (
                  <span className="font-medium">Select Project</span>
                ) : activeProject ? (
                  <>
                    <span className="font-mono text-xs text-muted-foreground">
                      {activeProject.key}
                    </span>{" "}
                    <span className="font-medium">{activeProject.name}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">No project</span>
                )}
              </span>
            </span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[280px] border-amber-300/60 p-1">
        {projects.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">No projects yet</div>
        ) : (
          [...projects]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setActiveProjectId(p.id);
                  setOpen(false);
                  navigate({ to: "/dashboard" });
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent/60",
                  !isAllProjects && p.id === activeProject?.id && "bg-accent/40",
                )}
              >
                <span className="flex items-center gap-2 truncate">
                  <span className="font-mono text-xs text-muted-foreground">{p.key}</span>
                  <span className="truncate font-medium">{p.name}</span>
                </span>
                {!isAllProjects && p.id === activeProject?.id && (
                  <Check className="h-3.5 w-3.5 text-foreground" />
                )}
              </button>
            ))
        )}
      </PopoverContent>
    </Popover>
  );
}
