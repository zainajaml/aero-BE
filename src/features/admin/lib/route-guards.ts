import { redirect } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import type { AccessSummary } from "@/features/auth/api/auth.api";
import { loadSession } from "@/features/auth/hooks/auth-queries";

async function signedInAccess(queryClient: QueryClient): Promise<AccessSummary> {
  const session = await loadSession(queryClient);
  if (session.kind === "anonymous") throw redirect({ to: "/login" });
  if (session.kind === "archived") throw redirect({ to: "/no-access" });
  return session.access;
}

/**
 * Admin access comes from a global super_admin/account_admin role, an account admin grant or a
 * project "admin" membership (the legacy global `admin` role alone is not an admin gate).
 */
export async function requireAdminAccess(queryClient: QueryClient) {
  const access = await signedInAccess(queryClient);
  const allowed =
    access.globalRoles.some((role) => role === "super_admin" || role === "account_admin") ||
    access.adminAccountIds.length > 0 ||
    Object.values(access.projectRoles).some((role) => role === "admin");
  if (!allowed) throw redirect({ to: "/dashboard" });
}

/** Super Admin area: global super_admin only. */
export async function requireSuperAdmin(queryClient: QueryClient) {
  const access = await signedInAccess(queryClient);
  if (!access.globalRoles.includes("super_admin")) throw redirect({ to: "/dashboard" });
}

/** Audit page (mirrors the source gate: a global super_admin, admin or account_admin role). */
export async function requireAuditAccess(queryClient: QueryClient) {
  const access = await signedInAccess(queryClient);
  const allowed = access.globalRoles.some(
    (role) => role === "super_admin" || role === "admin" || role === "account_admin",
  );
  if (!allowed) throw redirect({ to: "/dashboard" });
}
