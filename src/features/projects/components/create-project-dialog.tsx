import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useProjects, type Project, type ProjectType } from "@/features/projects/project-context";
import { useCreateProject } from "@/features/projects/hooks/use-project-mutations";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Button } from "@/shared/ui/button";
import { CTA_BUTTON } from "@/shared/lib/cta";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Plus } from "lucide-react";

export function CreateProjectDialog({
  trigger,
  onCreated,
}: {
  trigger?: ReactNode;
  onCreated?: (project: Project) => void;
} = {}) {
  const { accountFilterId, accounts } = useProjects();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [clientAccount, setClientAccount] = useState("");
  const [description, setDescription] = useState("");
  const [projectType, setProjectType] = useState<ProjectType>("sprint");

  const lockedAccount = accounts.find((a) => a.id === accountFilterId) ?? null;

  const create = useCreateProject((project) => {
    onCreated?.(project);
    setOpen(false);
    setName("");
    setKey("");
    setClientAccount("");
    setDescription("");
    setProjectType("sprint");
  });

  const submit = () => {
    if (!accountFilterId) return toast.error("Open an account before creating a project");
    const cleanKey = key
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 8);
    if (!name.trim() || !cleanKey) return toast.error("Name and key required");
    create.mutate({
      accountId: accountFilterId,
      name: name.trim(),
      key: cleanKey,
      projectType,
      clientAccount: clientAccount.trim() || null,
      description: description.trim() || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            New project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="glass border-glass-border">
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Account</Label>
            <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm">
              {lockedAccount?.name ?? "No account selected"}
            </div>
          </div>

          <div>
            <Label className="text-xs">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Atlas Web App"
            />
          </div>
          <div>
            <Label className="text-xs">Type</Label>
            <Select value={projectType} onValueChange={(v) => setProjectType(v as ProjectType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sprint">Sprint</SelectItem>
                <SelectItem value="kanban">Kanban</SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">
              Kanban projects have no backlog or Gantt view.
            </p>
          </div>
          <div>
            <Label className="text-xs">Key (2-8 letters)</Label>
            <Input
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase())}
              placeholder="ATLAS"
              maxLength={8}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Used in ticket codes (e.g. ATLAS-12)
            </p>
          </div>
          <div>
            <Label className="text-xs">Client contact (optional)</Label>
            <Input
              value={clientAccount}
              onChange={(e) => setClientAccount(e.target.value)}
              placeholder="Acme Inc."
            />
          </div>
          <div>
            <Label className="text-xs">Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" className={CTA_BUTTON} onClick={submit} disabled={create.isPending}>
            {create.isPending ? "Creating…" : "Create project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
