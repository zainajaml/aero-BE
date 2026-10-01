import { useRef, useState, type ChangeEvent } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { useSignedUrl } from "@/shared/hooks/use-signed-url";
import { errorMessage } from "@/shared/api/errors";
import { useUploadAvatar } from "../hooks/profile-queries";

/** Avatar (with client-side square crop on upload), display name and email. */
export function ProfileIdentityHeader({
  avatarPath,
  displayName,
  email,
}: {
  avatarPath: string | null | undefined;
  displayName: string;
  email: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const upload = useUploadAvatar();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarPreview = useSignedUrl("avatars", avatarPath);
  const initials = displayName.slice(0, 2).toUpperCase();

  async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB.");
      return;
    }
    setUploadingAvatar(true);
    try {
      await upload.mutateAsync(file);
      toast.success("Profile picture updated.");
    } catch (err) {
      toast.error(errorMessage(err, "Failed to save profile picture."));
    } finally {
      setUploadingAvatar(false);
    }
  }

  return (
    <div className="mb-5 flex items-center gap-4 rounded-xl border border-border/50 bg-transparent p-4">
      <div className="relative shrink-0">
        <Avatar className="h-16 w-16">
          {avatarPreview && <AvatarImage src={avatarPreview} alt={displayName} />}
          <AvatarFallback className="bg-primary/20 text-base font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploadingAvatar}
          className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground shadow transition hover:opacity-90 disabled:opacity-60"
          aria-label="Change profile picture"
        >
          {uploadingAvatar ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Camera className="h-3 w-3" />
          )}
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void handleAvatarChange(e)}
      />
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold">{displayName}</div>
        <div className="truncate text-xs text-muted-foreground">{email}</div>
        <div className="mt-1 text-[11px] text-muted-foreground/70">JPG or PNG · max 5MB</div>
      </div>
    </div>
  );
}
