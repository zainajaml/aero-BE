import { config } from "@/shared/config/env";
import { ApiError } from "./errors";

type ErrorEnvelope = {
  error?: { code?: string; message?: string; details?: ApiError["details"] };
  meta?: { requestId?: string };
};

/**
 * Downloads a binary API response (e.g. a stored file stream) as a Blob. Uses the same
 * cookie session as the typed client; non-2xx responses become one typed ApiError.
 */
export async function fetchBlob(path: string): Promise<Blob> {
  let response: Response;
  try {
    response = await fetch(`${config.apiUrl}${path}`, { credentials: "include" });
  } catch {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Can't reach the server. Check your connection and try again.",
    );
  }
  if (!response.ok) {
    let body: ErrorEnvelope = {};
    try {
      body = (await response.json()) as ErrorEnvelope;
    } catch {
      /* non-JSON error (proxy, network appliance) */
    }
    throw new ApiError(
      response.status,
      body.error?.code ?? `HTTP_${response.status}`,
      body.error?.message ?? "Something went wrong. Please try again.",
      body.error?.details ?? [],
      body.meta?.requestId ?? response.headers.get("x-request-id") ?? undefined,
    );
  }
  return response.blob();
}
