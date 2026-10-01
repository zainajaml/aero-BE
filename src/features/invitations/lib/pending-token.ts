const KEY = "pendingInviteToken";

/**
 * The invitation token is read from the link once, then removed from the address bar. It is kept in
 * sessionStorage only while the user leaves for Google sign-in and comes back to /accept.
 */
export function takeInviteToken(fromUrl: string | undefined): string {
  if (fromUrl) {
    window.history.replaceState(null, "", window.location.pathname);
    return fromUrl;
  }
  try {
    return sessionStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function rememberInviteToken(token: string) {
  try {
    sessionStorage.setItem(KEY, token);
  } catch {
    /* storage unavailable: the user can reopen the email link */
  }
}

export function forgetInviteToken() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
}
