import { useState } from "react";

/** Multi-select of ticket rows; remembers the zone the last toggle happened in. */
export function useTicketSelection() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionZoneId, setSelectionZoneId] = useState<string | null>(null);
  const toggle = (id: string, next: boolean, zoneId: string) => {
    setSelectionZoneId(zoneId);
    setSelectedIds((prev) => (next ? [...new Set([...prev, id])] : prev.filter((x) => x !== id)));
  };
  const clear = () => {
    setSelectedIds([]);
    setSelectionZoneId(null);
  };
  return { selectedIds, setSelectedIds, selectionZoneId, toggle, clear };
}
