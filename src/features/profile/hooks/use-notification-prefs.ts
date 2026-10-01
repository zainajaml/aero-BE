import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { setMyNotificationPref, type NotificationPreferences } from "../api/notification-prefs.api";
import { profileKeys, useMyNotificationPrefs } from "./profile-queries";

/** Notification preference map plus an optimistic per-key toggle. */
export function useNotificationPrefs(userId: string | undefined) {
  const qc = useQueryClient();
  const key = profileKeys.notificationPrefs(userId);
  const { data: notifPrefs = {} } = useMyNotificationPrefs(userId);
  const [pendingKeys, setPendingKeys] = useState<Record<string, boolean>>({});

  const updateNotifPref = useMutation({
    mutationFn: (vars: { key: string; enabled: boolean }) =>
      setMyNotificationPref(vars.key, vars.enabled),
    onMutate: async ({ key: prefKey, enabled }) => {
      setPendingKeys((p) => ({ ...p, [prefKey]: true }));
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<NotificationPreferences>(key);
      qc.setQueryData<NotificationPreferences>(key, { ...(prev ?? {}), [prefKey]: enabled });
      return { prev };
    },
    onSuccess: ({ key: prefKey, enabled }) => {
      qc.setQueryData<NotificationPreferences>(key, (cur) => ({
        ...(cur ?? {}),
        [prefKey]: enabled,
      }));
      toast.success(enabled ? "Notification enabled" : "Notification disabled");
    },
    onError: (_e, _v, ctx) => {
      qc.setQueryData(key, ctx?.prev);
      toast.error("Couldn't update preference");
    },
    onSettled: (_d, _e, vars) => {
      setPendingKeys((p) => {
        const next = { ...p };
        delete next[vars.key];
        return next;
      });
      void qc.invalidateQueries({ queryKey: key });
    },
  });

  function isNotifOn(prefKey: string) {
    return notifPrefs[prefKey] ?? true;
  }

  function toggleNotif(prefKey: string, value: boolean) {
    if (pendingKeys[prefKey]) return;
    updateNotifPref.mutate({ key: prefKey, enabled: value });
  }

  return { notifPrefs, pendingKeys, isNotifOn, toggleNotif };
}
