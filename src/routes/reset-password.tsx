import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ResetPasswordView } from "@/features/auth/views/reset-password-view";

export const Route = createFileRoute("/reset-password")({
  validateSearch: z.object({ token: z.string().optional(), error: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Reset password — Space Scope" },
      { name: "description", content: "Set a new password for your Space Scope account." },
    ],
  }),
  component: function ResetPasswordPage() {
    const { token, error } = Route.useSearch();
    return <ResetPasswordView token={token} error={error} />;
  },
});
