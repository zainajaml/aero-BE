import { api, unwrap } from "@/shared/api/client";
import type { components } from "@/shared/api/schema.gen";

export type UpdateMyProfileRequest = components["schemas"]["UpdateMyProfileRequest"];
export type PrivateProfile = components["schemas"]["PrivateProfile"];

export const updateMyProfile = (body: UpdateMyProfileRequest) =>
  unwrap(api.PATCH("/api/v1/me/profile", { body }));

export function replaceMyAvatar(file: Blob, filename: string) {
  const form = new FormData();
  form.append("file", file, filename);
  // openapi-fetch passes FormData through untouched (the browser sets the multipart boundary).
  return unwrap(
    api.PUT("/api/v1/me/avatar", {
      body: form as never,
      bodySerializer: (body) => body as unknown as FormData,
    }),
  );
}

export const getMyPrivateProfile = () => unwrap(api.GET("/api/v1/me/private"));
export const updateMyPrivateProfile = (
  body: components["schemas"]["UpdatePrivateProfileRequest"],
) => unwrap(api.PATCH("/api/v1/me/private", { body }));

export const listMyTimeOff = () => unwrap(api.GET("/api/v1/me/time-off"));
export const addMyTimeOff = (body: components["schemas"]["AddTimeOffRequest"]) =>
  unwrap(api.POST("/api/v1/me/time-off", { body }));
export async function deleteMyTimeOff(timeOffId: string): Promise<void> {
  await api.DELETE("/api/v1/me/time-off/{timeOffId}", { params: { path: { timeOffId } } });
}
