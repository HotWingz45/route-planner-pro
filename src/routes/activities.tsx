import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Search, X, Clock, Users, ShieldAlert, Zap } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { ConfidenceBadge, WeeklyBadge, SampleDataBadge } from "@/components/badges";
import { MOCK_ACTIVITIES, MOCK_WEEKLY } from "@/lib/mock-data";
import { fmtMoney, fmtTime, fmtDate } from "@/lib/format";
import { applyWeekly } from "@/lib/engine";

const expectedPayout = (a: Activity, weekly: typeof MOCK_WEEKLY) =>
  ((a.minPayout + a.maxPayout) / 2) * applyWeekly(a, weekly);
import type { Activity } from "@/lib/types";

export const Route = createFileRoute("/activities")({
  head: () => ({ meta: [{ title: "Activities — ScorePath" }] }),
  component: Activities,
});

type SortKey = "payout" | "ppm" | "duration" | "risk" | "verified";

const FILTERS = [
  { key: "solo", label: "Solo" },
  { key: "crew", label: "Crew" },
  { key: "active", label: "Active" },
  { key: "passive", label: "Passive" },
  { key: "u30", label: "<30 min" },
  { key: "u60", label: "<60 min" },
  { key: "high", label: "High payout" },
  { key: "low-risk", label: "Low risk" },
  { key: "nosetup", label: "No setup" },
  { key: "boosted", label: "Boosted" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function Activities() {
  const [q, setQ] = useState("");
  const [active, setActive] = useState<Set<FilterKey>>(new Set());
  const [sort, setSort] = useState<SortKey>("ppm");
  const [open, setOpen] = useState<Activity | null>(null);

  const toggle = (k: FilterKey) => {
    const n = new Set(active);
    n.has(k) ? n.delete(k) : n.add(k);
    setActive(n);
  };

  const list = useMemo(() => {
    const filtered = MOCK_ACTIVITIES.filter((a) => {
      if (q && !a.name.toLowerCase().includes(q.toLowerCase())) return false;
      if (active.has("solo") && a.minPlayers > 1) return false;
      if (active.has("crew") && a.maxPlayers < 2) return false;
      if (active.has("active") && a.isPassive) return false;
      if (active.has("passive") && !a.isPassive) return false;
      if (active.has("u30") && a.completionMinutes > 30) return false;
      if (active.has("u60") && a.completionMinutes > 60) return false;
      if (active.has("high") && (a.minPayout + a.maxPayout) / 2 < 200000) return false;
      if (active.has("low-risk") && a.risk !== "low") return false;
      if (active.has("nosetup") && a.setupMinutes > 0) return false;
      if (active.has("boosted") && applyWeekly(a, MOCK_WEEKLY) <= 1) return false;
      return true;
    });
    const ppm = (a: Activity) => expectedPayout(a, MOCK_WEEKLY) / Math.max(a.completionMinutes + a.setupMinutes, 1);
    const riskN = (a: Activity) => a.risk === "low" ? 0 : a.risk === "medium" ? 1 : 2;
    return [...filtered].sort((a, b) => {
      switch (sort) {
        case "payout": return expectedPayout(b, MOCK_WEEKLY) - expectedPayout(a, MOCK_WEEKLY);
        case "duration": return a.completionMinutes - b.completionMinutes;
        case "risk": return riskN(a) - riskN(b);
        case "verified": return +new Date(b.lastVerified) - +new Date(a.lastVerified);
        default: return ppm(b) - ppm(a);
      }
    });
  }, [q, active, sort]);

  return (
    <AppShell>
      <PageHeader title="Activities Database" subtitle="Browse fictional sample activities. Filter, sort, and tap any card for details." actions={<SampleDataBadge />} />

      <div className="px-6 space-y-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search activities…" className="w-full rounded-lg border border-border bg-surface pl-9 pr-3 py-2 text-sm outline-none focus:border-neon-pink" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => toggle(f.key)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${active.has(f.key) ? "gradient-primary text-white" : "border border-border bg-surface text-text-secondary hover:bg-surface-hover"}`}>
              {f.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-text-muted">Sort</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs outline-none">
              <option value="ppm">Best $/min</option>
              <option value="payout">Highest payout</option>
              <option value="duration">Shortest duration</option>
              <option value="risk">Lowest risk</option>
              <option value="verified">Recently verified</option>
            </select>
          </div>
        </div>
      </div>

      <div className="px-6 pb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((a) => {
          const mult = applyWeekly(a, MOCK_WEEKLY);
          const ppm = expectedPayout(a, MOCK_WEEKLY) / Math.max(a.completionMinutes + a.setupMinutes, 1);
          return (
            <motion.button
              layout
              key={a.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2 }}
              onClick={() => setOpen(a)}
              className="rounded-2xl border border-border bg-surface p-4 text-left hover:border-purple/40 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-text-muted">{a.category}</div>
                  <div className="font-display text-base font-bold truncate">{a.name}</div>
                </div>
                <WeeklyBadge multiplier={mult} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <Stat icon={Clock} v={fmtTime(a.completionMinutes)} />
                <Stat icon={Users} v={`${a.minPlayers}–${a.maxPlayers}`} />
                <Stat icon={Zap} v={`${Math.round(ppm).toLocaleString()}/min`} />
                <Stat icon={ShieldAlert} v={a.risk} />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-success">{fmtMoney(a.minPayout)}–{fmtMoney(a.maxPayout)}</span>
                <ConfidenceBadge level={a.confidence} />
              </div>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {open && <Drawer activity={open} onClose={() => setOpen(null)} />}
      </AnimatePresence>
    </AppShell>
  );
}

function Stat({ icon: Icon, v }: { icon: typeof Clock; v: string }) {
  return <div className="flex items-center gap-1.5 text-text-secondary capitalize"><Icon className="h-3.5 w-3.5 text-text-muted" />{v}</div>;
}

function Drawer({ activity, onClose }: { activity: Activity; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-black/70 flex justify-end">
      <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 260, damping: 26 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md h-full bg-surface border-l border-border overflow-y-auto">
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted">{activity.category}</div>
              <h3 className="font-display text-xl font-bold">{activity.name}</h3>
            </div>
            <button onClick={onClose}><X className="h-5 w-5 text-text-muted hover:text-white" /></button>
          </div>
          <p className="text-sm text-text-secondary">{activity.description}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Info label="Duration" v={fmtTime(activity.completionMinutes)} />
            <Info label="Setup" v={fmtTime(activity.setupMinutes)} />
            <Info label="Payout range" v={`${fmtMoney(activity.minPayout)}–${fmtMoney(activity.maxPayout)}`} />
            <Info label="Players" v={`${activity.minPlayers}–${activity.maxPlayers}`} />
            <Info label="Risk" v={activity.risk} />
            <Info label="Income" v={activity.isPassive ? "passive" : "active"} />
            <Info label="Cooldown" v={`${activity.cooldownMinutes} min`} />
            <Info label="Last verified" v={fmtDate(activity.lastVerified)} />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <WeeklyBadge multiplier={activity.weeklyMultiplier} />
            <ConfidenceBadge level={activity.confidence} />
          </div>
          {activity.requirements.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-semibold text-text-secondary mb-1.5">Required assets</div>
              <div className="flex flex-wrap gap-1.5">
                {activity.requirements.map((r) => <span key={r.itemId} className="rounded-full bg-purple/10 border border-purple/20 px-2 py-1 text-[11px] text-lavender">{r.itemId}</span>)}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function Info({ label, v }: { label: string; v: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="text-[10px] uppercase tracking-wider text-text-muted">{label}</div>
      <div className="text-sm font-semibold mt-0.5 capitalize">{v}</div>
    </div>
  );
}
