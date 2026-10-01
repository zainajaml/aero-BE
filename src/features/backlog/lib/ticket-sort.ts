import type { BacklogColumn, BacklogTicket, SortDir, SortKey } from "./backlog-types";

const PRIORITY_RANK: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

const COMPLEXITY_RANK: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };

function ticketNumber(code: string): number {
  const m = code.match(/(\d+)\s*$/);
  return m ? parseInt(m[1], 10) : 0;
}

export function sortTickets(
  items: BacklogTicket[],
  sortBy: SortKey,
  sortDir: SortDir,
  epicMap: Map<string, string[]>,
  columnMap: Map<string, BacklogColumn>,
  backlogOrderIndex: number = Infinity,
): BacklogTicket[] {
  if (sortBy === "default") return sortDir === "desc" ? [...items].reverse() : items;
  const arr = [...items];
  const dir = sortDir === "desc" ? -1 : 1;
  arr.sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case "priority":
        cmp = (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9);
        break;
      case "complexity":
        cmp = (COMPLEXITY_RANK[b.priority] ?? 0) - (COMPLEXITY_RANK[a.priority] ?? 0);
        break;
      case "number":
        cmp = ticketNumber(a.code) - ticketNumber(b.code);
        break;
      case "name":
        cmp = a.title.localeCompare(b.title);
        break;
      case "stage": {
        const ca = a.columnId
          ? (columnMap.get(a.columnId)?.orderIndex ?? Infinity)
          : backlogOrderIndex;
        const cb = b.columnId
          ? (columnMap.get(b.columnId)?.orderIndex ?? Infinity)
          : backlogOrderIndex;
        cmp = ca - cb;
        break;
      }
      case "epic": {
        const ea = (epicMap.get(a.id) ?? []).slice().sort()[0] ?? "";
        const eb = (epicMap.get(b.id) ?? []).slice().sort()[0] ?? "";
        if (!ea && !eb) cmp = 0;
        else if (!ea) cmp = 1;
        else if (!eb) cmp = -1;
        else cmp = ea.localeCompare(eb);
        break;
      }
      default:
        cmp = 0;
    }
    return cmp * dir;
  });
  return arr;
}

/** Manual ("User sorted") order: by server position, then code. */
export function orderManualTickets(items: BacklogTicket[]) {
  return [...items].sort((a, b) => a.position - b.position || a.code.localeCompare(b.code));
}
