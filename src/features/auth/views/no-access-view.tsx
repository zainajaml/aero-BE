import { Link } from "@tanstack/react-router";
import { ArrowLeft, Plus } from "lucide-react";
import accessRevokedIllustration from "@/assets/access-revoked-illustration.jpg";
import { CTA_BUTTON } from "@/shared/lib/cta";
import { Button } from "@/shared/ui/button";
import { GlassPanel } from "@/shared/ui/glass/glass-panel";
import { useAuth } from "../auth-context";

/**
 * Shown to a signed-in user whose project/account memberships have all been removed (or whose
 * identity was archived). Their identity, login and history stay intact.
 */
export function NoAccessView({ archived }: { archived: boolean }) {
  const { signOut } = useAuth();
  return (
    <main className="relative grid min-h-screen place-items-center bg-background p-6">
      <Button
        variant="ghost"
        size="sm"
        className="absolute left-4 top-4 z-20 gap-2 text-muted-foreground hover:text-foreground sm:left-6 sm:top-6"
        asChild
      >
        <Link to="/" preload="intent">
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </Button>

      <GlassPanel className="w-full max-w-xl p-10 text-center shadow-2xl">
        <img
          src={accessRevokedIllustration}
          alt="No project access"
          width={160}
          height={160}
          className="mx-auto h-40 w-40 object-contain"
          loading="lazy"
        />
        <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight">
          {archived
            ? "This account has been archived."
            : "You don't currently have access to any projects."}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground">
          {archived
            ? "Contact your account administrator to be invited back."
            : "You can create a new SpaceScope account, or join an account when you're invited."}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {!archived && (
            <Button size="sm" className={CTA_BUTTON} asChild>
              <Link to="/onboarding" preload="intent">
                <Plus className="mr-1.5 h-4 w-4" />
                Create New Account / Project
              </Link>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </GlassPanel>
    </main>
  );
}
