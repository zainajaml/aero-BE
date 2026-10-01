import { api, unwrap } from "@/shared/api/client";
import type { components } from "@/shared/api/schema.gen";

export const getOnboardingState = () => unwrap(api.GET("/api/v1/onboarding"));

export const createWorkspace = (body: components["schemas"]["CreateWorkspaceRequest"]) =>
  unwrap(api.POST("/api/v1/onboarding/workspace", { body }));

export const createFirstProject = (body: components["schemas"]["CreateFirstProjectRequest"]) =>
  unwrap(api.POST("/api/v1/onboarding/first-project", { body }));
