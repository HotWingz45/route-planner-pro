import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { Compass, Loader2, Save, Share2, Clock, Target, CheckCircle2, Sparkles } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { AnimatedNumber } from "@/components/animated-number";
import { GradientBar } from "@/components/gradient-bar";
import { WeeklyBadge, SampleDataBadge } from "@/components/badges";
import { usePlayerStore } from "@/lib/store";
import { MOCK_ACTIVITIES, MOCK_WEEKLY } from "@/lib/mock-data";
import { buildRoute } from "@/lib/engine";
import { fmtMoney, fmtTime } from "@/lib/format";
import type { Recommendation, RiskLevel, SessionLength } from "@/lib/types";

export const Route = createFileRoute("/planner")({
  head: () => ({ meta: [{ title: "Planner — ScorePath" }] }),
  component: Planner,
});

function Planner() {
  const profile = usePlayerStore((s) => s.profile);
  const setProfile = usePlayerStore((s) => s.setProfile);
  const savePlan = usePlayerStore((s) => s.savePlan);
  const [loading, setLoading] = useState(false);
  const [rec, setRec] = useState<Recommendation | null>(null);

  const generate = async () => {
    setLoading(true);
    setRec(null);
    await new Promise((r) => setTimeout(r, 700));
    const result = buildRoute(profile, MOCK_ACTIVITIES, MOCK_WEEKLY);
    setRec(result);
    setLoading(false);
    if (result.steps.length === 0) toast.warning("No eligible activities — try increasing session length or adding inventory.");
  };

  const save = () => {
    if (!rec) return;
    savePlan({
      id: `plan-${Date.now()}`,
      name: `Route · ${new Date().toLocaleDateString()}`,
      createdAt: new Date().toISOString(),
      recommendation: rec,
      goal: profile.goal,
      completed: false,
    });
    toast.success("Plan saved");
  };

  return (
    <AppShell>
      <PageHeader
        title="Route Planner"
        subtitle="Configure your session, then generate a deterministic plan that fits your time, inventory, and goals."
        actions={<SampleDataBadge />}
      />

      <div className="px-6 grid gap-4 lg:grid-cols-[380px_1fr] pb-10">
        {/* Inputs */}
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 h-fit lg:sticky lg:top-4">
          <h3 className="font-display text-base font-bold flex items-center gap-2"><Sparkles className="h-4 w-4 text-neon-pink" /> Configure session</h3>

          <NumberField label="Current balance" value={profile.currentBalance} onChange={(v) => setProfile({ currentBalance: v })} />
          <NumberField label="Goal target" value={profile.goal.targetAmount} onChange={(v) => setProfile({ goal: { ...profile.goal, targetAmount: v } })} />
          <TextField label="Goal label" value={profile.goal.label} onChange={(v) => setProfile({ goal: { ...profile.goal, label: v } })} />

          <div>
            <Label>Session length</Label>
            <div className="grid grid-cols-5 gap-1.5 mt-1.5">
              {([30, 60, 90, 120, 180] as SessionLength[]).map((v) => (
                <button key={v} onClick={() => setProfile({ sessionLength: v })} className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${profile.sessionLength === v ? "gradient-primary text-white" : "border border-border bg-background hover:bg-surface-hover"}`}>
                  {v}m
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Risk preference</Label>
            <div className="grid grid-cols-3 gap-1.5 mt-1.5">
              {(["low", "medium", "high"] as RiskLevel[]).map((v) => (
                <button key={v} onClick={() => setProfile({ preferredRisk: v })} className={`rounded-lg px-2 py-2 text-xs font-semibold capitalize transition ${profile.preferredRisk === v ? "gradient-primary text-white" : "border border-border bg-background hover:bg-surface-hover"}`}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          <Toggle label="Prefer active income" checked={profile.preferActive} onChange={(v) => setProfile({ preferActive: v })} />
          <Toggle label="Include setup time in plan" checked={profile.includeSetupTime} onChange={(v) => setProfile({ includeSetupTime: v })} />

          <NumberField label="Minimum payout per activity" value={profile.minPayout} onChange={(v) => setProfile({ minPayout: v })} />

          <button
            onClick={generate}
            disabled={loading}
            className="w-full rounded-xl gradient-primary px-4 py-3 text-sm font-semibold text-white shadow-[var(--shadow-glow-pink)] disabled:opacity-70 inline-flex items-center justify-center gap-2 active:scale-[0.98] transition"
          >
            {loading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Calculating route…</>) : (<><Compass className="h-4 w-4" /> Generate My Route</>)}
          </button>
        </div>

        {/* Output */}
        <div>
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-2xl border border-border bg-surface p-10 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-neon-pink mx-auto" />
                <div className="mt-4 font-display text-lg font-bold">Calculating route</div>
                <div className="text-xs text-text-muted mt-1">Filtering activities · Scoring payout-per-minute · Sequencing route</div>
              </motion.div>
            )}
            {!loading && rec && <RouteResult key="result" rec={rec} onSave={save} />}
            {!loading && !rec && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
                <div className="mx-auto h-12 w-12 grid place-items-center rounded-2xl border border-purple/30 bg-purple/10">
                  <Compass className="h-5 w-5 text-purple-electric" />
                </div>
                <div className="font-display text-lg font-bold mt-4">Ready to plan</div>
                <p className="text-sm text-text-secondary mt-1 max-w-md mx-auto">Configure your session on the left and generate your personalized route. Every step explains why it was chosen.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppShell>
  );
}

function RouteResult({ rec, onSave }: { rec: Recommendation; onSave: () => void }) {
  const profile = usePlayerStore((s) => s.profile);
  const goalAfter = (profile.currentBalance + rec.expectedPayout) / profile.goal.targetAmount;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-4">
      <div className="rounded-2xl border border-neon-pink/30 bg-surface p-5 shadow-[var(--shadow-glow-pink)]">
        <div className="grid sm:grid-cols-3 gap-4">
          <Metric label="Expected payout" value={rec.expectedPayout} highlight />
          <div>
            <div className="text-xs text-text-muted uppercase tracking-wider">Range</div>
            <div className="font-display text-xl font-bold mt-1">{fmtMoney(rec.conservativePayout)} – {fmtMoney(rec.optimisticPayout)}</div>
            <div className="text-[11px] text-text-muted mt-0.5">conservative / optimistic estimate</div>
          </div>
          <div>
            <div className="text-xs text-text-muted uppercase tracking-wider">Time used</div>
            <div className="font-display text-xl font-bold mt-1">{fmtTime(rec.totalMinutes)}</div>
            <div className="text-[11px] text-text-muted mt-0.5">{rec.steps.length} activities · ~{rec.sessionsRemaining} sessions to goal</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-[11px] text-text-muted mb-1.5">
            <span>Goal progress after this session</span>
            <span>{Math.round(goalAfter * 100)}%</span>
          </div>
          <GradientBar value={goalAfter} />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base font-bold flex items-center gap-2"><Target className="h-4 w-4 text-neon-pink" /> Route timeline</h3>
          <div className="flex flex-wrap gap-2">
            <button onClick={onSave} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-surface-hover"><Save className="h-3.5 w-3.5" /> Save Plan</button>
            <button onClick={() => { navigator.clipboard?.writeText("ScorePath route"); toast.success("Plan link copied"); }} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-surface-hover"><Share2 className="h-3.5 w-3.5" /> Share</button>
            <button onClick={() => toast.success("Marked complete")} className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-1.5 text-xs font-semibold text-white"><CheckCircle2 className="h-3.5 w-3.5" /> Mark Complete</button>
          </div>
        </div>
        {rec.steps.length === 0 ? (
          <div className="text-sm text-text-muted">No activities fit these constraints. Try increasing session length or owning more assets.</div>
        ) : (
          <ol className="relative space-y-3">
            {rec.steps.map((s, i) => (
              <motion.li
                key={s.activity.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-xl border border-border bg-background p-4"
              >
                <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg gradient-primary text-white font-display font-bold text-sm shrink-0">{i + 1}</div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-base font-bold truncate">{s.activity.name}</span>
                      <WeeklyBadge multiplier={s.estimatedPayoutMax / s.activity.maxPayout} />
                      <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase font-semibold ${s.activity.risk === "low" ? "text-success bg-success/10" : s.activity.risk === "medium" ? "text-warning bg-warning/10" : "text-error bg-error/10"}`}>
                        {s.activity.risk} risk
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-1">{s.rationale}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-success">{fmtMoney(s.estimatedPayoutMin)}–{fmtMoney(s.estimatedPayoutMax)}</div>
                    <div className="text-[11px] text-text-muted flex items-center gap-1 justify-end mt-0.5"><Clock className="h-3 w-3" /> {fmtTime(s.estimatedMinutes)}</div>
                  </div>
                </div>
                {s.activity.requirements.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {s.activity.requirements.map((r) => (
                      <span key={r.itemId} className="rounded-full bg-purple/10 border border-purple/20 px-2 py-0.5 text-[10px] text-lavender">requires {r.itemId.replace(/^.+?-/, "")}</span>
                    ))}
                  </div>
                )}
              </motion.li>
            ))}
          </ol>
        )}
        <p className="mt-4 text-[11px] text-text-muted">All figures are deterministic estimates from your inputs and sample data. Not predictions of actual game payouts.</p>
      </div>
    </motion.div>
  );
}

function Metric({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div>
      <div className="text-xs text-text-muted uppercase tracking-wider">{label}</div>
      <div className={`font-display text-3xl font-bold mt-1 ${highlight ? "gradient-text" : ""}`}><AnimatedNumber value={value} /></div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-medium text-text-secondary">{children}</div>;
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-neon-pink"
      />
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-neon-pink"
      />
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-text-secondary">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition ${checked ? "gradient-primary" : "bg-white/10"}`}
        aria-pressed={checked}
      >
        <motion.span animate={{ x: checked ? 18 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="absolute top-0.5 h-4 w-4 rounded-full bg-white" />
      </button>
    </label>
  );
}
