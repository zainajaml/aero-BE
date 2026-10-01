import { useTimezone } from "@/features/users/lib/timezone";

/** Formats a notification timestamp as "<date> <time> <TZ>" in the viewer's timezone. */
export function useNotificationDate() {
  const tz = useTimezone();
  return (d: string) =>
    `${tz.formatDateTime(d, { hour: "numeric", minute: "2-digit" }).replace(
      /, (?=\d{1,2}:\d{2})/,
      " ",
    )} ${tz.tz}`;
}
