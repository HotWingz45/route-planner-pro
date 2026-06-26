import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Check, Sparkles } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { GradientBar } from "@/components/gradient-bar";
import { SampleDataBadge } from "@/components/badges";
import { usePlayerStore } from "@/lib/store";
import { MOCK_PURCHASES, MOCK_WEEKLY } from "@/lib/mock-data";
import { scorePurchases } from "@/lib/engine";
import { fmtMoney } from "@/lib/format";
import type { ItemCategory } from "@/lib/types";

export const Route = createFileRoute("/purchases")({
  head: () => ({ meta: [{ title: "What Should I Buy Next? — ScorePath" }] }),
  component: Purchases,
});

const CATS: (ItemCategory | "all")[] = ["all", "property", "business", "vehicle", "weapon", "equipment", "upgrade"];

function Purchases() {
  const profile = usePlayerStore((s) => s.profile);
  const [cat, setCat] = useState<ItemCategory | "all">("all");
  const [budget, setBudget] = useState<number>(profile.currentBalance);

  const scored = useMemo(() => {
    return scorePurchases(profile, MOCK_PURCHASES, MOCK_WEEKLY)
      .filter((p) => (cat === "all" || p.option.category === cat) && p.option.price <= Math.max(budget, 1));
  }, [profile, cat, budget]);

  return (
    <AppShell>
      <PageHeader title="What Should I Buy Next?" subtitle="Score every purchase against your profile, balance, and primary goal." actions={<SampleDataBadge />} />

      <div className="px-6 grid gap-4 lg:grid-cols-[360px_1fr] pb-10">
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 h-fit">
          <h3 className="font-display text-base font-bold flex items-center gap-2"><Sparkles className="h-4 w-4 text-neon-pink" /> Filters</h3>
          <div>
            <div className="text-xs text-text-secondary">Budget cap</div>
            <input type="number" value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-neon-pink" />
          </div>
          <div>
            <div className="text-xs text-text-secondary mb-1.5">Category</div>
            <div className="flex flex-wrap gap-1.5">
              {CATS.map((c) => (
                <button key={c} onClick={() => setCat(c)} className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${cat === c ? "gradient-primary text-white" : "border border-border bg-background text-text-secondary hover:bg-surface-hover"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-background p-3 text-xs text-text-muted">
            <div>Current balance <span className="text-white font-semibold">{fmtMoney(profile.currentBalance)}</span></div>
            <div>Primary goal <span className="text-white font-semibold">{profile.goal.label}</span></div>
          </div>
        </div>

        <div className="space-y-3">
          {scored.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center text-sm text-text-muted">
              No purchases match your filters and budget.
            </div>
          )}
          {scored.map((p, i) => (
            <motion.div key={p.option.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`rounded-2xl border bg-surface p-5 ${i === 0 ? "border-neon-pink/30 shadow-[var(--shadow-glow-pink)]" : "border-border"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-text-muted">{p.option.category}</div>
                  <div className="font-display text-lg font-bold">{p.option.name}</div>
                  <p className="text-xs text-text-secondary mt-1">{p.option.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-display text-2xl font-bold gradient-text">{p.overall}</div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wider">score</div>
                </div>
              </div>

              <div className="mt-4 grid sm:grid-cols-2 gap-3">
                <ScoreRow label="Income potential" v={p.option.incomePotential} />
                <ScoreRow label="Utility" v={p.option.utility} />
                <ScoreRow label="Solo usefulness" v={p.option.soloUsefulness} />
                <ScoreRow label="Crew usefulness" v={p.option.crewUsefulness} />
                <ScoreRow label="Time saved" v={p.option.timeSaved} />
                <ScoreRow label="Progression value" v={p.option.progressionValue} />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">{fmtMoney(p.option.price)}</span>
                {p.affordableNow ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/10 border border-success/30 px-2 py-0.5 text-[11px] text-success"><Check className="h-3 w-3" /> Affordable now</span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 border border-warning/30 px-2 py-0.5 text-[11px] text-warning"><AlertTriangle className="h-3 w-3" /> Save up</span>
                )}
                <button onClick={() => toast.success("Pinned to dashboard")} className="ml-auto rounded-lg gradient-primary px-3 py-1.5 text-xs font-semibold text-white">Pin as next target</button>
              </div>

              {(p.reasons.length > 0 || p.warnings.length > 0) && (
                <div className="mt-3 rounded-xl border border-border bg-background p-3 text-xs space-y-1.5">
                  {p.reasons.length > 0 && <div className="text-text-secondary">Recommended because it {p.reasons.join(", ")}.</div>}
                  {p.warnings.map((w, idx) => <div key={idx} className="text-warning inline-flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {w}</div>)}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function ScoreRow({ label, v }: { label: string; v: number }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] text-text-muted mb-1"><span>{label}</span><span>{v}</span></div>
      <GradientBar value={v / 100} />
    </div>
  );
}
