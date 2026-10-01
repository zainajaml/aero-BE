import { useState } from "react";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { ConfirmDelete } from "@/shared/ui/confirm-delete";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { TableCell, TableRow } from "@/shared/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import type { AdministeredAccount } from "@/features/accounts/api/accounts.api";
import {
  useCreateAccount,
  useDeleteAccount,
  useMoveProject,
  useUpdateAccount,
} from "@/features/accounts/hooks/use-account-mutations";

export function CreateAccountButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const mutation = useCreateAccount(() => {
    setName("");
    setSlug("");
    setOpen(false);
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          New account
        </Button>
      </DialogTrigger>
      <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Create account</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Inc." />
          </div>
          <div>
            <Label className="text-xs">Slug (optional)</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="acme-inc" />
            <p className="mt-1 text-xs text-muted-foreground">
              Leave blank to auto-generate from the name.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate({ name, slug: slug || null })}
            disabled={!name.trim() || mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AccountRowView({ account }: { account: AdministeredAccount }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(account.name);
  const [slug, setSlug] = useState(account.slug);
  const save = useUpdateAccount(account.id, () => setEditing(false));
  // Without force the server refuses while the account still has projects.
  const remove = useDeleteAccount(account.id, {
    force: false,
    successMessage: () => "Account deleted",
  });

  return (
    <TableRow>
      <TableCell className="font-medium">
        {editing ? (
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8" />
        ) : (
          account.name
        )}
      </TableCell>
      <TableCell>
        {editing ? (
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} className="h-8" />
        ) : (
          <span className="text-sm text-muted-foreground">{account.slug}</span>
        )}
      </TableCell>
      <TableCell>
        {account.projects.length === 0 ? (
          <span className="text-sm text-muted-foreground">—</span>
        ) : (
          <span className="text-sm">{account.projects.map((p) => p.name).join(", ")}</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        {editing ? (
          <div className="flex justify-end gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => save.mutate({ name, slug })}
              disabled={save.isPending}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => {
                setName(account.name);
                setSlug(account.slug);
                setEditing(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex justify-end gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <ConfirmDelete
              onConfirm={() => remove.mutate()}
              title="Delete account?"
              description={
                account.projects.length > 0
                  ? `"${account.name}" still has ${account.projects.length} project(s). Move them to another account first.`
                  : `Permanently delete "${account.name}"?`
              }
              trigger={
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <Trash2 className="h-4 w-4" />
                </Button>
              }
            />
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

export function ProjectMoveRow({
  project,
  accounts,
}: {
  project: { id: string; name: string; key: string; accountId: string };
  accounts: AdministeredAccount[];
}) {
  const mutation = useMoveProject(project);
  return (
    <TableRow>
      <TableCell className="font-medium">{project.name}</TableCell>
      <TableCell className="text-sm text-muted-foreground">{project.key}</TableCell>
      <TableCell>
        <Select
          value={project.accountId}
          onValueChange={(v) => {
            if (v !== project.accountId) mutation.mutate(v);
          }}
          disabled={mutation.isPending}
        >
          <SelectTrigger className="h-8">
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
      </TableCell>
    </TableRow>
  );
}
