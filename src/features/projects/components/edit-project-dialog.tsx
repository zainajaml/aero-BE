import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useProjects, type Project, type ProjectType } from "@/features/projects/project-context";
import { useUpdateProject } from "@/features/projects/hooks/use-project-mutations";
import { useAuth } from "@/features/auth/auth-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Button } from "@/shared/ui/button";
import { CTA_BUTTON } from "@/shared/lib/cta";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

export function EditProjectDialog({
  project,
  open,
  onOpenChange,
}: {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { accounts } = useProjects();
  const { hasRole } = useAuth();
  const canReassignAccount = hasRole("super_admin");
  const [name, setName] = useState(project.name);
  const [key, setKey] = useState(project.key);
  const [clientAccount, setClientAccount] = useState(project.clientAccount ?? "");
  const [description, setDescription] = useState(project.description ?? "");
  const [projectType, setProjectType] = useState<ProjectType>(project.projectType ?? "sprint");
  const [accountId, setAccountId] = useState<string>(project.accountId);

  useEffect(() => {
    if (open) {
      setName(project.name);
      setKey(project.key);
      setClientAccount(project.clientAccount ?? "");
      setDescription(project.description ?? "");
      setProjectType(project.projectType ?? "sprint");
      setAccountId(project.accountId);
    }
  }, [open, project]);

  const update = useUpdateProject(project, () => onOpenChange(false));

  const submit = () => {
    const cleanKey = key
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 8);
    if (!name.trim() || !cleanKey) return toast.error("Name and key required");
    update.mutate({
      patch: {
        name: name.trim(),
        key: cleanKey,
        clientAccount: clientAccount.trim() || null,
        description: description.trim() || null,
        projectType,
      },
      ...(canReassignAccount ? { accountId } : {}),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-glass-border">
        <DialogHeader>
          <DialogTitle>Edit project</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {canReassignAccount && (
            <div>
              <Label className="text-xs">Account</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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
            <Input value={projectType === "kanban" ? "Kanban" : "Sprint"} readOnly disabled />
            <p className="mt-1 text-xs text-muted-foreground">
              Project type cannot be changed after creation.
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
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" className={CTA_BUTTON} onClick={submit} disabled={update.isPending}>
            {update.isPending ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
