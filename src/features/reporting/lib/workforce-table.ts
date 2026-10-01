import type { Utilization } from "../api/reporting.api";

export type UtilizationMember = Utilization["members"][number];

export type SortKey =
  | "name"
  | "jobTitle"
  | "role"
  | "projects"
  | "tickets"
  | "available"
  | "logged"
  | "utilization";
export type SortDir = "asc" | "desc";

export const COLUMNS: { key: SortKey; label: string; w: string; align?: string }[] = [
  { key: "name", label: "Member", w: "200px" },
  { key: "jobTitle", label: "Job Title", w: "150px" },
  { key: "role", label: "Role", w: "110px" },
  { key: "projects", label: "Project", w: "100px" },
  { key: "tickets", label: "Ticket ID's", w: "130px" },
  { key: "available", label: "Available", w: "90px", align: "text-right" },
  { key: "logged", label: "Logged", w: "90px", align: "text-right" },
  { key: "utilization", label: "Utilization", w: "120px", align: "text-right" },
];

/** Projects (within the selected one) where the member logged time in the window. */
export const projectCount = (m: UtilizationMember) => (m.loggedMinutes > 0 ? 1 : 0);

/** Ticket code shown for a logged ticket (short id when the code is unknown). */
export const ticketLabel = (t: UtilizationMember["tickets"][number]) =>
  t.code || t.ticketId.slice(0, 8);

export function defaultDirFor(key: SortKey): SortDir {
  return key === "name" || key === "jobTitle" || key === "role" ? "asc" : "desc";
}

/** Text filter + column sort over the server's member rows (presentation only). */
export function filterAndSortMembers(
  members: UtilizationMember[],
  filter: string,
  sortKey: SortKey,
  sortDir: SortDir,
  project: { name: string; key: string } | null,
): UtilizationMember[] {
  const q = filter.trim().toLowerCase();
  const filtered = q
    ? members.filter((m) => {
        const hay = [
          m.displayName,
          m.jobTitle ?? "",
          m.role,
          projectCount(m) && project ? `${project.name} ${project.key}` : "",
          m.tickets.map(ticketLabel).join(" "),
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
    : members;
  const dir = sortDir === "asc" ? 1 : -1;
  return [...filtered].sort((a, b) => {
    switch (sortKey) {
      case "name":
        return a.displayName.localeCompare(b.displayName) * dir;
      case "jobTitle":
        return (a.jobTitle ?? "").localeCompare(b.jobTitle ?? "") * dir;
      case "role":
        return a.role.localeCompare(b.role) * dir;
      case "projects":
        return (projectCount(a) - projectCount(b)) * dir;
      case "tickets":
        return (a.tickets.length - b.tickets.length) * dir;
      case "available":
        return 0;
      case "utilization":
        return (a.utilization - b.utilization) * dir;
      case "logged":
      default:
        return (a.loggedMinutes - b.loggedMinutes) * dir;
    }
  });
}
