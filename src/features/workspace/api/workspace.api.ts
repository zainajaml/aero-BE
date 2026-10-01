import { api, unwrap } from "@/shared/api/client";

/** Accounts the caller administers (with their projects) plus their other project memberships. */
export const getMyWorkspace = () => unwrap(api.GET("/api/v1/me/workspace"));
