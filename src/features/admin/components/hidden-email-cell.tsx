import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { EyeOff, Loader2, Plus } from "lucide-react";
import { errorMessage } from "@/shared/api/errors";
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
import { displayName } from "@/features/users/lib/names";
import { setImportedUserEmail, type OrgUser } from "../api/admin.api";

/**
 * Jira hides some people's email addresses, so imports create them with an
 * internal placeholder. Admins can add the real email here, which makes the
 * person invitable like anyone else.
 */
export function HiddenEmailCell({ user, onSaved }: { user: OrgUser; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");

  const mutation = useMutation({
    mutationFn: () => setImportedUserEmail(user.id, email.trim()),
    onSuccess: () => {
      toast.success("Email added");
      setOpen(false);
      setEmail("");
      onSaved();
    },
    onError: (e) => toast.error(errorMessage(e) || "Could not add that email"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex max-w-full items-center gap-1.5 truncate text-left text-sm text-muted-foreground hover:text-foreground"
          title="Email hidden in Jira — add the real address"
        >
          <EyeOff className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate italic">Email hidden in Jira</span>
          <Plus className="h-3.5 w-3.5 shrink-0" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add email for {displayName(user, "this person")}</DialogTitle>
          <DialogDescription>
            Jira kept this person's email private, so their work was imported under a placeholder.
            Add their real email to make them invitable.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="imported-email">Email address</Label>
          <Input
            id="imported-email"
            type="email"
            value={email}
            placeholder="name@company.com"
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && email.trim() && !mutation.isPending) {
                mutation.mutate();
              }
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={!email.trim() || mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
