import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarOff, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { NeonBadge } from "@/shared/ui/glass/neon-badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { DATE_RANGE_ERROR, isInvalidDateRange } from "@/shared/lib/date-validation";
import { errorMessage } from "@/shared/api/errors";
import { useAddTimeOff, useDeleteTimeOff, useMyTimeOff } from "../hooks/profile-queries";
import { TIME_OFF_KINDS, type TimeOffKind } from "../lib/profile";
import { DateField } from "./date-field";

function fmtDate(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function daysBetween(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(ms / (24 * 60 * 60 * 1000)) + 1);
}

/** Time off — container-less, matches other pages. */
export function TimeOffPanel({ userId }: { userId: string | undefined }) {
  const { data: timeOff = [] } = useMyTimeOff(userId);
  const add = useAddTimeOff(userId);
  const remove = useDeleteTimeOff(userId);

  const [kind, setKind] = useState<TimeOffKind>("holiday");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [note, setNote] = useState("");
  const timeOffDatesInvalid = isInvalidDateRange(startDate, endDate);

  async function addTimeOff() {
    if (!userId) return;
    if (!startDate || !endDate) {
      toast.error("Pick a start and end date.");
      return;
    }
    if (isInvalidDateRange(startDate, endDate)) {
      toast.error(DATE_RANGE_ERROR);
      return;
    }
    try {
      await add.mutateAsync({ kind, startDate, endDate, note: note.trim() || null });
    } catch (err) {
      toast.error(errorMessage(err, "Failed to add time off."));
      return;
    }
    setStartDate("");
    setEndDate("");
    setNote("");
    setKind("holiday");
    toast.success("Time off added.");
  }

  function deleteTimeOff(id: string) {
    remove.mutate(id, {
      onError: (err) => toast.error(errorMessage(err, "Failed to remove time off.")),
    });
  }

  return (
    <div className="max-w-4xl px-3">
      <div className="mb-5 flex items-center gap-2">
        <CalendarOff className="h-4 w-4 text-neon-rose" />
        <h2 className="text-sm font-medium">Time off &amp; sick days</h2>
      </div>

      {/* Add form */}
      <div className="mb-6 grid gap-3 rounded-xl border border-border/50 bg-card/30 p-4 sm:grid-cols-3 sm:items-end">
        <div className="space-y-1.5">
          <Label className="text-muted-foreground">Type</Label>
          <Select value={kind} onValueChange={(v) => setKind(v as TimeOffKind)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_OFF_KINDS.map((k) => (
                <SelectItem key={k.value} value={k.value}>
                  {k.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-muted-foreground">From</Label>
          <DateField value={startDate} onChange={setStartDate} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-muted-foreground">To</Label>
          <DateField value={endDate} onChange={setEndDate} min={startDate || undefined} />
        </div>
        {timeOffDatesInvalid && (
          <p className="text-xs font-medium text-destructive sm:col-span-3">{DATE_RANGE_ERROR}</p>
        )}
        <div className="flex items-end gap-3 sm:col-span-3">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="note" className="text-muted-foreground">
              Note (optional)
            </Label>
            <Input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              placeholder="Reason / details"
            />
          </div>
          <Button
            onClick={() => void addTimeOff()}
            disabled={add.isPending || timeOffDatesInvalid}
            className="shrink-0"
          >
            {add.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            <span className="ml-1">Add</span>
          </Button>
        </div>
      </div>

      {/* List */}
      {timeOff.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No time off blocks yet. Add holidays or sick days above.
        </p>
      ) : (
        <div className="divide-y divide-border/40">
          {timeOff.map((t, i) => {
            const meta = TIME_OFF_KINDS.find((k) => k.value === t.kind);
            const days = daysBetween(t.startDate, t.endDate);
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                className="flex items-center gap-3 py-3"
              >
                <NeonBadge tone={meta?.tone ?? "muted"} className="px-2 py-0.5">
                  {meta?.label ?? t.kind}
                </NeonBadge>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">
                    {fmtDate(t.startDate)} – {fmtDate(t.endDate)}
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({days} day{days === 1 ? "" : "s"})
                    </span>
                  </div>
                  {t.note && <div className="truncate text-xs text-muted-foreground">{t.note}</div>}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteTimeOff(t.id)}
                  aria-label="Remove time off"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
