import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  countUnseenNotifications,
  getNotification,
  listNotifications,
  type ListNotificationsQuery,
} from "../api/notifications.api";

export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (query: ListNotificationsQuery) => [...notificationKeys.lists(), query] as const,
  detail: (id: string) => [...notificationKeys.all, "detail", id] as const,
  unseen: (since: string | undefined) => [...notificationKeys.all, "unseen", since ?? ""] as const,
  unsubscribe: (token: string) => [...notificationKeys.all, "unsubscribe", token] as const,
};

export function useNotificationLog(query: ListNotificationsQuery) {
  return useQuery({
    queryKey: notificationKeys.list(query),
    queryFn: () => listNotifications(query),
    // Keep polling slow and foreground-only so an idle open tab doesn't hammer the server.
    refetchInterval: 120_000,
    refetchIntervalInBackground: false,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    retry: false,
    placeholderData: keepPreviousData,
  });
}

export function useNotificationDetail(id: string | null) {
  return useQuery({
    queryKey: notificationKeys.detail(id ?? ""),
    queryFn: () => getNotification(id as string),
    enabled: !!id,
    retry: false,
  });
}

export function useUnseenNotificationCount(since: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: notificationKeys.unseen(since),
    queryFn: () => countUnseenNotifications(since),
    enabled,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: false,
  });
}
