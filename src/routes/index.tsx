import { useEffect, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Kanban,
  Timer,
  BarChart3,
  Sparkles,
  Telescope,
  ListChecks,
  FileText,
  Gauge,
  Activity,
  History,
  Check,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";
import { GlassPanel } from "@/shared/ui/glass/glass-panel";
import { NeonBadge } from "@/shared/ui/glass/neon-badge";
import { Button } from "@/shared/ui/button";
import {
  PlanningMock,
  BoardMock,
  DashboardMock,
  TimeTrackingMock,
  DocumentsMock,
  SprintStatusMock,
  ReleaseNotesMock,
  AuditMock,
} from "@/features/marketing/components/feature-mockups";
import { ThemeToggle } from "@/shared/ui/theme-toggle";
import { useAuth } from "@/features/auth/auth-context";
import { consumePostLoginRedirect } from "@/features/auth/lib/post-login-redirect";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Space Scope — Sprint planning that feels native" },
      {
        name: "description",
        content:
          "Project planning, sprint boards, analytics, time tracking, docs, sprint reports, release notes and a full audit trail in one premium workspace.",
      },
      { property: "og:title", content: "Space Scope — Sprint planning that feels native" },
      {
        property: "og:description",
        content:
          "Project planning, sprint boards, analytics, time tracking, docs, sprint reports, release notes and a full audit trail in one premium workspace.",
      },
      { property: "og:url", content: "https://spacescope.ai/" },
    ],
    links: [{ rel: "canonical", href: "https://spacescope.ai/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: "Space Scope",
              url: "https://spacescope.ai/",
              logo: "https://spacescope.ai/apple-touch-icon.png",
            },
            {
              "@type": "WebSite",
              name: "Space Scope",
              url: "https://spacescope.ai/",
            },
            {
              "@type": "SoftwareApplication",
              name: "Space Scope",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              url: "https://spacescope.ai/",
              description:
                "Project planning, sprint boards, analytics, time tracking, docs, sprint reports, release notes and a full audit trail in one premium workspace.",
              featureList: [
                "Project Planning",
                "Sprint Boards",
                "Dashboard Analytics",
                "Team Time Tracking",
                "Documents Library",
                "Sprint Status Reports",
                "Release Notes",
                "Full Audit Trail",
              ],
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            },
          ],
        }),
      },
    ],
  }),
  component: Landing,
});

const HIGHLIGHTS = [
  {
    icon: Kanban,
    label: "Backlog & Sprints",
    desc: "Drag tickets from an infinite backlog into the current sprint with physics-based motion.",
  },
  {
    icon: Timer,
    label: "Precise Time Tracking",
    desc: "Estimate in days, hours, minutes. Log work with notes and watch the delta render itself.",
  },
  {
    icon: BarChart3,
    label: "Sharp Analytics",
    desc: "Estimated vs actual hours per ticket, color-coded variance, and team utilization.",
  },
  {
    icon: Sparkles,
    label: "Auto Release Notes",
    desc: "Shipped features aggregate into a chronological client-facing timeline each sprint.",
  },
];

type Tone = "cyan" | "violet" | "lime" | "amber" | "rose" | "magenta";

interface Feature {
  n: string;
  icon: LucideIcon;
  tone: Tone;
  title: string;
  blurb: string;
  points: string[];
  Mock: () => ReactNode;
}

const FEATURES: Feature[] = [
  {
    n: "01",
    icon: ListChecks,
    tone: "violet",
    title: "Project Planning",
    blurb: "Shape the roadmap before a single sprint starts.",
    points: [
      "Infinite backlog with priorities, owners & progress",
      "Group work into epics and quarterly roadmaps",
      "Drag-to-rank and bulk edit in seconds",
      "Capacity-aware planning so you never overcommit",
    ],
    Mock: PlanningMock,
  },
  {
    n: "02",
    icon: Kanban,
    tone: "cyan",
    title: "Sprint Boards",
    blurb: "A kanban that moves the way your team thinks.",
    points: [
      "Custom columns with WIP limits per workflow",
      "Smooth drag-and-drop with instant status sync",
      "Assignees, estimates and labels at a glance",
      "Live updates across the whole team",
    ],
    Mock: BoardMock,
  },
  {
    n: "03",
    icon: Gauge,
    tone: "amber",
    title: "Dashboard Analytics",
    blurb: "See sprint health and delivery at a glance.",
    points: [
      "Estimated vs logged hours, color-coded by variance",
      "Per-person stacked time and sprint burn",
      "Filter by sprint to track progress over time",
      "Estimated close dates against actuals",
    ],
    Mock: DashboardMock,
  },
  {
    n: "04",
    icon: Timer,
    tone: "lime",
    title: "Team Time Tracking",
    blurb: "Effortless logging that respects your team's flow.",
    points: [
      "Log work in days, hours and minutes with notes",
      "Per-member utilization against weekly capacity",
      "See overload and idle time at a glance",
      "Roll time up to tickets, sprints and projects",
    ],
    Mock: TimeTrackingMock,
  },
  {
    n: "05",
    icon: FileText,
    tone: "magenta",
    title: "Documents Library",
    blurb: "A home for specs, runbooks and decisions.",
    points: [
      "Rich-text docs with images, tables and tasks",
      "Full-text search across the whole library",
      "Versioned and attributed to every author",
      "Linked to the projects they belong to",
    ],
    Mock: DocumentsMock,
  },
  {
    n: "06",
    icon: Activity,
    tone: "violet",
    title: "Sprint Status Reports",
    blurb: "Share a live RAG health report with your clients.",
    points: [
      "Red/Amber/Green status for every ticket in the sprint",
      "AI-summarised issues, next steps and solutions",
      "Download as PDF or share via email in a click",
      "Always current — no manual status decks",
    ],
    Mock: SprintStatusMock,
  },
  {
    n: "07",
    icon: Sparkles,
    tone: "cyan",
    title: "Release Notes",
    blurb: "Shipped work becomes a story, automatically.",
    points: [
      "Completed tickets aggregate into each release",
      "Clean, chronological client-facing changelog",
      "Tag features, fixes and improvements",
      "Publish in a click — no copy-paste",
    ],
    Mock: ReleaseNotesMock,
  },
  {
    n: "08",
    icon: History,
    tone: "rose",
    title: "Full Audit Trail",
    blurb: "Every change, captured and accountable.",
    points: [
      "Immutable log of who did what and when",
      "Track moves, edits, deploys and time logs",
      "Filter by person, project or action type",
      "Compliance-ready history out of the box",
    ],
    Mock: AuditMock,
  },
];

function Landing() {
  const { user: session, loading: authLoading } = useAuth();

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  // Google sign-in returns to the site root. If the visit started from a deep
  // link (e.g. a ticket URL), hand the now-authenticated user straight back to
  // it instead of stranding them on the marketing page.
  useEffect(() => {
    if (authLoading || !session) return;
    const dest = consumePostLoginRedirect();
    if (dest) window.location.assign(dest);
  }, [authLoading, session]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="aurora-bg" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between p-6">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Telescope className="h-5 w-5" />
          </div>
          <span className="font-semibold tracking-tight">Space Scope</span>
        </div>
        <div className="flex items-center gap-2">
          {authLoading ? (
            <div className="h-9 w-24 animate-pulse rounded-full bg-muted" />
          ) : session ? (
            <Link to="/dashboard">
              <Button variant="ghost" className="rounded-full">
                <LayoutDashboard className="h-4 w-4" />
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" className="rounded-full">
                  Sign in
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="rounded-full">Sign up</Button>
              </Link>
            </>
          )}
          <ThemeToggle />
        </div>
      </header>

      <main>
        <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto inline-flex"
          >
            <NeonBadge tone="violet">See What's Up</NeonBadge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="text-balance mt-6 font-display text-5xl font-bold tracking-tight md:text-7xl"
          >
            Plan, Work, Log, Report
            <span className="bg-gradient-to-br from-primary via-neon-violet to-neon-magenta bg-clip-text text-transparent">
              {" "}
              and Repeat.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-balance mx-auto mt-6 max-w-2xl text-lg text-muted-foreground"
          >
            Space brings backlogs, sprint planning, time tracking, analytics, workforce utilisation,
            and release notes into one easy, premium surface — built for admins, PMs, developers,
            and clients.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-10 flex flex-wrap justify-center gap-3"
          >
            <Link to={session ? "/dashboard" : "/signup"}>
              <Button
                size="lg"
                className="rounded-full bg-primary px-6 shadow-lg shadow-primary/30"
                disabled={authLoading}
              >
                {authLoading ? "Loading…" : session ? "Go to Dashboard" : "Get started"}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-4 text-left"
          >
            {HIGHLIGHTS.map((f) => (
              <GlassPanel key={f.label} className="p-5">
                <f.icon className="h-5 w-5 text-primary" />
                <div className="mt-3 font-semibold">{f.label}</div>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </GlassPanel>
            ))}
          </motion.div>
        </section>

        {/* Running list of product features */}
        <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
          <div className="mx-auto max-w-2xl text-center">
            <NeonBadge tone="cyan">Everything in one place</NeonBadge>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-5xl">
              One workspace, eight superpowers
            </h2>
            <p className="mt-3 text-muted-foreground">
              From the first plan to the final audit entry — see how each part of Space Scope works.
            </p>
          </div>

          <div className="mt-16 space-y-20 md:space-y-28">
            {FEATURES.map((f, i) => {
              const reversed = i % 2 === 1;
              return (
                <motion.div
                  key={f.n}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.6 }}
                  className="grid items-center gap-8 md:grid-cols-2 md:gap-12"
                >
                  {/* Screenshot */}
                  <div className={reversed ? "md:order-2" : ""}>
                    <f.Mock />
                  </div>

                  {/* Copy */}
                  <div className={reversed ? "md:order-1" : ""}>
                    <div className="flex items-center gap-3">
                      <h3 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
                        {f.title}
                      </h3>
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <f.icon className="h-5 w-5" />
                      </span>
                    </div>
                    <p className="mt-2 text-muted-foreground">{f.blurb}</p>
                    <ul className="mt-5 space-y-2.5">
                      {f.points.map((p) => (
                        <li key={p} className="flex items-start gap-2.5">
                          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-neon-lime/15 text-neon-lime">
                            <Check className="h-3 w-3" />
                          </span>
                          <span className="text-sm text-foreground/90">{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative z-10 mx-auto max-w-4xl px-6 pb-24">
          <GlassPanel className="p-10 text-center md:p-14">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              Ready to see what's up?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Plan, work, log and report from one premium surface your whole team — and your clients
              — will love.
            </p>
          </GlassPanel>
        </section>
      </main>
    </div>
  );
}
