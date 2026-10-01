import Image from "@tiptap/extension-image";

/**
 * Image node that renders a skeleton placeholder until the file is actually
 * decoded, reserves space to avoid layout shift, and offers a retry when the
 * download fails (expired signed URL, offline, cache miss, …).
 *
 * Applies to every rich text surface: ticket descriptions, comments, work logs,
 * documents and support tickets.
 */
export const LoadingImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: { default: null },
      height: { default: null },
    };
  },

  addNodeView() {
    return ({ node, HTMLAttributes }) => {
      const src = node.attrs.src as string | null;
      const width = node.attrs.width as number | null;
      const height = node.attrs.height as number | null;

      const wrapper = document.createElement("div");
      wrapper.setAttribute("data-media-image", "");
      wrapper.className =
        "relative my-3 inline-flex max-w-full items-center justify-center overflow-hidden rounded-lg bg-muted/50";

      // Reserve space so the surrounding text does not jump when media lands.
      if (width && height) {
        const w = Math.min(width, 640);
        wrapper.style.width = `${w}px`;
        wrapper.style.height = `${Math.round((w * height) / width)}px`;
      } else {
        wrapper.style.width = "min(100%, 480px)";
        wrapper.style.aspectRatio = "16 / 10";
      }

      const skeleton = document.createElement("div");
      skeleton.className = "absolute inset-0 animate-pulse rounded-lg bg-muted/70";
      wrapper.appendChild(skeleton);

      const img = document.createElement("img");
      Object.entries(HTMLAttributes ?? {}).forEach(([key, value]) => {
        if (value != null) img.setAttribute(key, String(value));
      });
      img.className = `${(HTMLAttributes?.class as string) ?? ""} absolute inset-0 h-full w-full object-contain opacity-0 transition-opacity duration-200`;
      img.decoding = "async";
      img.loading = "lazy";

      const settle = () => {
        skeleton.remove();
        wrapper.style.width = "";
        wrapper.style.height = "";
        wrapper.style.aspectRatio = "";
        wrapper.className = "relative my-3 inline-flex max-w-full overflow-hidden rounded-lg";
        img.className = `${(HTMLAttributes?.class as string) ?? ""} max-w-full opacity-100 transition-opacity duration-200`;
      };

      img.addEventListener("load", settle);

      img.addEventListener("error", () => {
        skeleton.remove();
        if (wrapper.querySelector("[data-media-error]")) return;
        const error = document.createElement("div");
        error.setAttribute("data-media-error", "");
        error.className =
          "absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 bg-muted/40 text-center";
        const label = document.createElement("div");
        label.className = "text-xs text-muted-foreground";
        label.textContent = "Couldn’t load image";
        const retry = document.createElement("button");
        retry.type = "button";
        retry.textContent = "Retry";
        retry.className =
          "rounded-full border border-border bg-background px-3 py-1 text-xs hover:bg-accent";
        retry.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          error.remove();
          wrapper.appendChild(skeleton);
          if (src) img.src = `${src}${src.includes("?") ? "&" : "?"}_retry=${Date.now()}`;
        });
        error.append(label, retry);
        wrapper.appendChild(error);
      });

      if (src) img.src = src;
      wrapper.appendChild(img);

      // Images already in the browser cache report complete synchronously.
      if (img.complete && img.naturalWidth > 0) settle();

      return {
        dom: wrapper,
        update: (updated) => updated.type.name === node.type.name && updated.attrs.src === src,
      };
    };
  },
});
