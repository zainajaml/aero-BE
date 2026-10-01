import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Telescope, ListChecks, Gauge, Bot, Sparkles } from "lucide-react";
import { GlassPanel } from "@/shared/ui/glass/glass-panel";
import { NeonBadge } from "@/shared/ui/glass/neon-badge";
import { Button } from "@/shared/ui/button";
import { ThemeToggle } from "@/shared/ui/theme-toggle";

const PUBLISHED = "2026-07-08";
const CANONICAL = "https://spacescope.ai/blog/ai-sprint-planning";
const TITLE = "How to Use AI for Sprint Planning: A Practical Guide";
const DESCRIPTION =
  "A practical guide to AI sprint planning — automate backlog grooming, capacity planning and estimates so your team ships more predictably every sprint.";

export const Route = createFileRoute("/blog/ai-sprint-planning")({
  head: () => ({
    meta: [
      { title: TITLE + " — Space Scope" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { property: "og:url", content: CANONICAL },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Article",
              headline: TITLE,
              description: DESCRIPTION,
              datePublished: PUBLISHED,
              dateModified: PUBLISHED,
              mainEntityOfPage: CANONICAL,
              author: { "@type": "Organization", name: "Space Scope" },
              publisher: {
                "@type": "Organization",
                name: "Space Scope",
                logo: {
                  "@type": "ImageObject",
                  url: "https://spacescope.ai/apple-touch-icon.png",
                },
              },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://spacescope.ai/" },
                { "@type": "ListItem", position: 2, name: "AI Sprint Planning", item: CANONICAL },
              ],
            },
            {
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "What is AI sprint planning?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "AI sprint planning uses machine learning to speed up backlog grooming, estimation and capacity planning — suggesting what to pull into a sprint based on team velocity, historical estimates and current capacity, while people keep the final decision.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Can an AI act as a scrum master?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "An AI scrum master can automate the repetitive parts of the role — flagging blockers, summarising standups, drafting sprint status reports and spotting overcommitment — but a human still facilitates the team and owns delivery decisions.",
                  },
                },
              ],
            },
          ],
        }),
      },
    ],
  }),
  component: GuidePage,
});

const STEPS = [
  {
    icon: ListChecks,
    tone: "violet" as const,
    title: "1. Automate backlog grooming",
    body: "Let AI cluster duplicate tickets, suggest priorities from past delivery patterns, and draft clear acceptance criteria. Your team reviews a groomed backlog instead of building one from scratch.",
  },
  {
    icon: Gauge,
    tone: "amber" as const,
    title: "2. Estimate with historical data",
    body: "AI compares a new ticket against similar completed work to propose an estimate in hours or story points. Estimated-vs-actual variance then feeds the next round of suggestions, so accuracy improves each sprint.",
  },
  {
    icon: Bot,
    tone: "cyan" as const,
    title: "3. Plan capacity, not just scope",
    body: "Pull in each person's weekly capacity and current utilisation so the plan respects real availability. AI warns you before a sprint is overcommitted rather than after standup on day three.",
  },
  {
    icon: Sparkles,
    tone: "lime" as const,
    title: "4. Report automatically",
    body: "Turn the sprint into a live RAG status report and a client-facing changelog without a manual deck. The AI summarises issues, next steps and shipped work as the sprint moves.",
  },
];

function GuidePage() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="aurora-bg" />

      <header className="relative z-10 mx-auto flex max-w-3xl items-center justify-between p-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Telescope className="h-5 w-5" />
          </div>
          <span className="font-semibold tracking-tight">Space Scope</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-6 pb-24 pt-8">
        <article>
          <NeonBadge tone="violet">Guide</NeonBadge>
          <h1 className="text-balance mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl">
            How to use AI for sprint planning
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">Published July 8, 2026 · 6 min read</p>

          <p className="mt-6 text-lg text-muted-foreground">
            Sprint planning eats hours every cycle — grooming the backlog, guessing estimates and
            juggling who has time. AI won't replace your team's judgement, but it removes the
            busywork so planning takes minutes and lands closer to reality. Here's a practical way
            to fold AI into your existing agile workflow.
          </p>

          <section className="mt-10 space-y-6">
            {STEPS.map((s) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5 }}
              >
                <GlassPanel className="p-6">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <s.icon className="h-5 w-5" />
                    </span>
                    <h2 className="font-display text-xl font-semibold tracking-tight">{s.title}</h2>
                  </div>
                  <p className="mt-3 text-foreground/90">{s.body}</p>
                </GlassPanel>
              </motion.div>
            ))}
          </section>

          <h2 className="mt-12 font-display text-2xl font-bold tracking-tight">
            Should you use an AI scrum master?
          </h2>
          <p className="mt-3 text-muted-foreground">
            An "AI scrum master" is best understood as an assistant, not a replacement. It's
            excellent at the repetitive scaffolding of the role — summarising standups, flagging
            blockers, drafting sprint status reports and spotting overcommitment early. The
            facilitation, coaching and hard delivery calls still belong to a person. Used this way,
            AI gives your scrum master back the time to actually coach the team.
          </p>

          <h2 className="mt-10 font-display text-2xl font-bold tracking-tight">
            Where teams see the biggest wins
          </h2>
          <ul className="mt-4 space-y-2.5 text-foreground/90">
            <li>• Faster planning meetings — a groomed, pre-estimated backlog to react to.</li>
            <li>
              • Fewer surprises — capacity-aware plans that flag overload before the sprint starts.
            </li>
            <li>• Better estimates over time — variance data compounds into sharper forecasts.</li>
            <li>• Effortless reporting — status and release notes that write themselves.</li>
          </ul>

          <GlassPanel className="mt-12 p-8 text-center">
            <h2 className="font-display text-2xl font-bold tracking-tight">
              Plan smarter with Space Scope
            </h2>
            <p className="mx-auto mt-2 max-w-md text-muted-foreground">
              Backlogs, capacity-aware sprints, time tracking, analytics and auto-generated reports
              in one premium workspace.
            </p>
            <Link to="/login" className="mt-6 inline-block">
              <Button
                size="lg"
                className="rounded-full bg-primary px-6 shadow-lg shadow-primary/30"
              >
                Get started <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </GlassPanel>
        </article>
      </main>
    </div>
  );
}
