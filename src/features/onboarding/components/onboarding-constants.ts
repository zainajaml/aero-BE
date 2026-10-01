import { Columns3, Repeat } from "lucide-react";

export const STEPS = ["Account", "Project", "Team", "Done"] as const;

// Roles a new account owner can hand out during onboarding. account_admin is
// excluded — that's the person creating the account.
export const INVITE_ROLES = [
  { value: "admin", label: "Project Admin" },
  { value: "developer", label: "Developer" },
  { value: "team", label: "Team" },
  { value: "viewer", label: "Viewer" },
] as const;
export type InviteRole = (typeof INVITE_ROLES)[number]["value"];
export type InviteRow = { email: string; role: InviteRole };

export const NAME_SUGGESTIONS = ["Acme Inc.", "Northstar Labs", "Orbit Studio"];

export const PROJECT_TYPES = [
  {
    value: "sprint" as const,
    label: "Scrum / Agile",
    description: "Plan, prioritise and schedule work in sprints.",
    Icon: Repeat,
  },
  {
    value: "kanban" as const,
    label: "Kanban",
    description: "A continuous board with no sprint cycles.",
    Icon: Columns3,
  },
];
