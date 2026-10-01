import { authClient } from "@/shared/api/auth-client";
import { ApiError } from "@/shared/api/errors";

/**
 * Better Auth OAuth provider endpoints (/api/auth/oauth2/*) used by the MCP sign-in flow. Every
 * call carries the signed authorization query (`oauth_query`) exactly as the server issued it.
 */

/** Public fields of a registered OAuth client. Names are self-registered: never trust them alone. */
export type OAuthPublicClient = {
  client_id: string;
  client_name?: string;
  client_uri?: string;
  logo_uri?: string;
};

/** Where the browser goes next after a sign-in or consent decision. */
type RedirectResponse = { url?: string; redirect_uri?: string; redirect?: boolean };

type BetterFetchError = {
  status: number;
  statusText?: string;
  code?: string;
  error?: string;
  message?: string;
  error_description?: string;
};

function toApiError(error: BetterFetchError): ApiError {
  const code = error.error ?? error.code ?? `HTTP_${error.status}`;
  const message =
    error.error_description ?? error.message ?? error.statusText ?? "Something went wrong.";
  return new ApiError(error.status, code, message);
}

async function call<T>(
  path: string,
  options: { method: "GET" | "POST"; body?: unknown; query?: Record<string, string> },
): Promise<T> {
  const { data, error } = await authClient.$fetch<T>(path, options);
  if (error) throw toApiError(error as BetterFetchError);
  return data as T;
}

function redirectTarget(response: RedirectResponse): string {
  const target = response.url ?? response.redirect_uri;
  if (!target) throw new ApiError(500, "NO_REDIRECT", "The server did not return a redirect.");
  return target;
}

/** Names the requesting client on the login page, before sign-in (signed query only). */
export const getPreloginClient = (clientId: string, oauthQuery: string) =>
  call<OAuthPublicClient>("/oauth2/public-client-prelogin", {
    method: "POST",
    body: { client_id: clientId, oauth_query: oauthQuery },
  });

/** Public client details for the consent page (requires a session; 404 for unknown clients). */
export const getPublicClient = (clientId: string) =>
  call<OAuthPublicClient>("/oauth2/public-client", {
    method: "GET",
    query: { client_id: clientId },
  });

/** Approves or denies the authorization; resolves to the client's redirect URL. */
export async function submitConsent(accept: boolean, oauthQuery: string): Promise<string> {
  const response = await call<RedirectResponse>("/oauth2/consent", {
    method: "POST",
    body: { accept, oauth_query: oauthQuery },
  });
  return redirectTarget(response);
}
