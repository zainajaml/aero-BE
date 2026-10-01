import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sanitize a filename for use in a Supabase Storage object key.
 * Storage keys reject spaces and many special characters, so we keep only
 * safe characters and collapse the rest into dashes. The original filename
 * is still stored separately for display.
 */
export function sanitizeStorageName(name: string): string {
  const lastDot = name.lastIndexOf(".");
  const base = lastDot > 0 ? name.slice(0, lastDot) : name;
  const ext = lastDot > 0 ? name.slice(lastDot + 1) : "";
  const clean = (s: string) =>
    s
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^[-.]+|[-.]+$/g, "");
  const safeBase = clean(base) || "file";
  const safeExt = clean(ext);
  return safeExt ? `${safeBase}.${safeExt}` : safeBase;
}

/** Compose a display name preferring first + last name over legacy full_name. */
export function formatDisplayName(
  input:
    | {
        first_name?: string | null;
        last_name?: string | null;
        full_name?: string | null;
        email?: string | null;
      }
    | null
    | undefined,
  fallback: string = "Unknown",
): string {
  if (!input) return fallback;
  const combined = [input.first_name, input.last_name]
    .map((v) => (v ?? "").trim())
    .filter(Boolean)
    .join(" ");
  if (combined) return combined;
  if (input.full_name && input.full_name.trim()) return input.full_name.trim();
  if (input.email) return input.email.split("@")[0];
  return fallback;
}
