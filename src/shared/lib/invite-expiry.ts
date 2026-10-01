/** Shared, client-safe invitation expiry rules. */
export const INVITE_TTL_DAYS = 7;

export function isInvitationExpired(createdAt: string | null | undefined) {
  if (!createdAt) return false;
  const ms = INVITE_TTL_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - new Date(createdAt).getTime() > ms;
}
