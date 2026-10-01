import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Plus } from "lucide-react";
import { CTA_BUTTON } from "@/shared/lib/cta";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { useProjects } from "@/features/projects/project-context";
import { useCreateAccount } from "../hooks/use-account-mutations";

/** "New account" in Admin › Accounts & projects, then offers to switch to it. */
export function CreateAccountButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [created, setCreated] = useState<{ id: string; name: string } | null>(null);
  const { refetch, setAccountFilterId } = useProjects();
  const navigate = useNavigate();
  const mutation = useCreateAccount((row) => {
    setName("");
    setOpen(false);
    refetch();
    setCreated({ id: row.id, name: row.name });
  });

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            New account
          </Button>
        </DialogTrigger>
        <DialogContent className="glass border-glass-border">
          <DialogHeader>
            <DialogTitle>Create account</DialogTitle>
            <DialogDescription>Accounts group projects and their members.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Inc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              className={CTA_BUTTON}
              onClick={() => mutation.mutate({ name, slug: null })}
              disabled={!name.trim() || mutation.isPending}
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!created} onOpenChange={(o) => !o && setCreated(null)}>
        <AlertDialogContent className="glass border-glass-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Switch to {created?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{created?.name}</span> is ready. You can
              switch your workspace to it now and set up its first project, or keep working in your
              current account and switch later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay here</AlertDialogCancel>
            <AlertDialogAction
              className={CTA_BUTTON}
              onClick={() => {
                if (created) setAccountFilterId(created.id);
                setCreated(null);
                void navigate({ to: "/dashboard" });
              }}
            >
              Switch to new account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
