import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { usePlayerStore } from "@/lib/store";
import { MOCK_INVENTORY } from "@/lib/mock-data";
import type { PlayStyle, SessionLength, GoalType } from "@/lib/types";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Onboarding — ScorePath" }] }),
  component: Onboarding,
});

const STEPS = ["Play style", "Balance", "Session length", "Owned assets", "Goal", "Review"];

function Onboarding() {
  const nav = useNavigate();
  const setProfile = usePlayerStore((s) => s.setProfile);
  const profile = usePlayerStore((s) => s.profile);
  const toggleOwned = usePlayerStore((s) => s.toggleOwned);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState({
    playStyle: profile.playStyle as PlayStyle,
    balance: profile.currentBalance,
    sessionLength: profile.sessionLength as SessionLength,
    goalType: profile.goal.type as GoalType,
    goalLabel: profile.goal.label,
    goalAmount: profile.goal.targetAmount,
  });

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else {
      setProfile({
        playStyle: draft.playStyle,
        currentBalance: draft.balance,
        sessionLength: draft.sessionLength,
        goal: { ...profile.goal, type: draft.goalType, label: draft.goalLabel, targetAmount: draft.goalAmount },
      });
      toast.success("Profile ready");
      nav({ to: "/dashboard" });
    }
  };
  const back = () => step > 0 && setStep(step - 1);

  return (
    <div className="min-h-screen px-4 py-10 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <div className="grid h-8 w-8 place-items-center rounded-lg gradient-primary">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <span className="font-display text-lg font-bold">ScorePath</span>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-[11px] text-text-muted mb-2">
          <span>{STEPS[step]}</span>
          <span>Step {step + 1} of {STEPS.length}</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <motion.div className="h-full gradient-primary" animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }} transition={{ duration: 0.35 }} />
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8 min-h-[360px] relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            {step === 0 && (
              <Step title="What's your play style?" subtitle="We use this to shape every route and recommendation.">
                <div className="grid sm:grid-cols-2 gap-3">
                  {(["solo", "small-crew", "large-crew", "mixed"] as PlayStyle[]).map((v) => (
                    <Choice key={v} label={labelPlay(v)} active={draft.playStyle === v} onClick={() => setDraft({ ...draft, playStyle: v })} />
                  ))}
                </div>
              </Step>
            )}
            {step === 1 && (
              <Step title="What's your current balance?" subtitle="Tells us how close you are to your goals.">
                <input
                  type="number"
                  value={draft.balance}
                  onChange={(e) => setDraft({ ...draft, balance: Number(e.target.value) })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 font-display text-2xl outline-none focus:border-neon-pink"
                />
              </Step>
            )}
            {step === 2 && (
              <Step title="How long are your typical sessions?" subtitle="Routes will be planned to fit this window.">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {([30, 60, 90, 120, 180] as SessionLength[]).map((v) => (
                    <Choice key={v} label={`${v} min`} active={draft.sessionLength === v} onClick={() => setDraft({ ...draft, sessionLength: v })} />
                  ))}
                </div>
              </Step>
            )}
            {step === 3 && (
              <Step title="Select what you already own" subtitle="Skip anything you don't have. You can always edit later.">
                <div className="grid sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                  {MOCK_INVENTORY.map((it) => {
                    const owned = profile.inventory.ownedItemIds.includes(it.id);
                    return (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => toggleOwned(it.id)}
                        className={`text-left rounded-xl border px-3 py-2.5 text-sm transition ${owned ? "border-neon-pink/40 bg-neon-pink/5" : "border-border bg-background hover:bg-surface-hover"}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold truncate">{it.name}</span>
                          {owned && <Check className="h-4 w-4 text-neon-pink shrink-0" />}
                        </div>
                        <div className="text-[11px] text-text-muted uppercase tracking-wider">{it.category}</div>
                      </button>
                    );
                  })}
                </div>
              </Step>
            )}
            {step === 4 && (
              <Step title="What's your primary goal?" subtitle="We'll optimize routes against this target.">
                <div className="grid sm:grid-cols-2 gap-3">
                  {(["earn-money", "buy-property", "buy-vehicle", "upgrade-equipment", "complete-progression", "prepare-heist"] as GoalType[]).map((v) => (
                    <Choice key={v} label={labelGoal(v)} active={draft.goalType === v} onClick={() => setDraft({ ...draft, goalType: v })} />
                  ))}
                </div>
                <div className="mt-4 grid sm:grid-cols-2 gap-3">
                  <input
                    value={draft.goalLabel}
                    onChange={(e) => setDraft({ ...draft, goalLabel: e.target.value })}
                    placeholder="Goal label"
                    className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-neon-pink"
                  />
                  <input
                    type="number"
                    value={draft.goalAmount}
                    onChange={(e) => setDraft({ ...draft, goalAmount: Number(e.target.value) })}
                    placeholder="Target amount"
                    className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-neon-pink"
                  />
                </div>
              </Step>
            )}
            {step === 5 && (
              <Step title="Review your profile" subtitle="You can change anything later in Settings.">
                <dl className="grid sm:grid-cols-2 gap-3 text-sm">
                  <Row k="Play style" v={labelPlay(draft.playStyle)} />
                  <Row k="Balance" v={`$${draft.balance.toLocaleString()}`} />
                  <Row k="Session" v={`${draft.sessionLength} min`} />
                  <Row k="Owned assets" v={`${profile.inventory.ownedItemIds.length} items`} />
                  <Row k="Goal" v={draft.goalLabel} />
                  <Row k="Target" v={`$${draft.goalAmount.toLocaleString()}`} />
                </dl>
              </Step>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <button onClick={back} disabled={step === 0} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-4 py-2 text-sm disabled:opacity-40">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button onClick={next} className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-5 py-2 text-sm font-semibold text-white shadow-[var(--shadow-glow-pink)]">
          {step === STEPS.length - 1 ? "Finish" : "Continue"} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Step({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <p className="text-sm text-text-secondary mt-1.5 mb-5">{subtitle}</p>
      {children}
    </div>
  );
}

function Choice({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${active ? "border-neon-pink/50 bg-neon-pink/5 text-white shadow-[var(--shadow-glow-pink)]" : "border-border bg-background hover:bg-surface-hover"}`}
    >
      {label}
    </button>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl border border-border bg-background px-4 py-3">
      <div className="text-[10px] text-text-muted uppercase tracking-wider">{k}</div>
      <div className="font-semibold mt-0.5">{v}</div>
    </div>
  );
}

function labelPlay(v: PlayStyle): string {
  return ({ solo: "Solo", "small-crew": "Small crew (2-3)", "large-crew": "Large crew (4+)", mixed: "Mixed" } as const)[v];
}
function labelGoal(v: GoalType): string {
  return ({
    "earn-money": "Earn money",
    "buy-property": "Buy a property",
    "buy-vehicle": "Buy a vehicle",
    "upgrade-equipment": "Upgrade equipment",
    "complete-progression": "Complete progression",
    "prepare-heist": "Prepare for a heist",
  } as const)[v];
}
