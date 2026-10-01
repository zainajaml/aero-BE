import { useSignedUrl } from "@/shared/hooks/use-signed-url";
import { cn } from "@/shared/lib/utils";
import { avatarStyleFor, initialsFor } from "../lib/support-format";

/** Author avatar in a support thread: the signed photo, else coloured initials. */
export function SupportAvatar({
  id,
  name,
  avatarPath,
  className,
}: {
  id: string;
  name: string;
  avatarPath?: string | null;
  className?: string;
}) {
  const url = useSignedUrl("avatars", avatarPath ?? null);
  if (url) {
    return (
      <img src={url} alt={name} className={cn("shrink-0 rounded-full object-cover", className)} />
    );
  }
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full text-[11px] font-semibold",
        avatarStyleFor(id),
        className,
      )}
    >
      {initialsFor(name)}
    </span>
  );
}
