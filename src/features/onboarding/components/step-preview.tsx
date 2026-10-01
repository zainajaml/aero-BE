import { Building2, Check, Circle } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { INVITE_ROLES, type InviteRole, type InviteRow } from "./onboarding-constants";

function PreviewFrame({
  step,
  caption,
  children,
}: {
  step: number;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <aside className="hidden min-h-[480px] flex-col rounded-2xl border border-border/60 bg-muted/30 p-5 lg:flex">
      <div className="mb-4 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              "h-2 w-2 rounded-full transition-colors",
              i <= step ? "bg-primary/60" : "bg-border",
            )}
          />
        ))}
      </div>
      <div className="flex-1">{children}</div>
      <p className="mt-4 text-xs text-muted-foreground">{caption}</p>
    </aside>
  );
}

export function StepPreview({
  step,
  workspaceName,
  projectName,
  projectKey,
  projectType,
  invites,
  projectCreated,
}: {
  step: number;
  workspaceName: string;
  projectName: string;
  projectKey: string;
  projectType: "sprint" | "kanban";
  invites: InviteRow[];
  projectCreated: boolean;
}) {
  const account = workspaceName || "Your account";
  const project = projectName || "Your first project";
  const code = projectKey || "KEY";

  if (step === 0) {
    return (
      <PreviewFrame step={step} caption="Your account groups every project, member and report.">
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 p-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-sm font-semibold text-primary">
              {workspaceName ? (
                account.slice(0, 2).toUpperCase()
              ) : (
                <Building2 className="h-5 w-5" />
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{account}</p>
              <p className="text-xs text-muted-foreground">Account · Account admin</p>
            </div>
          </div>
          <div className="space-y-2">
            {["Project", "Team", "Reports"].map((row) => (
              <div
                key={row}
                className="flex items-center justify-between rounded-lg border border-border/50 bg-background/40 px-3 py-2.5"
              >
                <span className="text-xs text-muted-foreground">{row}</span>
                <span className="h-1.5 w-16 rounded-full bg-border" />
              </div>
            ))}
          </div>
        </div>
      </PreviewFrame>
    );
  }

  if (step === 1) {
    const columns =
      projectType === "kanban" ? ["To do", "In progress", "Done"] : ["Backlog", "Sprint 1", "Done"];
    return (
      <PreviewFrame
        step={step}
        caption={
          projectType === "kanban"
            ? "A continuous board — work flows column to column."
            : "Sprint-based delivery with a groomed backlog."
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
              {code}
            </span>
            <p className="truncate text-sm font-medium">{project}</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {columns.map((col, ci) => (
              <div key={col} className="rounded-lg border border-border/50 bg-background/40 p-2">
                <p className="mb-2 truncate text-[10px] uppercase tracking-wide text-muted-foreground">
                  {col}
                </p>
                <div className="space-y-1.5">
                  {Array.from({ length: 3 - ci }).map((_, i) => (
                    <div
                      key={i}
                      className="space-y-1 rounded-md border border-border/50 bg-background/70 p-2"
                    >
                      <span className="block text-[9px] text-muted-foreground tabular-nums">
                        {code}-{ci * 3 + i + 1}
                      </span>
                      <span className="block h-1.5 w-full rounded-full bg-border" />
                      <span className="block h-1.5 w-2/3 rounded-full bg-border/70" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </PreviewFrame>
    );
  }

  if (step === 2) {
    const list = invites
      .map((r) => ({ email: r.email.trim(), role: r.role }))
      .filter((r) => r.email);
    const shown = list.length
      ? list
      : [
          { email: "teammate@company.com", role: "team" as InviteRole },
          { email: "designer@company.com", role: "viewer" as InviteRole },
        ];
    return (
      <PreviewFrame step={step} caption="Invited teammates get an email and land in this project.">
        <div className="space-y-2">
          {shown.map(({ email, role }, i) => (
            <div
              key={`${email}-${i}`}
              className={cn(
                "flex items-center gap-3 rounded-lg border border-border/50 bg-background/50 px-3 py-2.5",
                !list.length && "opacity-50",
              )}
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-[11px] font-medium text-primary">
                {email.slice(0, 2).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 truncate text-xs text-foreground/80">{email}</span>
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                {INVITE_ROLES.find((r) => r.value === role)?.label ?? "Team"}
              </span>
            </div>
          ))}
        </div>
      </PreviewFrame>
    );
  }

  const rows: { label: string; done: boolean }[] = [
    { label: `Account “${account}” created`, done: true },
    projectCreated
      ? { label: `Project ${code} · ${project}`, done: true }
      : { label: "Project pending — add one from Admin → Projects", done: false },
    projectCreated
      ? {
          label: projectType === "kanban" ? "Kanban board ready" : "Sprint board & backlog ready",
          done: true,
        }
      : { label: "Board setup pending — starts with your first project", done: false },
    { label: "You're the account admin", done: true },
  ];

  return (
    <PreviewFrame
      step={step}
      caption={
        projectCreated
          ? "Everything below is ready in your new account."
          : "Your account is ready — finish the rest whenever you like."
      }
    >
      <div className="space-y-2">
        {rows.map(({ label, done }) => (
          <div
            key={label}
            className={cn(
              "flex items-center gap-2.5 rounded-lg border border-border/50 bg-background/50 px-3 py-2.5",
              !done && "opacity-70",
            )}
          >
            {done ? (
              <Check className="h-4 w-4 shrink-0 text-primary" />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className="truncate text-xs text-foreground/80">{label}</span>
          </div>
        ))}
      </div>
    </PreviewFrame>
  );
}
