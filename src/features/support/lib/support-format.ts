import type { SupportMessage } from "../api/support.api";

const VIDEO_EXTS = ["mp4", "webm", "ogg", "mov", "m4v"];
export function isVideoPath(path: string) {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return VIDEO_EXTS.includes(ext);
}

const AVATAR_STYLES = [
  "bg-neon-amber/20 text-neon-amber",
  "bg-neon-lime/20 text-neon-lime",
  "bg-neon-violet/20 text-neon-violet",
  "bg-neon-cyan/20 text-neon-cyan",
  "bg-neon-rose/20 text-neon-rose",
  "bg-neon-orange/20 text-neon-orange",
];

function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Stable per-user fallback colour for avatars without a photo. */
export function avatarStyleFor(id: string) {
  return AVATAR_STYLES[hashString(id) % AVATAR_STYLES.length];
}

export function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

const timeFmt = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
const dayFmt = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  day: "numeric",
  month: "long",
});
export const shortDayFmt = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function fmtTime(iso: string) {
  return timeFmt.format(new Date(iso)).toLowerCase();
}

/** Group messages into consecutive day buckets for date separators. */
export function groupMessagesByDay(messages: SupportMessage[]) {
  const groups: { key: string; label: string; items: SupportMessage[] }[] = [];
  for (const m of messages) {
    const d = new Date(m.createdAt);
    const key = d.toDateString();
    const last = groups[groups.length - 1];
    if (!last || last.key !== key) {
      groups.push({ key, label: dayFmt.format(d), items: [m] });
    } else {
      last.items.push(m);
    }
  }
  return groups;
}
