import { Link } from "@tanstack/react-router";
import { useAuth } from "../auth-context";
import { Plus } from "lucide-react";

import { GlassPanel } from "@/shared/ui/glass/glass-panel";
import { Button } from "@/shared/ui/button";
import { CTA_BUTTON } from "@/shared/lib/cta";
import accessRevokedIllustration from "@/assets/access-revoked-illustration.jpg";

/**
 * Blocking, full-screen message shown when the user's access disappears while
 * they are using the app (their account was deleted or their last membership
 * removed). Replaces what used to be a blank screen.
 */
export function AccessRevokedOverlay() {
  const { signOut } = useAuth();

  return (
    <div className="relative grid min-h-screen place-items-center p-6">
      <div className="aurora-bg" />
      <GlassPanel className="relative z-10 w-full max-w-xl p-10 text-center shadow-2xl">
        <img
          src={accessRevokedIllustration}
          alt="Workspace access removed"
          width={160}
          height={160}
          className="mx-auto h-40 w-40 object-contain"
          loading="lazy"
        />
        <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight">
          Your access to this workspace has been removed
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground">
          An administrator removed the account you were working in. Your SpaceScope login and
          history stay intact — you can start your own account, or sign out and wait to be invited
          again.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="sm" className={CTA_BUTTON} asChild>
            <Link to="/onboarding" preload="intent">
              <Plus className="mr-1.5 h-4 w-4" />
              Create New Account / Project
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </GlassPanel>
    </div>
  );
}
