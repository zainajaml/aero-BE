import { api, unwrap } from "@/shared/api/client";
import type { components } from "@/shared/api/schema.gen";

export type OrgUserList = components["schemas"]["OrgUserList"];
export type OrgUser = components["schemas"]["OrgUser"];
export type OrgInvitation = OrgUserList["invitations"][number];
export type OrgProject = OrgUserList["projects"][number];
export type OrgAccount = OrgUserList["accounts"][number];
export type UpdateUserAccessRequest = components["schemas"]["UpdateUserAccessRequest"];
export type RemoveUserAccessResult = components["schemas"]["RemoveUserAccessResult"];
export type UserOpenTickets = components["schemas"]["UserOpenTickets"];
export type ArchiveUserRequest = components["schemas"]["ArchiveUserRequest"];

/** User management listing, clipped server-side to the account/project open in the UI. */
export const listOrgUsers = (context: { accountId?: string | null; projectId?: string | null }) =>
  unwrap(
    api.GET("/api/v1/admin/users", {
      params: {
        query: {
          accountId: context.accountId ?? undefined,
          projectId: context.projectId ?? undefined,
        },
      },
    }),
  );

export const updateUserAccess = (userId: string, body: UpdateUserAccessRequest) =>
  unwrap(api.PUT("/api/v1/admin/users/{userId}/access", { params: { path: { userId } }, body }));

/** Removes one project's access (or everything in scope); super admins may delete unused identities. */
export const removeUserAccess = (userId: string, projectId?: string | null) =>
  unwrap(
    api.DELETE("/api/v1/admin/users/{userId}/access", {
      params: { path: { userId }, query: { projectId: projectId ?? undefined } },
    }),
  );

export const listUserOpenTickets = (userId: string) =>
  unwrap(api.GET("/api/v1/admin/users/{userId}/open-tickets", { params: { path: { userId } } }));

export const reassignUserTickets = (userId: string, assigneeId: string | null) =>
  unwrap(
    api.POST("/api/v1/admin/users/{userId}/reassign-tickets", {
      params: { path: { userId } },
      body: { assigneeId },
    }),
  );

/** Archives an identity (super admins), optionally reassigning its open tickets in the same call. */
export const archiveUser = (userId: string, body: ArchiveUserRequest = {}) =>
  unwrap(api.POST("/api/v1/admin/users/{userId}/archive", { params: { path: { userId } }, body }));

export const restoreUser = (userId: string) =>
  unwrap(api.POST("/api/v1/admin/users/{userId}/restore", { params: { path: { userId } } }));

/** Sets the real email of a Jira-imported placeholder identity. */
export const setImportedUserEmail = (userId: string, email: string) =>
  unwrap(
    api.PUT("/api/v1/admin/users/{userId}/email", {
      params: { path: { userId } },
      body: { email },
    }),
  );
