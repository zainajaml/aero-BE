import { api, unwrap } from "@/shared/api/client";

/** Checks an unsubscribe link (public). A 404 ApiError means the token is invalid. */
export const checkUnsubscribe = (token: string) =>
  unwrap(api.GET("/api/v1/email/unsubscribe", { params: { query: { token } } }));

/** Confirms the unsubscribe (public). */
export const confirmUnsubscribe = (token: string) =>
  unwrap(api.POST("/api/v1/email/unsubscribe", { body: { token } }));
