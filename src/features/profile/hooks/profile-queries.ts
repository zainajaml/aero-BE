import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Me } from "@/features/auth/api/auth.api";
import { authKeys } from "@/features/auth/hooks/auth-queries";
import {
  addMyTimeOff,
  deleteMyTimeOff,
  getMyPrivateProfile,
  listMyTimeOff,
  updateMyPrivateProfile,
  updateMyProfile,
  type PrivateProfile,
  type UpdateMyProfileRequest,
} from "@/features/users/api/profile.api";
import type { components } from "@/shared/api/schema.gen";
import { getMyNotificationPrefs } from "../api/notification-prefs.api";
import { uploadAvatar } from "../lib/profile";

export const profileKeys = {
  all: ["profile"] as const,
  private: (userId: string | undefined) => [...profileKeys.all, "private", userId] as const,
  timeOff: (userId: string | undefined) => [...profileKeys.all, "time-off", userId] as const,
  notificationPrefs: (userId: string | undefined) =>
    [...profileKeys.all, "notification-prefs", userId] as const,
};

export function useMyPrivateProfile(userId: string | undefined) {
  return useQuery({
    queryKey: profileKeys.private(userId),
    enabled: !!userId,
    queryFn: getMyPrivateProfile,
  });
}

export function useMyTimeOff(userId: string | undefined) {
  return useQuery({
    queryKey: profileKeys.timeOff(userId),
    enabled: !!userId,
    queryFn: listMyTimeOff,
  });
}

export function useMyNotificationPrefs(userId: string | undefined) {
  return useQuery({
    queryKey: profileKeys.notificationPrefs(userId),
    enabled: !!userId,
    queryFn: getMyNotificationPrefs,
  });
}

/** Writes the fresh Me returned by profile/avatar endpoints into the auth cache. */
function useSetMe() {
  const qc = useQueryClient();
  return (me: Me) => {
    qc.setQueryData(authKeys.me(), me);
    void qc.invalidateQueries({ queryKey: authKeys.me() });
  };
}

export function useUpdateMyProfile() {
  const setMe = useSetMe();
  return useMutation({
    mutationFn: (body: UpdateMyProfileRequest) => updateMyProfile(body),
    onSuccess: setMe,
  });
}

export function useUploadAvatar() {
  const setMe = useSetMe();
  return useMutation({ mutationFn: (file: File) => uploadAvatar(file), onSuccess: setMe });
}

export function useUpdateMyPrivateProfile(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: components["schemas"]["UpdatePrivateProfileRequest"]) =>
      updateMyPrivateProfile(body),
    onSuccess: (data: PrivateProfile) => {
      qc.setQueryData(profileKeys.private(userId), data);
      void qc.invalidateQueries({ queryKey: profileKeys.private(userId) });
    },
  });
}

export function useAddTimeOff(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: components["schemas"]["AddTimeOffRequest"]) => addMyTimeOff(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: profileKeys.timeOff(userId) }),
  });
}

export function useDeleteTimeOff(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMyTimeOff(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: profileKeys.timeOff(userId) }),
  });
}
