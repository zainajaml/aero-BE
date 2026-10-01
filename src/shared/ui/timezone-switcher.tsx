import { Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { useTimezone, TIMEZONES, type TzCode } from "@/features/users/lib/timezone";

export function TimezoneSwitcher() {
  const { tz, setTz } = useTimezone();
  return (
    <Select value={tz} onValueChange={(v) => setTz(v as TzCode)}>
      <SelectTrigger className="h-9 w-[180px] gap-2" aria-label="Reporting timezone">
        <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {TIMEZONES.map((t) => (
          <SelectItem key={t.code} value={t.code}>
            {t.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
