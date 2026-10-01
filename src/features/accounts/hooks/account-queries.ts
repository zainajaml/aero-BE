export const accountKeys = {
  /** Prefix shared with `projectKeys.accounts` (["accounts", "visible", userId]). */
  all: ["accounts"] as const,
  administered: () => [...accountKeys.all, "administered"] as const,
  people: (ids: string[]) => [...accountKeys.all, "people", ids.join(",")] as const,
};
