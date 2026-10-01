/**
 * Shared, client-safe email normalization for the invitation flow.
 *
 * Email addresses are treated as case-insensitive everywhere: new rows are
 * stored lowercase, and lookups against legacy mixed-case rows go through an
 * `ilike` pattern plus an exact normalized comparison in JS (so LIKE
 * wildcards inside an address, e.g. `_`, can never widen a match).
 */
export function normalizeEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

/** Escapes LIKE metacharacters so `ilike` behaves as an exact, case-insensitive match. */
export function emailIlikePattern(email: string): string {
  return normalizeEmail(email).replace(/([\\%_])/g, "\\$1");
}

/** True when both addresses are the same address ignoring case/whitespace. */
export function sameEmail(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = normalizeEmail(a);
  return na.length > 0 && na === normalizeEmail(b);
}
