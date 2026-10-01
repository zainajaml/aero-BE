import { api, unwrap } from "@/shared/api/client";
import type { components } from "@/shared/api/schema.gen";

export type MyWorkspace = components["schemas"]["MyWorkspace"];
export type WorkspaceAccount = MyWorkspace["accounts"][number];
export type WorkspaceProject = MyWorkspace["projects"][number];

/** Accounts the caller administers (with their projects) plus their other project memberships. */
export const getMyWorkspace = () => unwrap(api.GET("/api/v1/me/workspace"));
