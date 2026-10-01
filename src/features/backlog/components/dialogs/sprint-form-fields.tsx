import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Textarea } from "@/shared/ui/textarea";
import { DATE_RANGE_ERROR } from "@/shared/lib/date-validation";
import { cn } from "@/shared/lib/utils";

function SprintDatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(`${value}T00:00:00`) : undefined;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          {selected ? format(selected, "MMM d, yyyy") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => {
            onChange(d ? format(d, "yyyy-MM-dd") : "");
            setOpen(false);
          }}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}

export interface SprintFormValues {
  name: string;
  goal: string;
  startsAt: string;
  endsAt: string;
}

/** Name / goal / start / end fields shared by the create and edit sprint dialogs. */
export function SprintFormFields({
  values,
  onChange,
  datesInvalid,
}: {
  values: SprintFormValues;
  onChange: (patch: Partial<SprintFormValues>) => void;
  datesInvalid: boolean;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Name</Label>
        <Input
          value={values.name}
          onChange={(e) => onChange({ name: e.target.value.slice(0, 50) })}
          maxLength={50}
          placeholder="Sprint 5"
        />
        <p className="mt-1 text-right text-[11px] text-muted-foreground">{values.name.length}/50</p>
      </div>

      <div>
        <Label className="text-xs">Goal</Label>
        <Textarea
          value={values.goal}
          onChange={(e) => onChange({ goal: e.target.value.slice(0, 250) })}
          maxLength={250}
          placeholder="Ship onboarding redesign"
          className="min-h-[80px]"
        />
        <p className="mt-1 text-right text-[11px] text-muted-foreground">
          {values.goal.length}/250
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Start</Label>
          <SprintDatePicker value={values.startsAt} onChange={(v) => onChange({ startsAt: v })} />
        </div>
        <div>
          <Label className="text-xs">End</Label>
          <SprintDatePicker value={values.endsAt} onChange={(v) => onChange({ endsAt: v })} />
        </div>
      </div>
      {datesInvalid && <p className="text-xs font-medium text-destructive">{DATE_RANGE_ERROR}</p>}
    </div>
  );
}
