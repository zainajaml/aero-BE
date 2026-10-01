/**
 * Reading the signed authorization query that Better Auth puts on the login and consent pages.
 * The query is passed back to the server byte-for-byte (`oauth_query`), so it is always taken
 * from the raw URL, never rebuilt from parsed search params.
 */

/** The raw signed query (without "?") when the current page is part of an authorization. */
export function readOAuthQuery(search: string = window.location.search): string | null {
  const query = search.startsWith("?") ? search.slice(1) : search;
  return new URLSearchParams(query).has("sig") ? query : null;
}

const SCOPE_DESCRIPTIONS: Record<string, string> = {
  openid: "Confirm who you are",
  profile: "See your name and profile picture",
  email: "See your email address",
  offline_access: "Stay connected when you are not using it",
};

export type AuthorizationRequest = {
  clientId: string | null;
  /** Host the user is sent back to; the only part of the client identity the server verified. */
  redirectHost: string | null;
  scopes: { scope: string; description: string }[];
  expired: boolean;
};

export function parseAuthorizationRequest(
  oauthQuery: string,
  now = Date.now(),
): AuthorizationRequest {
  const params = new URLSearchParams(oauthQuery);
  let redirectHost: string | null = null;
  try {
    const redirectUri = params.get("redirect_uri");
    if (redirectUri) redirectHost = new URL(redirectUri).host || null;
  } catch {
    redirectHost = null;
  }
  const exp = Number(params.get("exp"));
  const scopes = (params.get("scope") ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .filter((scope, index, all) => all.indexOf(scope) === index)
    .map((scope) => ({ scope, description: SCOPE_DESCRIPTIONS[scope] ?? scope }));
  return {
    clientId: params.get("client_id"),
    redirectHost,
    scopes,
    expired: Number.isFinite(exp) && exp > 0 && exp * 1000 < now,
  };
}
