/** Human-facing labels for app roles. `admin` is a per-project admin. */
const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  account_admin: "Account Admin",
  admin: "Project Admin",
  developer: "Developer",
  team: "Team",
  viewer: "Viewer",
};

export function roleLabel(role: string | null | undefined): string {
  if (!role) return "—";
  return ROLE_LABELS[role] ?? role.replace(/_/g, " ");
}
