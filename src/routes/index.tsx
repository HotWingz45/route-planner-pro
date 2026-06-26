import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Sparkles,
  Compass,
  ShoppingBag,
  CalendarRange,
  Boxes,
  Users,
  ArrowRight,
  Check,
  Zap,
  Target,
  TrendingUp,
} from "lucide-react";
import { Footer } from "@/components/app-shell";
import { AnimatedNumber } from "@/components/animated-number";
import { GoalRing } from "@/components/goal-ring";
import { GradientBar } from "@/components/gradient-bar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ScorePath — Stop Grinding Blind" },
      { name: "description", content: "Build a personalized money route based on what you own, how long you have, and what you want to buy next." },
      { property: "og:title", content: "ScorePath — Stop Grinding Blind" },
      { property: "og:description", content: "An unofficial GTA VI progression planner. Personalized routes, best-next-purchase scoring, and a weekly opportunity dashboard." },
    ],
  }),
  component: Landing,
});

const fade = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

function Landing() {
  return (
    <div className="min-h-screen">
      <TopNav />
      <Hero />
      <HowItWorks />
      <FeatureGrid />
      <Preview />
      <Pricing />
      <FAQ />
      <Footer />
    </div>
  );
}

function TopNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-[color:var(--void)]/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg gradient-primary">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-lg font-bold">ScorePath</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm text-text-secondary">
          <a href="#how" className="hover:text-white transition">How it works</a>
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#pricing" className="hover:text-white transition">Pricing</a>
          <a href="#faq" className="hover:text-white transition">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login" className="hidden sm:inline-flex rounded-lg px-3 py-2 text-sm text-text-secondary hover:text-white transition">Log in</Link>
          <Link to="/onboarding" className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-glow-pink)] hover:opacity-95 transition">
            Get Started <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-20 h-[520px] w-[520px] rounded-full bg-purple/30 blur-3xl"
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-20 h-[420px] w-[420px] rounded-full bg-neon-pink/20 blur-3xl"
        animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-24 md:pt-28 md:pb-32">
        <motion.div initial="hidden" animate="show" variants={fade} transition={{ duration: 0.6 }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-purple/30 bg-purple/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-lavender">
            <Sparkles className="h-3 w-3" />
            Unofficial GTA VI Progression Planner
          </span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="mt-6 font-display text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[0.95]"
        >
          Stop Grinding <br className="hidden sm:inline" />
          <span className="gradient-text">Blind.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-6 max-w-2xl text-base sm:text-lg text-text-secondary"
        >
          Build a personalized money route based on what you own, how long you have, and what you want to buy next. Plan the fastest route from what you own to what you want.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-8 flex flex-wrap items-center gap-3"
        >
          <Link to="/onboarding" className="inline-flex items-center gap-2 rounded-xl gradient-primary px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-glow-pink)] hover:opacity-95 transition active:scale-95">
            Build My Route <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-6 py-3 text-sm font-semibold text-white hover:bg-surface-hover transition">
            View Interactive Demo
          </Link>
        </motion.div>

        <DashboardPreview />
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, delay: 0.35, ease: "easeOut" }}
      className="relative mt-16 rounded-3xl border border-border bg-gradient-to-br from-surface to-[color:var(--purple-bg)] p-4 sm:p-6 shadow-2xl"
    >
      <div className="absolute -inset-px rounded-3xl pointer-events-none border border-purple/20" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-[color:var(--background)]/80 p-5">
          <div className="text-xs text-text-muted">Current Balance</div>
          <div className="mt-1 font-display text-3xl font-bold gradient-text">
            <AnimatedNumber value={840000} />
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-text-secondary">
            <TrendingUp className="h-3.5 w-3.5 text-success" />
            +<AnimatedNumber value={245000} className="text-success" /> this session
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-[color:var(--background)]/80 p-5 flex items-center gap-4">
          <GoalRing value={0.336} size={104} stroke={9} label="Goal" sublabel="Coastal Villa" />
          <div className="min-w-0">
            <div className="text-xs text-text-muted">Goal</div>
            <div className="font-display text-base font-bold truncate">Premium Operations Property</div>
            <div className="mt-1 text-xs text-text-secondary">$1.66M remaining · 3 sessions</div>
          </div>
        </div>
        <div className="rounded-2xl border border-neon-pink/30 bg-[color:var(--background)]/80 p-5 shadow-[var(--shadow-glow-pink)]">
          <div className="flex items-center justify-between">
            <div className="text-xs text-text-muted">Recommended Next</div>
            <span className="text-[10px] uppercase tracking-wider text-neon-pink">Top route</span>
          </div>
          <div className="mt-1 font-display text-lg font-bold">High-Value Contract</div>
          <div className="mt-2 text-xs text-text-secondary">35 min · $220K–$290K · 1.5x boost</div>
          <GradientBar value={0.82} className="mt-3" />
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-border bg-[color:var(--background)]/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs text-text-muted uppercase tracking-wider">Tonight&apos;s Route · 90 min</div>
          <div className="text-xs text-text-secondary">Expected: <span className="text-white font-semibold"><AnimatedNumber value={672000} /></span></div>
        </div>
        <div className="grid gap-2.5 md:grid-cols-5">
          {[
            { n: "High-Value Contract", t: "35m", p: "$245K" },
            { n: "Start Passive Production", t: "5m", p: "$0" },
            { n: "Quick Security Job", t: "14m", p: "$48K" },
            { n: "Sell Production", t: "22m", p: "$215K" },
            { n: "Bonus Survival", t: "16m", p: "$52K" },
          ].map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.08 }}
              className="rounded-xl border border-border bg-surface p-3"
            >
              <div className="text-[10px] text-text-muted">Step {i + 1}</div>
              <div className="text-xs font-semibold mt-0.5 truncate">{s.n}</div>
              <div className="mt-2 flex justify-between text-[11px] text-text-secondary">
                <span>{s.t}</span>
                <span className="text-success">{s.p}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function HowItWorks() {
  const steps = [
    { icon: Boxes, title: "Tell us what you own", desc: "Properties, businesses, vehicles, weapons, equipment." },
    { icon: Target, title: "Set your goal", desc: "A purchase, a money target, or progression milestone." },
    { icon: Compass, title: "Get your route", desc: "A deterministic, time-boxed plan with expected payouts and rationale." },
  ];
  return (
    <section id="how" className="mx-auto max-w-7xl px-6 py-20">
      <SectionHeader eyebrow="How it works" title="From inventory to income in three steps." />
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {steps.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="rounded-2xl border border-border bg-surface p-6"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-purple/30 bg-purple/10 text-purple-electric">
              <s.icon className="h-5 w-5" />
            </div>
            <div className="mt-4 font-display text-lg font-bold">{s.title}</div>
            <p className="mt-1 text-sm text-text-secondary">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function FeatureGrid() {
  const features = [
    { icon: Compass, title: "Personalized Money Routes", desc: "Routes scored by payout-per-minute, weekly boosts, and your inventory." },
    { icon: ShoppingBag, title: "Best-Next-Purchase", desc: "Compare unlocks, utility, and time saved before you spend." },
    { icon: CalendarRange, title: "Weekly Opportunity Dashboard", desc: "Bonuses and discounts filtered to your style and inventory." },
    { icon: Boxes, title: "Inventory Tracking", desc: "Track ownership across properties, vehicles, weapons, and equipment." },
    { icon: Users, title: "Solo & Crew Planning", desc: "Routes adapt to crew size and risk tolerance." },
    { icon: Zap, title: "Deterministic Engine", desc: "No black-box AI. Transparent logic, explainable choices." },
  ];
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-20">
      <SectionHeader eyebrow="Features" title="Built for serious players." subtitle="Premium tooling for the players who actually plan their sessions." />
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="group rounded-2xl border border-border bg-surface p-6 hover:border-purple/40 transition"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl gradient-primary text-white opacity-90 group-hover:opacity-100">
              <f.icon className="h-5 w-5" />
            </div>
            <div className="mt-4 font-display text-base font-bold">{f.title}</div>
            <p className="mt-1 text-sm text-text-secondary">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Preview() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <SectionHeader eyebrow="Interactive Product Preview" title="The product, not a mockup." subtitle="Open the demo dashboard and explore the full workflow." />
      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-xl gradient-primary px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-glow-pink)]">
          Open Live Demo <ArrowRight className="h-4 w-4" />
        </Link>
        <Link to="/planner" className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-6 py-3 text-sm font-semibold hover:bg-surface-hover transition">
          Try the Planner
        </Link>
      </div>
    </section>
  );
}

function Pricing() {
  const tiers = [
    {
      name: "Free", price: "$0", period: "forever",
      features: ["One player profile", "Basic activity database", "Three saved plans", "Limited purchase recommendations", "Includes ads"],
      cta: "Start free", to: "/signup", highlight: false,
    },
    {
      name: "Pro Monthly", price: "$4.99", period: "/ month",
      features: ["Unlimited saved plans", "Personalized weekly dashboard", "Complete inventory tracking", "Advanced purchase recommendations", "No ads", "Shareable plans"],
      cta: "Go Pro", to: "/pricing", highlight: true,
    },
    {
      name: "Founding Member", price: "$49", period: "one-time",
      features: ["Lifetime Pro access", "Founding badge", "Early feature access", "Private feedback channel", "Limited availability"],
      cta: "Become a founder", to: "/pricing", highlight: false,
    },
  ];
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-6 py-20">
      <SectionHeader eyebrow="Pricing" title="Pick a plan that fits your grind." />
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={`rounded-2xl border bg-surface p-6 ${t.highlight ? "border-neon-pink/40 shadow-[var(--shadow-glow-pink)]" : "border-border"}`}
          >
            <div className="text-xs uppercase tracking-wider text-text-muted">{t.name}</div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-display text-4xl font-bold">{t.price}</span>
              <span className="text-sm text-text-muted">{t.period}</span>
            </div>
            <ul className="mt-5 space-y-2.5 text-sm">
              {t.features.map((f) => (
                <li key={f} className="flex gap-2 text-text-secondary">
                  <Check className="h-4 w-4 shrink-0 text-success mt-0.5" /> {f}
                </li>
              ))}
            </ul>
            <Link
              to={t.to}
              className={`mt-6 block w-full text-center rounded-xl px-4 py-2.5 text-sm font-semibold transition ${t.highlight ? "gradient-primary text-white" : "border border-border hover:bg-surface-hover text-white"}`}
            >
              {t.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    { q: "Is ScorePath affiliated with Rockstar Games?", a: "No. ScorePath is an independent, unofficial companion platform and is not affiliated with or endorsed by Rockstar Games or Take-Two Interactive." },
    { q: "Does ScorePath use leaked content?", a: "No. All data is community-calibrated sample data, clearly labeled as such. Verified records require sources and a confidence rating." },
    { q: "Is this AI-generated guidance?", a: "No. ScorePath uses a transparent, deterministic recommendation engine. Every step in your route comes with an explicit rationale." },
    { q: "Will real GTA VI data replace sample data?", a: "Yes. The data layer is structured so verified game data can replace samples as confidence levels improve." },
  ];
  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 py-20">
      <SectionHeader eyebrow="FAQ" title="Common questions." />
      <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-surface">
        {items.map((it) => (
          <details key={it.q} className="group p-5">
            <summary className="cursor-pointer list-none flex items-center justify-between font-semibold">
              {it.q}
              <span className="text-text-muted text-xl group-open:rotate-45 transition">+</span>
            </summary>
            <p className="mt-2 text-sm text-text-secondary">{it.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="max-w-2xl">
      <div className="text-xs uppercase tracking-[0.18em] text-neon-pink">{eyebrow}</div>
      <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight">{title}</h2>
      {subtitle && <p className="mt-3 text-base text-text-secondary">{subtitle}</p>}
    </div>
  );
}
