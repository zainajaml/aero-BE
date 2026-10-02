import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LifeBuoy } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { CloseButton } from "@/shared/ui/close-button";
import { GlassPanel } from "@/shared/ui/glass/glass-panel";
import { cn } from "@/shared/lib/utils";
import { useAuth } from "@/features/auth/auth-context";
import { supportKeys, useSupportIssues, useSupportOpenCount } from "../hooks/support-queries";
import { SupportIssueList } from "./support-issue-list";
import { SupportIssueThread } from "./support-issue-thread";
import { SupportLightbox, type SupportLightboxItem } from "./support-lightbox";
import { SupportNewIssueForm } from "./support-new-issue-form";

const LAST_SEEN_KEY = "support-last-seen";

/** Locks background scrolling (compensating for the scrollbar) while `active`. */
function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [active]);
}

/** Sidebar "Support" entry (or icon button) that opens the support tickets modal. */
export function SupportWidget({
  variant = "icon",
  onNavigate,
}: {
  variant?: "icon" | "menu";
  onNavigate?: () => void;
} = {}) {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole("super_admin");
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<SupportLightboxItem | null>(null);
  const [sortDir] = useState<"desc" | "asc">("desc");
  const [isCreating, setIsCreating] = useState(false);
  const [createPending, setCreatePending] = useState(false);
  const hasAutoSelectedRef = useRef(false);

  useBodyScrollLock(open);

  const { data: issues = [] } = useSupportIssues(open, sortDir);
  const { data: openCount = 0 } = useSupportOpenCount();

  // Mark activity as seen whenever the panel is opened.
  useEffect(() => {
    if (open) {
      try {
        localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
      } catch {
        /* storage unavailable */
      }
      void qc.invalidateQueries({ queryKey: supportKeys.openCount(user?.id) });
    }
  }, [open, qc, user?.id]);

  // Auto-select the first ticket whenever the modal opens.
  useEffect(() => {
    if (!open) {
      hasAutoSelectedRef.current = false;
      return;
    }
    if (issues.length > 0 && !hasAutoSelectedRef.current) {
      setActiveId(issues[0].id);
      hasAutoSelectedRef.current = true;
    }
  }, [open, issues]);

  const activeIssue = issues.find((i) => i.id === activeId) ?? null;

  return (
    <>
      {variant === "menu" ? (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            onNavigate?.();
          }}
          className={cn(
            "flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-all",
            "hover:bg-accent/50 hover:text-foreground",
          )}
        >
          <LifeBuoy className="h-4 w-4" />
          <span>Support</span>
          {openCount > 0 && (
            <span className="ml-auto grid min-w-[18px] place-items-center rounded-full border border-border bg-muted px-1 text-[10px] font-bold leading-[16px] text-muted-foreground">
              {openCount > 9 ? "9+" : openCount}
            </span>
          )}
        </button>
      ) : (
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen((v) => !v)}
            className="rounded-full"
            aria-label="Support"
          >
            <LifeBuoy className="h-4 w-4" />
          </Button>
          {openCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid min-w-[18px] place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-[18px] text-destructive-foreground">
              {openCount > 9 ? "9+" : openCount}
            </span>
          )}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <GlassPanel
            role="dialog"
            aria-modal="true"
            aria-label="Support"
            className="relative flex h-[80vh] max-h-[960px] w-[70vw] max-w-[1400px] overflow-hidden border-glass-border p-0"
          >
            <SupportIssueList
              issues={issues}
              activeId={activeId}
              isAdmin={isAdmin}
              creating={createPending}
              onSelect={(id) => {
                setActiveId(id);
                setIsCreating(false);
              }}
              onNew={() => {
                setIsCreating(true);
                setActiveId(null);
              }}
            />

            {/* Right pane: conversation / new ticket */}
            <div className="relative flex min-w-0 flex-1 flex-col">
              {activeIssue ? (
                <SupportIssueThread
                  issue={activeIssue}
                  onClose={() => setOpen(false)}
                  onDeleted={() => setActiveId(null)}
                  onOpenMedia={setLightbox}
                />
              ) : isCreating ? (
                <SupportNewIssueForm
                  onCreated={(issue) => {
                    setActiveId(issue.id);
                    setIsCreating(false);
                  }}
                  onCancel={() => setIsCreating(false)}
                  onClose={() => {
                    setOpen(false);
                    setIsCreating(false);
                  }}
                  onPendingChange={setCreatePending}
                />
              ) : (
                <div className="relative flex flex-1 items-center justify-center px-6 py-4 text-sm text-muted-foreground">
                  <CloseButton
                    className="absolute right-4 top-4"
                    onClick={() => setOpen(false)}
                    aria-label="Close support"
                  />
                  Select a ticket to view the conversation.
                </div>
              )}
            </div>
          </GlassPanel>
        </div>
      )}

      <SupportLightbox item={lightbox} onClose={() => setLightbox(null)} />
    </>
  );
}
