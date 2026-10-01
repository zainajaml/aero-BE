import { api, unwrap } from "@/shared/api/client";
import type { components } from "@/shared/api/schema.gen";

export type AccessSummary = components["schemas"]["AccessSummary"];
export type AppRole = components["schemas"]["AppRole"];
export type Me = components["schemas"]["Me"];

export const getMyAccess = () => unwrap(api.GET("/api/v1/me/access"));
export const getMe = () => unwrap(api.GET("/api/v1/me"));
