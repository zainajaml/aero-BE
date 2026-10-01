import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, Check, CheckCircle2, LogOut, Plus } from "lucide-react";
import { errorMessage } from "@/shared/api/errors";
import { CTA_BUTTON } from "@/shared/lib/cta";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { CloseButton } from "@/shared/ui/close-button";
import { GlassPanel } from "@/shared/ui/glass/glass-panel";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { useAuth } from "@/features/auth/auth-context";
import { switchWorkspaceContext } from "@/features/auth/lib/workspace-context";
import { createInvitation } from "@/features/invitations/api/invitations.api";
import { createFirstProject, createWorkspace, getOnboardingState } from "../api/onboarding.api";
import {
  INVITE_ROLES,
  NAME_SUGGESTIONS,
  PROJECT_TYPES,
  type InviteRole,
  type InviteRow,
} from "../components/onboarding-constants";
import { ProgressSteps } from "../components/progress-steps";
import { StepPreview } from "../components/step-preview";

export function OnboardingView() {
  const navigate = useNavigate();
  const { refreshRoles, signOut } = useAuth();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  const [accountId, setAccountId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  const [workspaceName, setWorkspaceName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const [projectType, setProjectType] = useState<"sprint" | "kanban">("sprint");
  const [invites, setInvites] = useState<InviteRow[]>([{ email: "", role: "team" }]);
  // Up to 10 teammates can be invited during onboarding.
  const MAX_INVITES = 10;

  // Resume the flow where the user left off. A refresh, a dropped connection or
  // a fresh sign-in all rebuild the step from what actually exists in the
  // backend, so nothing is created twice and no progress is lost.
  const [loadError, setLoadError] = useState(false);
  const loadState = async () => {
    setLoadError(false);
    try {
      const state = await getOnboardingState();
      if (state.accountId) {
        setAccountId(state.accountId);
        setWorkspaceName(state.accountName ?? "");
        if (state.projectId) {
          setProjectId(state.projectId);
          setProjectName(state.projectName ?? "");
          setProjectKey(state.projectKey ?? "");
          if (state.projectType) setProjectType(state.projectType);
          setStep(2);
        } else {
          setStep(1);
        }
      } else if (state.hasMembership) {
        // Existing member (invited or staff) — nothing to onboard.
        navigate({ to: "/dashboard", replace: true });
        return;
      } else {
        setStep(0);
      }
      setReady(true);
    } catch {
      // Offline or a hiccup mid-flow: never guess "first-time user", because
      // that could restart a flow whose account already exists.
      setLoadError(true);
      setReady(true);
    }
  };

  useEffect(() => {
    void loadState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitWorkspace(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await createWorkspace({ name: workspaceName });
      setAccountId(res.accountId);
      // The creator is now the workspace's Account Admin — refresh permissions.
      await refreshRoles();
      setStep(1);
    } catch (err) {
      toast.error(errorMessage(err, "Could not create workspace"));
    } finally {
      setBusy(false);
    }
  }

  async function submitProject(e: React.FormEvent) {
    e.preventDefault();
    if (!accountId) return;
    setBusy(true);
    try {
      // Passing the existing id keeps a "Back" edit as a rename, not a duplicate.
      const res = await createFirstProject({
        accountId,
        name: projectName,
        key: projectKey,
        projectType,
        projectId,
      });
      setProjectId(res.projectId);
      setStep(2);
    } catch (err) {
      toast.error(errorMessage(err, "Could not create project"));
    } finally {
      setBusy(false);
    }
  }

  async function submitInvites() {
    const seen = new Set<string>();
    const list = invites
      .map((r) => ({ email: r.email.trim().toLowerCase(), role: r.role }))
      .filter((r) => {
        if (!r.email || seen.has(r.email)) return false;
        seen.add(r.email);
        return true;
      });
    if (list.length === 0) {
      setStep(3);
      return;
    }
    if (list.length > MAX_INVITES) {
      toast.error(`You can invite up to ${MAX_INVITES} people here`);
      return;
    }
    const invalid = list.filter((r) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email));
    if (invalid.length > 0) {
      toast.error(`Invalid email: ${invalid[0].email}`);
      return;
    }
    setBusy(true);
    let sent = 0;
    for (const { email, role } of list) {
      try {
        await createInvitation({ email, role, projectIds: projectId ? [projectId] : [] });
        sent++;
      } catch (err) {
        toast.error(`${email}: ${errorMessage(err, "invite failed")}`);
      }
    }
    setBusy(false);
    if (sent > 0) toast.success(`Sent ${sent} invitation${sent === 1 ? "" : "s"}`);
    setStep(3);
  }

  function goToApp() {
    switchWorkspaceContext(projectId, accountId);
    window.location.assign("/dashboard");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 sm:p-8">
      <div className="aurora-bg" />
      <Button
        variant="ghost"
        size="sm"
        className="absolute left-4 top-4 z-20 gap-2 text-muted-foreground hover:text-foreground sm:left-6 sm:top-6"
        onClick={goToApp}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="absolute right-4 top-4 z-20 gap-2 text-muted-foreground hover:text-foreground sm:right-6 sm:top-6"
        onClick={() => void signOut()}
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-6xl"
      >
        <GlassPanel className="flex min-h-[660px] flex-col p-6 sm:p-10">
          <div className="mb-4 flex h-8 items-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="-ml-2 gap-1.5 bg-transparent text-muted-foreground hover:bg-transparent hover:text-foreground disabled:opacity-40"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={busy || !ready || !!loadError || step === 0}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>

          <div className="mb-2">
            <ProgressSteps step={step} />
          </div>

          {!ready ? (
            <p className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Loading…
            </p>
          ) : loadError ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <p className="text-sm text-muted-foreground">
                We couldn’t load your setup progress. Check your connection — your progress is
                saved, nothing was lost.
              </p>
              <Button size="sm" className={CTA_BUTTON} onClick={() => void loadState()}>
                Try again
              </Button>
            </div>
          ) : (
            <div className="grid flex-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
              {/* ---------- Left: form ---------- */}
              <div className="flex min-h-[480px] flex-col">
                {step === 0 ? (
                  <form onSubmit={submitWorkspace} className="flex flex-1 flex-col gap-4">
                    <header>
                      <h1 className="text-3xl font-semibold tracking-tight">Create your account</h1>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        This is where your project and team will live.
                      </p>
                    </header>
                    <div className="space-y-2">
                      <Label htmlFor="workspace-name">Account name</Label>
                      <Input
                        id="workspace-name"
                        className="max-w-xs"
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                        placeholder="Acme Inc."
                        maxLength={60}
                        autoFocus
                        required
                      />
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-xs text-muted-foreground">Examples:</span>
                        {NAME_SUGGESTIONS.map((name) => (
                          <button
                            key={name}
                            type="button"
                            onClick={() => setWorkspaceName(name)}
                            className={cn(
                              "rounded-full border px-3 py-1 text-xs transition-colors",
                              workspaceName === name
                                ? "border-primary bg-primary/10 text-foreground"
                                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
                            )}
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    </div>
                    <footer className="mt-auto flex items-center justify-end gap-2 border-t border-border/60 pt-5">
                      <Button type="submit" size="sm" className={CTA_BUTTON} disabled={busy}>
                        {busy ? "Creating…" : "Continue"}
                      </Button>
                    </footer>
                  </form>
                ) : step === 1 ? (
                  <form onSubmit={submitProject} className="flex flex-1 flex-col gap-4">
                    <header>
                      <h1 className="text-3xl font-semibold tracking-tight">
                        Create your first project
                      </h1>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        You can add another project later — nothing here is permanent.
                      </p>
                    </header>
                    <div className="flex flex-wrap gap-5">
                      <div className="w-full max-w-xs space-y-2">
                        <Label htmlFor="project-name">Project name</Label>
                        <Input
                          id="project-name"
                          value={projectName}
                          onChange={(e) => {
                            setProjectName(e.target.value);
                            if (!projectKey) {
                              setProjectKey(
                                e.target.value
                                  .toUpperCase()
                                  .replace(/[^A-Z0-9]/g, "")
                                  .slice(0, 8),
                              );
                            }
                          }}
                          placeholder="Atlas Web App"
                          maxLength={80}
                          autoFocus
                          required
                        />
                      </div>
                      <div className="w-32 space-y-2">
                        <Label htmlFor="project-key">Project key</Label>
                        <Input
                          id="project-key"
                          value={projectKey}
                          onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
                          placeholder="ATLAS"
                          maxLength={8}
                          required
                        />
                      </div>
                      <p className="w-full text-xs text-muted-foreground">
                        Project key is 2–8 letters, used in ticket codes (e.g. ATLAS-12)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>How do you want to track work?</Label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {PROJECT_TYPES.map(({ value, label, description, Icon }) => {
                          const selected = projectType === value;
                          return (
                            <button
                              key={value}
                              type="button"
                              aria-pressed={selected}
                              onClick={() => setProjectType(value)}
                              className={cn(
                                "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors",
                                selected
                                  ? "border-primary bg-primary/10"
                                  : "border-border hover:border-primary/50 hover:bg-muted/40",
                              )}
                            >
                              <span className="flex w-full items-center justify-between">
                                <Icon
                                  className={cn(
                                    "h-5 w-5",
                                    selected ? "text-primary" : "text-muted-foreground",
                                  )}
                                />
                                {selected && <Check className="h-4 w-4 text-primary" />}
                              </span>
                              <span className="text-sm font-medium">{label}</span>
                              <span className="text-xs leading-relaxed text-muted-foreground">
                                {description}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <footer className="mt-auto flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={goToApp}
                        disabled={busy}
                      >
                        Skip all
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setStep(2)}
                        disabled={busy}
                      >
                        Skip this step
                      </Button>

                      <Button type="submit" size="sm" className={CTA_BUTTON} disabled={busy}>
                        {busy ? (projectId ? "Saving…" : "Creating…") : "Continue"}
                      </Button>
                    </footer>
                  </form>
                ) : step === 2 ? (
                  <div className="flex flex-1 flex-col gap-4">
                    <header>
                      <h1 className="text-3xl font-semibold tracking-tight">Invite your team</h1>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        Add email addresses to invite people to{" "}
                        <span className="text-foreground">{workspaceName || "your account"}</span>.
                        Pick a permission role for each person.
                      </p>
                    </header>
                    <div className="space-y-2">
                      {invites.map((row, i) => (
                        <div key={i} className="flex w-full max-w-xl items-center gap-2 px-2">
                          <Input
                            type="email"
                            className="w-full min-w-0 flex-1"

                            value={row.email}
                            onChange={(e) =>
                              setInvites((prev) =>
                                prev.map((v, j) => (j === i ? { ...v, email: e.target.value } : v)),
                              )
                            }
                            placeholder="teammate@company.com"
                          />
                          <Select
                            value={row.role}
                            onValueChange={(val) =>
                              setInvites((prev) =>
                                prev.map((v, j) =>
                                  j === i ? { ...v, role: val as InviteRole } : v,
                                ),
                              )
                            }
                          >
                            <SelectTrigger
                              className="w-40 shrink-0 ml-2"
                              aria-label="Permission role"
                            >
                              <SelectValue className="truncate" />
                            </SelectTrigger>

                            <SelectContent>
                              {INVITE_ROLES.map((r) => (
                                <SelectItem key={r.value} value={r.value}>
                                  {r.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <CloseButton
                            aria-label="Remove email"
                            className={cn("ml-4", invites.length === 1 && "invisible")}
                            onClick={() => setInvites((prev) => prev.filter((_, j) => j !== i))}
                          />
                        </div>
                      ))}
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="gap-1.5"
                          disabled={invites.length >= MAX_INVITES}
                          onClick={() =>
                            setInvites((prev) =>
                              prev.length >= MAX_INVITES
                                ? prev
                                : [...prev, { email: "", role: "team" }],
                            )
                          }
                        >
                          <Plus className="h-4 w-4" />
                          Add another
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          {invites.length} of {MAX_INVITES}
                        </span>
                      </div>
                    </div>
                    <footer className="mt-auto flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setStep(3)}
                        disabled={busy}
                      >
                        Skip this step
                      </Button>
                      <Button
                        size="sm"
                        className={CTA_BUTTON}
                        onClick={submitInvites}
                        disabled={busy}
                      >
                        {busy ? "Inviting…" : "Invite & continue"}
                      </Button>
                    </footer>
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col items-start gap-4">
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-primary/15 text-primary">
                      <CheckCircle2 className="h-7 w-7" />
                    </span>
                    <h1 className="text-3xl font-semibold tracking-tight">You're all set</h1>
                    <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                      {projectId
                        ? `${workspaceName || "Your account"} is ready with your first project. You can invite more people any time from Admin.`
                        : `${workspaceName || "Your account"} is ready. Create your first project from Admin → Projects whenever you're ready — you can invite people there too.`}
                    </p>
                    <footer className="mt-auto flex w-full items-center justify-end gap-2 border-t border-border/60 pt-5">
                      <Button size="sm" className={CTA_BUTTON} onClick={goToApp}>
                        Go to Space Scope
                      </Button>
                    </footer>
                  </div>
                )}
              </div>

              {/* ---------- Right: illustrative preview ---------- */}
              <StepPreview
                step={step}
                workspaceName={workspaceName}
                projectName={projectName}
                projectKey={projectKey}
                projectType={projectType}
                invites={invites}
                projectCreated={!!projectId}
              />
            </div>
          )}
        </GlassPanel>
      </motion.div>
    </div>
  );
}
