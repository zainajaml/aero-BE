import { api, unwrap } from "@/shared/api/client";
import type { components, operations } from "@/shared/api/schema.gen";

export type NotificationRow = components["schemas"]["NotificationRow"];
export type NotificationDetail = components["schemas"]["NotificationDetail"];
export type NotificationLog = components["schemas"]["NotificationLog"];
export type ListNotificationsQuery = NonNullable<
  operations["listNotifications"]["parameters"]["query"]
>;

/** Server-paged, server-filtered notification log, newest first. */
export const listNotifications = (query: ListNotificationsQuery) =>
  unwrap(api.GET("/api/v1/notifications", { params: { query } }));

/** One notification including its rendered HTML (for the detail dialog). */
export const getNotification = (notificationId: string) =>
  unwrap(
    api.GET("/api/v1/notifications/{notificationId}", {
      params: { path: { notificationId } },
    }),
  );

/**
 * Re-sends a failed notification. Refusals arrive as ApiError codes:
 * NOT_RETRYABLE, NO_STORED_CONTENT, EMAIL_SUPPRESSED (409), 403, 404, 429.
 */
export const retryNotification = (notificationId: string) =>
  unwrap(
    api.POST("/api/v1/notifications/{notificationId}/retry", {
      params: { path: { notificationId } },
    }),
  );

/** Personal notifications since `since` (sidebar badge). */
export const countUnseenNotifications = (since?: string) =>
  unwrap(
    api.GET("/api/v1/notifications/unseen-count", {
      params: { query: since ? { since } : {} },
    }),
  );
