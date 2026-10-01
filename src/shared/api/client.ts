import createClient, { type Middleware } from "openapi-fetch";
import { config } from "@/shared/config/env";
import { ApiError } from "./errors";
import type { paths } from "./schema.gen";

type ErrorEnvelope = {
  error?: { code?: string; message?: string; details?: ApiError["details"] };
  meta?: { requestId?: string };
};

const listeners = new Set<(error: ApiError) => void>();

/** Subscribe to every API failure (e.g. session expiry handling in the auth provider). */
export function onApiError(listener: (error: ApiError) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Response interceptor: every non-2xx becomes one typed ApiError. */
const errorInterceptor: Middleware = {
  async onResponse({ response }) {
    if (response.ok) return undefined;
    let body: ErrorEnvelope = {};
    try {
      body = (await response.clone().json()) as ErrorEnvelope;
    } catch {
      /* non-JSON error (proxy, network appliance) */
    }
    const error = new ApiError(
      response.status,
      body.error?.code ?? `HTTP_${response.status}`,
      body.error?.message ?? "Something went wrong. Please try again.",
      body.error?.details ?? [],
      body.meta?.requestId ?? response.headers.get("x-request-id") ?? undefined,
    );
    listeners.forEach((listener) => listener(error));
    throw error;
  },
  onError({ error }) {
    if (error instanceof ApiError) return error;
    return new ApiError(
      0,
      "NETWORK_ERROR",
      "Can't reach the server. Check your connection and try again.",
    );
  },
};

/** The one transport for /api/v1. Cookies carry the session; the backend checks Origin for CSRF. */
export const api = createClient<paths>({ baseUrl: config.apiUrl, credentials: "include" });
api.use(errorInterceptor);

type Enveloped<T> = { data?: { data: T } | undefined };

/** Unwraps `{ data, meta }` so feature code works with the payload only. */
export async function unwrap<T>(call: Promise<Enveloped<T>>): Promise<T> {
  const result = await call;
  if (!result.data)
    throw new ApiError(500, "EMPTY_RESPONSE", "The server returned an empty response.");
  return result.data.data;
}
