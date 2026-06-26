import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Edit3, Compass, TrendingUp, Boxes, CalendarRange, ShoppingBag, ArrowRight, Clock } from "lucide-react";
import { useMemo } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { AnimatedNumber } from "@/components/animated-number";
import { GoalRing } from "@/components/goal-ring";
import { GradientBar } from "@/components/gradient-bar";
import { SampleDataBadge, WeeklyBadge } from "@/components/badges";
import { usePlayerStore } from "@/lib/store";
import { MOCK_ACTIVITIES, MOCK_INVENTORY, MOCK_PURCHASES, MOCK_RECENT_ACTIVITY, MOCK_WEEKLY } from "@/lib/mock-data";
import { buildRoute, scorePurchases } from "@/lib/engine";
import { fmtMoney, fmtTime, fmtRelative } from "@/lib/format";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — ScorePath" }] }),
  component: Dashboard,
});

function Dashboard() {
  const profile = usePlayerStore((s) => s.profile);
  const plans = usePlayerStore((s) => s.plans);
  const rec = useMemo(() => buildRoute(profile, MOCK_ACTIVITIES, MOCK_WEEKLY), [profile]);
  const topPurchase = useMemo(() => scorePurchases(profile, MOCK_PURCHASES, MOCK_WEEKLY)[0], [profile]);
  const goalProgress = Math.min(profile.currentBalance / profile.goal.targetAmount, 1);
  const remaining = Math.max(profile.goal.targetAmount - profile.currentBalance, 0);
  const ownedItems = MOCK_INVENTORY.filter((i) => profile.inventory.ownedItemIds.includes(i.id));
  const totalValue = ownedItems.reduce((s, i) => s + i.estimatedValue, 0);

  return (
    <AppShell>
      <PageHeader
        title={`Welcome back, Operator.`}
        subtitle="Your current operating picture, with the next best move pre-calculated."
        actions={
          <>
            <SampleDataBadge />
            <Link to="/settings" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm hover:bg-surface-hover transition">
              <Edit3 className="h-3.5 w-3.5" /> Edit profile
            </Link>
            <Link to="/planner" className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-glow-pink)]">
              <Compass className="h-3.5 w-3.5" /> Start Planning
            </Link>
          </>
        }
      />

      <div className="px-6 grid gap-4 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-surface p-5 lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <div className="text-xs text-text-muted uppercase tracking-wider">Current balance</div>
              <div className="font-display text-4xl font-bold gradient-text mt-1">
                <AnimatedNumber value={profile.currentBalance} />
              </div>
              <div className="mt-2 inline-flex items-center gap-1 text-xs text-success">
                <TrendingUp className="h-3.5 w-3.5" /> Trending up
              </div>
            </div>
            <div className="flex items-center justify-center">
              <GoalRing value={goalProgress} size={140} stroke={11} label="Goal progress" />
            </div>
            <div>
              <div className="text-xs text-text-muted uppercase tracking-wider">Primary goal</div>
              <div className="font-display text-lg font-bold mt-1 truncate">{profile.goal.label}</div>
              <div className="mt-1 text-sm text-text-secondary">{fmtMoney(remaining)} remaining</div>
              <div className="mt-1 text-xs text-text-muted">~{rec.sessionsRemaining} sessions of {profile.sessionLength} min</div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="rounded-2xl border border-neon-pink/30 bg-surface p-5 shadow-[var(--shadow-glow-pink)]">
          <div className="flex items-center justify-between">
            <div className="text-xs text-text-muted uppercase tracking-wider">Recommended next activity</div>
            {rec.steps[0] && <WeeklyBadge multiplier={rec.steps[0].estimatedPayoutMax / rec.steps[0].activity.maxPayout} />}
          </div>
          {rec.steps[0] ? (
            <>
              <div className="font-display text-xl font-bold mt-2">{rec.steps[0].activity.name}</div>
              <div className="text-xs text-text-secondary mt-1">{fmtTime(rec.steps[0].estimatedMinutes)} · {fmtMoney(rec.steps[0].estimatedPayoutMin)}–{fmtMoney(rec.steps[0].estimatedPayoutMax)}</div>
              <p className="text-xs text-text-muted mt-2 line-clamp-2">{rec.steps[0].rationale}</p>
              <Link to="/planner" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold gradient-text">View full route <ArrowRight className="h-3.5 w-3.5 text-neon-pink" /></Link>
            </>
          ) : (
            <div className="text-sm text-text-muted mt-3">Open the planner to generate a route.</div>
          )}
        </motion.div>
      </div>

      <div className="px-6 mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Best Next Purchase" icon={ShoppingBag} to="/purchases">
          {topPurchase && (
            <>
              <div className="font-display text-lg font-bold">{topPurchase.option.name}</div>
              <div className="text-xs text-text-secondary mt-1">{fmtMoney(topPurchase.option.price)}</div>
              <div className="mt-3 flex items-center gap-2">
                <GradientBar value={topPurchase.overall / 100} className="flex-1" />
                <span className="text-xs font-semibold">{topPurchase.overall}</span>
              </div>
              <p className="text-xs text-text-muted mt-2 line-clamp-2">{topPurchase.reasons[0] ?? "Strong overall value for your profile."}</p>
            </>
          )}
        </Card>

        <Card title="Weekly Opportunities" icon={CalendarRange} to="/weekly">
          <div className="space-y-2.5">
            {MOCK_WEEKLY.slice(0, 3).map((w) => (
              <div key={w.id} className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{w.title}</div>
                  <div className="text-[11px] text-text-muted">{w.type}</div>
                </div>
                <Clock className="h-3.5 w-3.5 text-text-muted shrink-0" />
              </div>
            ))}
          </div>
        </Card>

        <Card title="Inventory Summary" icon={Boxes} to="/inventory">
          <div className="font-display text-2xl font-bold">{ownedItems.length} <span className="text-sm text-text-muted font-sans font-normal">owned</span></div>
          <div className="text-xs text-text-secondary mt-1">Estimated value {fmtMoney(totalValue)}</div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {["property", "business", "vehicle", "weapon", "equipment"].map((cat) => {
              const count = ownedItems.filter((i) => i.category === cat).length;
              return (
                <span key={cat} className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] text-text-secondary uppercase tracking-wider">
                  {cat} {count}
                </span>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="px-6 mt-4 grid gap-4 lg:grid-cols-2 pb-10">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-base font-bold">Recent Plans</h3>
            <Link to="/planner" className="text-xs text-text-muted hover:text-white">View all</Link>
          </div>
          <div className="space-y-2">
            {plans.slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5">
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{p.name}</div>
                  <div className="text-[11px] text-text-muted">{fmtRelative(p.createdAt)} · {fmtTime(p.recommendation.totalMinutes)}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold text-success">{fmtMoney(p.recommendation.expectedPayout)}</div>
                  <div className="text-[10px] text-text-muted">{p.completed ? "Completed" : "Active"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="font-display text-base font-bold mb-3">Recent Activity</h3>
          <div className="space-y-2">
            {MOCK_RECENT_ACTIVITY.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <div className="min-w-0">
                  <div className="truncate">{r.label}</div>
                  <div className="text-[11px] text-text-muted">{fmtRelative(r.at)}</div>
                </div>
                <span className="text-success font-semibold shrink-0">+{fmtMoney(r.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Card({ title, icon: Icon, to, children }: { title: string; icon: typeof Boxes; to: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg border border-purple/30 bg-purple/10">
            <Icon className="h-3.5 w-3.5 text-purple-electric" />
          </div>
          <h3 className="font-display text-base font-bold">{title}</h3>
        </div>
        <Link to={to} className="text-text-muted hover:text-white">
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      {children}
    </motion.div>
  );
}
