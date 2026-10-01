import type { AppRole } from "@/features/auth/api/auth.api";

export const ROLE_OPTIONS = [
  { value: "super_admin", label: "Super Admin" },
  { value: "account_admin", label: "Account Admin" },
  { value: "admin", label: "Project Admin" },
  { value: "team", label: "Team" },
  { value: "developer", label: "Developer" },
  { value: "viewer", label: "Viewer" },
] as const satisfies readonly { value: AppRole; label: string }[];

export type RoleValue = (typeof ROLE_OPTIONS)[number]["value"];

const CLIENT_ROLE_VALUES: RoleValue[] = ["admin", "developer", "team", "viewer"];
export const isClientRole = (r: string) => (CLIENT_ROLE_VALUES as string[]).includes(r);

export const roleLabel = (r: string | null) => ROLE_OPTIONS.find((o) => o.value === r)?.label ?? "—";

/** Roles an admin may hand out (client admins: project roles only; Super Admin: super admins only). */
export function assignableRoles(clientAdminOnly: boolean, currentUserIsSuperAdmin: boolean) {
  return clientAdminOnly
    ? ROLE_OPTIONS.filter((o) => isClientRole(o.value))
    : ROLE_OPTIONS.filter((o) => (o.value === "super_admin" ? currentUserIsSuperAdmin : true));
}

/** Server-provided expiry; an invitation past `expiresAt` can only be resent or removed. */
export const isInvitationPastExpiry = (expiresAt: string) => Date.parse(expiresAt) <= Date.now();
