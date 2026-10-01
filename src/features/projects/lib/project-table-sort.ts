import { compareAsc, compareDesc } from "date-fns";
import type { Project } from "../api/projects.api";

export type SortDir = "asc" | "desc" | null;
export type SortKey =
  | "account"
  | "key"
  | "name"
  | "type"
  | "status"
  | "sprints"
  | "tickets"
  | "started"
  | "finished"
  | null;
export type ProjectRowStat = {
  tickets: number;
  sprints: number;
  status: string;
  finished: string | null;
};

export function sortProjects(
  rows: Project[],
  stats: Record<string, ProjectRowStat>,
  accountById: Map<string, string>,
  sortKey: SortKey,
  sortDir: SortDir,
): Project[] {
  if (!sortKey || !sortDir) return rows;
  return [...rows].sort((a, b) => {
    const sa = stats[a.id];
    const sb = stats[b.id];
    switch (sortKey) {
      case "account": {
        const aa = accountById.get(a.accountId) ?? "";
        const ab = accountById.get(b.accountId) ?? "";
        return sortDir === "asc" ? aa.localeCompare(ab) : ab.localeCompare(aa);
      }
      case "key":
        return sortDir === "asc" ? a.key.localeCompare(b.key) : b.key.localeCompare(a.key);
      case "name":
        return sortDir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      case "type":
        return sortDir === "asc"
          ? a.projectType.localeCompare(b.projectType)
          : b.projectType.localeCompare(a.projectType);
      case "status":
        return sortDir === "asc"
          ? (sa?.status ?? "").localeCompare(sb?.status ?? "")
          : (sb?.status ?? "").localeCompare(sa?.status ?? "");
      case "sprints":
        return sortDir === "asc"
          ? (sa?.sprints ?? 0) - (sb?.sprints ?? 0)
          : (sb?.sprints ?? 0) - (sa?.sprints ?? 0);
      case "tickets":
        return sortDir === "asc"
          ? (sa?.tickets ?? 0) - (sb?.tickets ?? 0)
          : (sb?.tickets ?? 0) - (sa?.tickets ?? 0);
      case "started":
        return sortDir === "asc"
          ? compareAsc(new Date(a.createdAt), new Date(b.createdAt))
          : compareDesc(new Date(a.createdAt), new Date(b.createdAt));
      case "finished": {
        const da = sa?.finished ? new Date(sa.finished) : new Date(0);
        const db = sb?.finished ? new Date(sb.finished) : new Date(0);
        return sortDir === "asc" ? compareAsc(da, db) : compareDesc(da, db);
      }
      default:
        return 0;
    }
  });
}
