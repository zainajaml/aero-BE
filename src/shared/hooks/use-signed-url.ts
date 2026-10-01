import { useEffect, useState } from "react";
import { cachedSignedUrl, signedUrl, type StorageArea } from "@/shared/api/signed-urls";

/** Resolves a stored file key (or passes through an absolute URL) to something an <img> can load. */
export function useSignedUrl(area: StorageArea, key: string | null | undefined): string | null {
  const isAbsolute = Boolean(key && /^https?:\/\//.test(key));
  const [url, setUrl] = useState<string | null>(() =>
    !key ? null : isAbsolute ? key : cachedSignedUrl(area, key),
  );
  useEffect(() => {
    if (!key) return setUrl(null);
    if (isAbsolute) return setUrl(key);
    let active = true;
    void signedUrl(area, key).then((resolved) => {
      if (active) setUrl(resolved);
    });
    return () => {
      active = false;
    };
  }, [area, key, isAbsolute]);
  return url;
}
