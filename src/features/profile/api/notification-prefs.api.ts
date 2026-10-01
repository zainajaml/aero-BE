import { api, unwrap } from "@/shared/api/client";
import type { components } from "@/shared/api/schema.gen";

/** Trigger key → enabled. Missing keys mean "on". */
export type NotificationPreferences = components["schemas"]["NotificationPreferences"];
export type NotificationPreference = components["schemas"]["NotificationPreference"];

export const getMyNotificationPrefs = () => unwrap(api.GET("/api/v1/me/notification-preferences"));

export const setMyNotificationPref = (key: string, enabled: boolean) =>
  unwrap(
    api.PUT("/api/v1/me/notification-preferences/{key}", {
      params: { path: { key } },
      body: { enabled },
    }),
  );
