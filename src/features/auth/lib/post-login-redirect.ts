const KEY = "postLoginRedirect";

/**
 * Deep links (e.g. /ticket/:id) stash where the user was headed before we
 * bounced them to sign-in. Both the sign-in page and the OAuth landing page
 * ("/") consume this, so the read is single-flight: the first caller wins and
 * every later caller gets null instead of falling back to /dashboard.
 */
let claimed = false;

export function setPostLoginRedirect(href: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, href);
    claimed = false;
  } catch {
    /* storage unavailable */
  }
}

function isUsable(dest: string | null): dest is string {
  if (!dest) return false;
  try {
    const url = new URL(dest, window.location.origin);
    if (url.origin !== window.location.origin) return false;
    const path = url.pathname;
    return path !== "/" && path !== "/login" && path !== "/signup";
  } catch {
    return false;
  }
}

/** Returns the stored destination once, then clears it for this session. */
export function consumePostLoginRedirect(): string | null {
  if (typeof window === "undefined" || claimed) return null;
  let dest: string | null = null;
  try {
    dest = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
  claimed = true;
  return isUsable(dest) ? dest : null;
}
