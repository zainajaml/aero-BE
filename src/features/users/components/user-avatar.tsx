import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { useSignedUrl } from "@/shared/hooks/use-signed-url";
import { cn } from "@/shared/lib/utils";

interface Props {
  /** Avatar storage key or absolute URL (e.g. a Google profile photo) from the profile. */
  path?: string | null;
  name?: string | null;
  className?: string;
  fallbackClassName?: string;
  title?: string;
}

export function UserAvatar({ path, name, className, fallbackClassName, title }: Props) {
  const url = useSignedUrl("avatars", path);
  return (
    <Avatar className={cn("h-5 w-5 shrink-0", className)} title={title ?? name ?? undefined}>
      {url && <AvatarImage src={url} alt={name ?? "Avatar"} />}
      <AvatarFallback
        className={cn("text-[9px] bg-muted text-muted-foreground", fallbackClassName)}
      >
        {(name ?? "?").slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
