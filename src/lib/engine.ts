import type {
  Activity,
  PlayerProfile,
  Recommendation,
  RecommendationStep,
  PurchaseOption,
  WeeklyModifier,
} from "./types";

export function applyWeekly(activity: Activity, weekly: WeeklyModifier[]): number {
  const match = weekly.find(
    w => w.type !== "discount" && w.appliesToActivityIds?.includes(activity.id),
  );
  return match?.multiplier ?? activity.weeklyMultiplier ?? 1;
}

export function effectiveTime(a: Activity, includeSetup: boolean): number {
  return a.completionMinutes + (includeSetup ? a.setupMinutes : 0);
}

export function activityEligible(a: Activity, profile: PlayerProfile): boolean {
  if (profile.dislikedActivityIds.includes(a.id)) return false;
  if (a.minPlayers > 1 && profile.playStyle === "solo") return false;
  for (const r of a.requirements) {
    if (!profile.inventory.ownedItemIds.includes(r.itemId)) return false;
  }
  if (effectiveTime(a, profile.includeSetupTime) > profile.sessionLength) return false;
  const avg = (a.minPayout + a.maxPayout) / 2;
  if (avg < profile.minPayout) return false;
  if (profile.preferActive && a.isPassive) return false;
  return a.available;
}

interface Scored {
  activity: Activity;
  avgPayout: number;
  payoutPerMin: number;
  rationale: string;
  weeklyMult: number;
}

export function rankActivities(
  profile: PlayerProfile,
  activities: Activity[],
  weekly: WeeklyModifier[],
): Scored[] {
  return activities
    .filter(a => activityEligible(a, profile))
    .map(a => {
      const mult = applyWeekly(a, weekly);
      const avg = ((a.minPayout + a.maxPayout) / 2) * mult;
      const time = effectiveTime(a, profile.includeSetupTime);
      const ppm = avg / Math.max(time, 1);
      const reasons: string[] = [];
      if (mult > 1) reasons.push(`weekly boost ${mult}x active`);
      if (a.risk === profile.preferredRisk) reasons.push(`matches your ${a.risk} risk preference`);
      if (a.isPassive && !profile.preferActive) reasons.push("matches passive preference");
      if (a.setupMinutes === 0) reasons.push("no setup required");
      if (a.requirements.length === 0) reasons.push("no asset requirements");
      const rationale = reasons.length
        ? `Selected because it ${reasons.join(", ")}.`
        : `Strong payout-per-minute (${Math.round(ppm).toLocaleString()}/min) within your session.`;
      return { activity: a, avgPayout: avg, payoutPerMin: ppm, rationale, weeklyMult: mult };
    })
    .sort((a, b) => b.payoutPerMin - a.payoutPerMin);
}

export function buildRoute(
  profile: PlayerProfile,
  activities: Activity[],
  weekly: WeeklyModifier[],
): Recommendation {
  const ranked = rankActivities(profile, activities, weekly);
  const steps: RecommendationStep[] = [];
  let remaining = profile.sessionLength;
  const used = new Set<string>();
  for (const s of ranked) {
    const t = effectiveTime(s.activity, profile.includeSetupTime);
    if (t > remaining) continue;
    if (used.has(s.activity.id) && s.activity.cooldownMinutes > 0) continue;
    steps.push({
      activity: s.activity,
      estimatedMinutes: t,
      estimatedPayoutMin: Math.round(s.activity.minPayout * s.weeklyMult),
      estimatedPayoutMax: Math.round(s.activity.maxPayout * s.weeklyMult),
      rationale: s.rationale,
    });
    used.add(s.activity.id);
    remaining -= t;
    if (steps.length >= 5) break;
  }
  const conservativePayout = steps.reduce((s, x) => s + x.estimatedPayoutMin, 0);
  const optimisticPayout = steps.reduce((s, x) => s + x.estimatedPayoutMax, 0);
  const expectedPayout = Math.round((conservativePayout + optimisticPayout) / 2);
  const totalMinutes = profile.sessionLength - remaining;
  const remainingGoal = Math.max(profile.goal.targetAmount - profile.currentBalance, 0);
  const goalProgressAfter = Math.min(
    (profile.currentBalance + expectedPayout) / profile.goal.targetAmount,
    1,
  );
  const sessionsRemaining =
    expectedPayout > 0 ? Math.max(Math.ceil((remainingGoal - expectedPayout) / expectedPayout), 0) : 99;
  return {
    id: `rec-${Date.now()}`,
    steps,
    totalMinutes,
    conservativePayout,
    optimisticPayout,
    expectedPayout,
    goalProgressAfter,
    sessionsRemaining,
    generatedAt: new Date().toISOString(),
  };
}

export interface PurchaseScore {
  option: PurchaseOption;
  overall: number;
  reasons: string[];
  warnings: string[];
  affordableNow: boolean;
}

export function scorePurchases(
  profile: PlayerProfile,
  options: PurchaseOption[],
  weekly: WeeklyModifier[],
): PurchaseScore[] {
  return options
    .map(o => {
      const discount = weekly.find(w => w.type === "discount" && w.appliesToItemIds?.includes(o.id));
      const effectivePrice = discount?.discountPct
        ? Math.round(o.price * (1 - discount.discountPct / 100))
        : o.price;
      const soloWeight = profile.playStyle === "solo" ? 1.2 : 0.9;
      const crewWeight = profile.playStyle === "solo" ? 0.8 : 1.2;
      const overall = Math.round(
        o.incomePotential * 0.32 +
          o.utility * 0.18 +
          o.soloUsefulness * 0.12 * soloWeight +
          o.crewUsefulness * 0.12 * crewWeight +
          o.timeSaved * 0.12 +
          o.progressionValue * 0.14,
      );
      const reasons: string[] = [];
      if (o.unlocksActivityIds.length)
        reasons.push(`unlocks ${o.unlocksActivityIds.length} profitable activit${o.unlocksActivityIds.length === 1 ? "y" : "ies"}`);
      if (profile.playStyle === "solo" && o.soloUsefulness >= 80)
        reasons.push("strong solo utility");
      if (discount) reasons.push(`${discount.discountPct}% off this week`);
      if (o.incomePotential >= 80) reasons.push("high passive or active income potential");
      const warnings: string[] = [];
      if (effectivePrice > profile.goal.targetAmount * 0.6 && profile.goal.targetItemId !== o.id)
        warnings.push("Spending here may delay your primary goal.");
      if (effectivePrice > profile.currentBalance)
        warnings.push(`Short by $${(effectivePrice - profile.currentBalance).toLocaleString()}.`);
      return {
        option: { ...o, price: effectivePrice },
        overall,
        reasons,
        warnings,
        affordableNow: profile.currentBalance >= effectivePrice,
      };
    })
    .sort((a, b) => b.overall - a.overall);
}
