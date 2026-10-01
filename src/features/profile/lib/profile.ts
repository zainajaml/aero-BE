import { replaceMyAvatar } from "@/features/users/api/profile.api";

export const EMPLOYMENT_STATUSES = [
  { value: "full_time", label: "Full time" },
  { value: "part_time", label: "Part time" },
  { value: "contract", label: "Contract" },
  { value: "project", label: "Project" },
] as const;

export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number]["value"];

export const TIME_OFF_KINDS = [
  { value: "holiday", label: "Holiday", tone: "cyan" as const },
  { value: "sick", label: "Sick", tone: "rose" as const },
  { value: "other", label: "Other", tone: "muted" as const },
] as const;

export type TimeOffKind = (typeof TIME_OFF_KINDS)[number]["value"];

export function employmentLabel(value: string | null | undefined): string {
  return EMPLOYMENT_STATUSES.find((s) => s.value === value)?.label ?? "—";
}

const AVATAR_MAX_PX = 512;

/**
 * Center-crop + downscale an image to a square before upload so avatars are
 * never distorted and never upscaled (which would look pixelated).
 * Returns a JPEG blob, or null when the browser can't process the file.
 */
async function normalizeAvatar(file: File): Promise<Blob | null> {
  if (typeof document === "undefined" || !file.type.startsWith("image/")) return null;
  try {
    const bitmap = await createImageBitmap(file);
    const side = Math.min(bitmap.width, bitmap.height);
    // Never upscale: cap the output at the source's shorter side.
    const size = Math.min(AVATAR_MAX_PX, side);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      size,
      size,
    );
    bitmap.close?.();
    return await new Promise((resolve) =>
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9),
    );
  } catch {
    return null;
  }
}

/** Square-crops the picture client-side, then replaces the caller's avatar. Returns the updated Me. */
export async function uploadAvatar(file: File) {
  const normalized = await normalizeAvatar(file);
  if (normalized) return replaceMyAvatar(normalized, "avatar.jpg");
  return replaceMyAvatar(file, file.name || "avatar.png");
}
