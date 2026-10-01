import { api, unwrap } from "@/shared/api/client";
import type { components } from "@/shared/api/schema.gen";
export type CreateInvitationRequest = components["schemas"]["CreateInvitationRequest"];

export const lookupInvitation = (token: string) =>
  unwrap(api.POST("/api/v1/invitations/lookup", { body: { token } }));

export const acceptInvitationWithPassword = (
  body: components["schemas"]["AcceptInvitationWithPasswordRequest"],
) => unwrap(api.POST("/api/v1/invitations/accept-with-password", { body }));

export const acceptInvitation = (token: string) =>
  unwrap(api.POST("/api/v1/invitations/accept", { body: { token } }));

export const createInvitation = (body: CreateInvitationRequest) =>
  unwrap(api.POST("/api/v1/invitations", { body }));

export const resendInvitation = (invitationId: string) =>
  unwrap(
    api.POST("/api/v1/invitations/{invitationId}/resend", { params: { path: { invitationId } } }),
  );

export async function revokeInvitation(invitationId: string): Promise<void> {
  await api.DELETE("/api/v1/invitations/{invitationId}", { params: { path: { invitationId } } });
}
