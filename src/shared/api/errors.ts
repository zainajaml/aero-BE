export type ApiErrorDetail = { path?: string; message: string };

/** Normalized failure of any backend call. `code` is the backend's stable machine-readable code. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: ApiErrorDetail[] = [],
    readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** Field-level messages keyed by the last path segment (for mapping onto form fields). */
  fieldErrors(): Record<string, string> {
    const fields: Record<string, string> = {};
    for (const detail of this.details) {
      const key = detail.path?.split(".").pop();
      if (key && !fields[key]) fields[key] = detail.message;
    }
    return fields;
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

export function errorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
