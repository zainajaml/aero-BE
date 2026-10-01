import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { useSaveRate } from "../hooks/use-rate-card";

export interface RateCardRow {
  id: string;
  role: string;
  location: string;
  hourlyRate: number;
  projectId: string;
  projectName: string;
  accountName: string;
}

export type RateEditorState = { mode: "create" } | { mode: "edit"; row: RateCardRow } | null;

export function RateEditorDialog({
  projectId,
  state,
  onClose,
}: {
  projectId: string;
  state: Exclude<RateEditorState, null>;
  onClose: () => void;
}) {
  const isEdit = state.mode === "edit";
  const [role, setRole] = useState(isEdit ? state.row.role : "");
  const [location, setLocation] = useState(isEdit ? state.row.location : "");
  const [rate, setRate] = useState(isEdit ? String(state.row.hourlyRate) : "");

  // Edits stay on the row's own project; new rates go to the open project.
  const mutation = useSaveRate(
    isEdit ? { projectId: state.row.projectId, rateId: state.row.id } : { projectId },
    onClose,
  );

  const save = () =>
    mutation.mutate({
      role: role.trim(),
      location: location.trim() || null,
      hourlyRate: Number(rate) || 0,
    });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Rate" : "Add Rate"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Role</label>
            <Input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Frontend"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Location</label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. India"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Hourly rate (USD)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!role.trim() || mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Save" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
