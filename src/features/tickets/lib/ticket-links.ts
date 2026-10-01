/** Relative in-app path of a ticket deep link. */
export const ticketPath = (ticketId: string) => `/ticket/${ticketId}`;

/** Absolute URL of a ticket deep link (for copying to the clipboard). */
export function ticketUrl(ticketId: string): string {
  if (typeof window === "undefined") return ticketPath(ticketId);
  return `${window.location.origin}${ticketPath(ticketId)}`;
}
