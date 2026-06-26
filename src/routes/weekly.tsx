import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Clock, Tag, Zap, Filter } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { SampleDataBadge } from "@/components/badges";
import { MOCK_WEEKLY, MOCK_ACTIVITIES, MOCK_PURCHASES } from "@/lib/mock-data";
import { usePlayerStore } from "@/lib/store";
import { fmtMoney } from "@/lib/format";

export const Route = createFileRoute("/weekly")({
  head: () => ({ meta: [{ title: "Weekly Opportunities — ScorePath" }] }),
  component: Weekly,
});

type FilterKey = "relevant" | "all" | "owned" | "unowned" | "solo" | "crew";

function Weekly() {
  const profile = usePlayerStore((s) => s.profile);
  const [filter, setFilter] = useState<FilterKey>("relevant");
  const soonest = useMemo(() => Math.min(...MOCK_WEEKLY.map((w) => +new Date(w.expiresAt))), []);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const remaining = Math.max(soonest - now, 0);
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const mins = Math.floor((remaining % 3600000) / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);

  const filtered = MOCK_WEEKLY.filter((w) => {
    if (filter === "all") return true;
    const matchActivities = w.appliesToActivityIds ?? [];
    const matchItems = w.appliesToItemIds ?? [];
    if (filter === "owned") return matchItems.some((id) => profile.inventory.ownedItemIds.includes(id)) || matchActivities.some((id) => MOCK_ACTIVITIES.find((a) => a.id === id)?.requirements.every((r) => profile.inventory.ownedItemIds.includes(r.itemId)));
    if (filter === "unowned") return matchItems.some((id) => !profile.inventory.ownedItemIds.includes(id));
    if (filter === "solo") return matchActivities.some((id) => (MOCK_ACTIVITIES.find((a) => a.id === id)?.minPlayers ?? 1) === 1);
    if (filter === "crew") return matchActivities.some((id) => (MOCK_ACTIVITIES.find((a) => a.id === id)?.maxPlayers ?? 1) > 1);
    // relevant
    const actsOk = matchActivities.some((id) => {
      const a = MOCK_ACTIVITIES.find((x) => x.id === id);
      if (!a) return false;
      return a.requirements.every((r) => profile.inventory.ownedItemIds.includes(r.itemId));
    });
    const itemsOk = matchItems.length > 0;
    return actsOk || itemsOk;
  });

  const recPurchases = MOCK_PURCHASES.filter((p) => MOCK_WEEKLY.some((w) => w.appliesToItemIds?.includes(p.id)));
  const avoid = MOCK_PURCHASES.filter((p) => p.price > profile.goal.targetAmount * 0.6 && p.id !== profile.goal.targetItemId).slice(0, 2);

  return (
    <AppShell>
      <PageHeader title="Weekly Opportunities" subtitle="Bonuses, discounts, and events worth playing this week." actions={<SampleDataBadge />} />

      <div className="px-6 grid gap-4 lg:grid-cols-[1fr_320px] pb-10">
        <div className="space-y-4">
          <div className="rounded-2xl border border-purple/30 bg-surface p-5">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Filter className="h-3.5 w-3.5" /> Filters
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(["relevant", "all", "owned", "unowned", "solo", "crew"] as FilterKey[]).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${filter === f ? "gradient-primary text-white" : "border border-border bg-background text-text-secondary hover:bg-surface-hover"}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((w, i) => (
              <motion.div key={w.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-text-muted">{w.type}</div>
                    <div className="font-display text-base font-bold">{w.title}</div>
                  </div>
                  {w.multiplier && <span className="rounded-full bg-neon-pink/10 border border-neon-pink/30 px-2 py-0.5 text-[11px] font-semibold text-neon-pink">{w.multiplier}x</span>}
                  {w.discountPct && <span className="rounded-full bg-success/10 border border-success/30 px-2 py-0.5 text-[11px] font-semibold text-success">-{w.discountPct}%</span>}
                </div>
                <p className="text-xs text-text-secondary mt-2">{w.description}</p>
                <div className="mt-3 flex items-center gap-2 text-[11px] text-text-muted">
                  <Clock className="h-3 w-3" /> expires {new Date(w.expiresAt).toLocaleDateString()}
                </div>
              </motion.div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-sm text-text-muted">No matching opportunities for this filter.</div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <h3 className="font-display text-base font-bold mb-2">Worth considering</h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {recPurchases.map((p) => (
                <div key={p.id} className="rounded-xl border border-border bg-background p-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">{p.name}</div>
                    <div className="text-[11px] text-text-muted">{fmtMoney(p.price)}</div>
                  </div>
                  <Tag className="h-4 w-4 text-success" />
                </div>
              ))}
            </div>
            {avoid.length > 0 && (
              <>
                <h3 className="font-display text-base font-bold mt-4 mb-2">Hold off this week</h3>
                <div className="grid sm:grid-cols-2 gap-2">
                  {avoid.map((p) => (
                    <div key={p.id} className="rounded-xl border border-warning/30 bg-warning/5 p-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold">{p.name}</div>
                        <div className="text-[11px] text-text-muted">would delay {profile.goal.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-neon-pink/30 bg-surface p-5 h-fit lg:sticky lg:top-4 shadow-[var(--shadow-glow-pink)]">
          <div className="flex items-center gap-2 text-xs text-text-muted"><Zap className="h-3.5 w-3.5 text-neon-pink" /> Weekly window closes in</div>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {[{ v: days, l: "d" }, { v: hours, l: "h" }, { v: mins, l: "m" }, { v: secs, l: "s" }].map((x) => (
              <div key={x.l} className="rounded-xl border border-border bg-background p-3 text-center">
                <div className="font-display text-xl font-bold gradient-text">{String(x.v).padStart(2, "0")}</div>
                <div className="text-[10px] text-text-muted">{x.l}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-text-muted mt-3">{filtered.length} opportunit{filtered.length === 1 ? "y" : "ies"} match this filter. Reset weekly.</p>
        </div>
      </div>
    </AppShell>
  );
}
