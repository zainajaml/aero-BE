import { useEffect, useState } from "react";

/** Collapsed state of the timeline groups, remembered per project (or "all") in localStorage. */
export function useCollapsedGroups(projectId: string | null | undefined) {
  const storageKey = `gantt:collapsedGroups:${projectId ?? "all"}`;
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      setCollapsed(raw ? (JSON.parse(raw) as Record<string, boolean>) : {});
    } catch {
      setCollapsed({});
    }
    setLoadedKey(storageKey);
  }, [storageKey]);

  useEffect(() => {
    if (loadedKey !== storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(collapsed));
    } catch {
      /* ignore storage errors */
    }
  }, [storageKey, collapsed, loadedKey]);

  const toggle = (id: string) => setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  return { collapsed, toggle };
}
