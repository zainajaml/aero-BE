import { QueryClient } from "@tanstack/react-query";
import { isApiError } from "@/shared/api/errors";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Retry transient failures only; never auth, permission or validation errors.
        retry: (failureCount, error) => {
          if (isApiError(error) && error.status > 0 && error.status < 500 && error.status !== 429)
            return false;
          return failureCount < 2;
        },
      },
      mutations: { retry: false },
    },
  });
}
