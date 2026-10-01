import { useEffect } from "react";
import { CloseButton } from "@/shared/ui/close-button";
import { MediaImage, MediaVideo } from "@/shared/ui/media-image";

export type SupportLightboxItem = { url: string; isVideo: boolean };

/** Full-screen preview of an attachment or inline image; closes on Escape or backdrop click. */
export function SupportLightbox({
  item,
  onClose,
}: {
  item: SupportLightboxItem | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose]);

  if (!item) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <CloseButton
        className="absolute right-4 top-4 z-[61] border-white/40 text-white hover:bg-white/10 hover:text-white"
        onClick={onClose}
        aria-label="Close preview"
      />
      <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
        {item.isVideo ? (
          <MediaVideo
            src={item.url}
            className="max-h-[90vh] max-w-[90vw] rounded-lg"
            containerClassName="min-w-[40vw]"
            controls
            autoPlay
          />
        ) : (
          <MediaImage
            src={item.url}
            alt="Attachment preview"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            containerClassName="min-w-[40vw]"
            loading="eager"
          />
        )}
      </div>
    </div>
  );
}
