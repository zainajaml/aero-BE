import { createAuthClient } from "better-auth/react";
import { config } from "@/shared/config/env";

/**
 * Client for the Better Auth protocol endpoints (/api/auth/*): sign-in, sign-up, verification,
 * password reset and Google. Session state for the app comes from GET /api/v1/me/access.
 */
export const authClient = createAuthClient({
  baseURL: config.apiUrl || window.location.origin,
  basePath: "/api/auth",
  fetchOptions: { credentials: "include" },
});

/** Absolute app URL for auth email callbacks (verification, reset). */
export const appUrl = (path: string) => new URL(path, window.location.origin).toString();
