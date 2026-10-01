import { useEffect, useState } from "react";

/** Collapsed state of each sprint panel, remembered per project in localStorage. */
export function useCollapsedSprints(projectId: string | null | undefined) {
  const storageKey = projectId ? `backlog:collapsedSprints:${projectId}` : null;
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!storageKey) {
      setCollapsed({});
      setLoadedKey(null);
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey);
      setCollapsed(raw ? (JSON.parse(raw) as Record<string, boolean>) : {});
    } catch {
      setCollapsed({});
    }
    setLoadedKey(storageKey);
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey || loadedKey !== storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(collapsed));
    } catch {
      /* ignore storage errors */
    }
  }, [storageKey, collapsed, loadedKey]);

  const toggle = (sprintId: string) => setCollapsed((c) => ({ ...c, [sprintId]: !c[sprintId] }));
  return { collapsed, toggle };
}
