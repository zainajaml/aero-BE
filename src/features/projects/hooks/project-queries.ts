export const projectKeys = {
  all: ["projects"] as const,
  list: (userId: string | undefined) => [...projectKeys.all, "list", userId] as const,
  accounts: (userId: string | undefined) => ["accounts", "visible", userId] as const,
  stats: (ids: string[]) => [...projectKeys.all, "stats", ids.join(",")] as const,
  people: (projectId: string) => [...projectKeys.all, "people", projectId] as const,
  rateCard: (ids: string[]) => ["rate-card", ids.join(",")] as const,
};
