/** Browser-visible configuration, fixed at build time. Never put secrets here. */
export const config = {
  /** API origin; empty string means same origin (dev proxy or reverse proxy). */
  apiUrl: (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "",
};
