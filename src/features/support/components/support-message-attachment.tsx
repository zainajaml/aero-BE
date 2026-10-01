import { useSignedUrl } from "@/shared/hooks/use-signed-url";
import { MediaImage, MediaVideo } from "@/shared/ui/media-image";
import { isVideoPath } from "../lib/support-format";
import type { SupportLightboxItem } from "./support-lightbox";

/** Renders an image/video stored in the private support storage area. */
export function SupportMessageAttachment({
  attachmentKey,
  onOpen,
}: {
  attachmentKey: string;
  onOpen: (attachment: SupportLightboxItem) => void;
}) {
  const url = useSignedUrl("support", attachmentKey);
  const isVideo = isVideoPath(attachmentKey);
  if (!url) return <div className="h-32 w-40 animate-pulse rounded-lg bg-muted" />;
  return (
    <button
      type="button"
      onClick={() => onOpen({ url, isVideo })}
      className="block cursor-pointer overflow-hidden rounded-lg border border-border/60"
    >
      {isVideo ? (
        <MediaVideo
          src={url}
          className="max-h-48 max-w-full cursor-pointer object-cover"
          containerClassName="w-40"
          muted
          playsInline
        />
      ) : (
        <MediaImage
          src={url}
          alt="Support ticket attachment screenshot"
          className="max-h-48 max-w-full cursor-pointer object-cover"
          containerClassName="w-40"
        />
      )}
    </button>
  );
}
