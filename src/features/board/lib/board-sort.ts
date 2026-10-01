import type { BoardTicket, SortKey } from "./board-types";

const PRIORITY_RANK: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

function ticketNumber(code: string): number {
  const m = (code ?? "").match(/(\d+)\s*$/);
  return m ? parseInt(m[1], 10) : 0;
}

/** Manual order: by server position, then code. */
export function orderByPosition<T extends { position: number; code: string }>(items: T[]) {
  return [...items].sort((a, b) => a.position - b.position || a.code.localeCompare(b.code));
}

export function sortBoardTickets(
  items: BoardTicket[],
  sortBy: SortKey,
  sortDir: "asc" | "desc",
  epicMap: Map<string, string[]>,
): BoardTicket[] {
  if (sortBy === "manual") {
    const ordered = orderByPosition(items);
    return sortDir === "desc" ? ordered.reverse() : ordered;
  }
  if (sortBy === "default") return sortDir === "desc" ? [...items].reverse() : [...items];
  const arr = [...items];
  const dir = sortDir === "desc" ? -1 : 1;
  arr.sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case "priority":
        cmp = (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9);
        break;
      case "number":
        cmp = ticketNumber(a.code) - ticketNumber(b.code);
        break;
      case "name":
        cmp = a.title.localeCompare(b.title);
        break;
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
