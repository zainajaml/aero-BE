export function minutesToDHM(total: number): { d: number; h: number; m: number } {
  const safe = Math.max(0, Math.floor(total));
  const d = Math.floor(safe / (60 * 8)); // 8h workday
  const remAfterDays = safe - d * 60 * 8;
  const h = Math.floor(remAfterDays / 60);
  const m = remAfterDays - h * 60;
  return { d, h, m };
}

export function dhmToMinutes(d: number, h: number, m: number): number {
  return Math.max(0, Math.floor(d) * 60 * 8 + Math.floor(h) * 60 + Math.floor(m));
}

export function formatHM(minutes: number): string {
  if (!minutes) return "0m";
  const safe = Math.max(0, Math.floor(minutes));
  const h = Math.floor(safe / 60);
  const m = safe - h * 60;
  const parts: string[] = [];
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  return parts.join(" ") || "0m";
}

export function formatDHM(minutes: number): string {
  if (!minutes) return "00m";
  const { d, h, m } = minutesToDHM(minutes);
  const parts: string[] = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${String(m).padStart(2, "0")}m`);
  return parts.join(" ") || "00m";
}

export const RESOURCE_TYPES = [
  "AI Engineer",
  "Backend",
  "Business Analysis",
  "Design",
  "DevOps",
  "Frontend",
  "Full-stack",
  "Project Management",
  "QA",
  "Solution Architect",
  "Other",
] as const;

export const STATUS_TONE: Record<
  string,
  "cyan" | "magenta" | "lime" | "amber" | "rose" | "violet" | "muted"
> = {
  backlog: "muted",
  todo: "cyan",
  in_progress: "violet",
  in_review: "amber",
  done: "lime",
  blocked: "rose",
};

export const PRIORITY_TONE: Record<
  string,
  "cyan" | "magenta" | "lime" | "amber" | "rose" | "violet" | "muted"
> = {
  low: "muted",
  medium: "cyan",
  high: "amber",
  urgent: "rose",
};

export const TYPE_TONE: Record<
  string,
  "cyan" | "magenta" | "lime" | "amber" | "rose" | "violet" | "muted"
> = {
  task: "cyan",
  bug: "rose",
  story: "violet",
  epic: "magenta",
};
