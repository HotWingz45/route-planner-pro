import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Check, Crown, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";

export const Route = createFileRoute("/pricing")({
  head: () => ({ meta: [{ title: "Pricing — ScorePath" }] }),
  component: Pricing,
});

function Pricing() {
  const [annual, setAnnual] = useState(false);

  const plans = [
    {
      name: "Free",
      price: "$0",
      cadence: "forever",
      cta: "Start free",
      features: ["One player profile", "Basic activity database", "Three saved plans", "Limited purchase recommendations", "Includes ads"],
      highlight: false,
    },
    {
      name: "Pro",
      price: annual ? "$39" : "$4.99",
      cadence: annual ? "per year" : "per month",
      cta: "Upgrade to Pro",
      features: ["Unlimited saved plans", "Personalized weekly dashboard", "Complete inventory tracking", "Advanced purchase recommendations", "No advertisements", "Shareable plans"],
      highlight: true,
    },
    {
      name: "Founding Member",
      price: "$49",
      cadence: "one-time",
      cta: "Become a founder",
      features: ["Lifetime Pro access", "Founding badge", "Early feature access", "Private feedback channel", "Limited availability"],
      highlight: false,
      crown: true,
    },
  ];

  return (
    <AppShell>
      <PageHeader title="Pricing" subtitle="Free to start. Upgrade for unlimited plans, weekly intel, and pro tools." />

      <div className="px-6">
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className={`text-sm ${!annual ? "text-white" : "text-text-muted"}`}>Monthly</span>
          <button onClick={() => setAnnual((v) => !v)} className={`relative h-6 w-11 rounded-full transition ${annual ? "gradient-primary" : "bg-white/10"}`} aria-pressed={annual}>
            <motion.span animate={{ x: annual ? 22 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="absolute top-0.5 h-5 w-5 rounded-full bg-white" />
          </button>
          <span className={`text-sm ${annual ? "text-white" : "text-text-muted"}`}>Annual <span className="ml-1 text-[10px] rounded-full bg-neon-pink/10 text-neon-pink px-1.5 py-0.5">save 35%</span></span>
        </div>

        <div className="grid gap-4 md:grid-cols-3 pb-10">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className={`relative rounded-2xl border bg-surface p-6 ${p.highlight ? "border-neon-pink/40 shadow-[var(--shadow-glow-pink)]" : "border-border"}`}
            >
              {p.highlight && (
                <span className="absolute -top-2.5 left-6 rounded-full gradient-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">Recommended</span>
              )}
              <div className="flex items-center gap-2">
                {p.crown ? <Crown className="h-4 w-4 text-neon-pink" /> : <Sparkles className="h-4 w-4 text-purple-electric" />}
                <h3 className="font-display text-lg font-bold">{p.name}</h3>
              </div>
              <div className="mt-3">
                <span className="font-display text-4xl font-bold">{p.price}</span>
                <span className="text-sm text-text-muted ml-1">{p.cadence}</span>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-text-secondary">
                    <Check className="h-4 w-4 text-success mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => toast.success(`${p.name} selected (demo checkout)`)}
                className={`mt-5 w-full rounded-xl px-4 py-2.5 text-sm font-semibold ${p.highlight ? "gradient-primary text-white" : "border border-border bg-background hover:bg-surface-hover"}`}
              >
                {p.cta}
              </button>
            </motion.div>
          ))}
        </div>

        <div className="text-center text-xs text-text-muted pb-10">
          Already have an account? <Link to="/login" className="text-neon-pink hover:underline">Log in</Link>
        </div>
      </div>
    </AppShell>
  );
}
