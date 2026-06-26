import type {
  Activity,
  InventoryItem,
  PurchaseOption,
  WeeklyModifier,
  SavedPlan,
  CommunitySubmission,
  AdminChangeLog,
  PlayerProfile,
} from "./types";

const today = new Date().toISOString().slice(0, 10);
const src = (name: string) => ({
  name,
  dateVerified: today,
  gameVersion: "Sample Build",
  confidence: "community" as const,
  verifiedBy: "ScorePath Sample Data",
});

export const MOCK_INVENTORY: InventoryItem[] = [
  { id: "prop-coastal-villa", name: "Coastal Villa", category: "property", description: "Beachfront residence with rooftop helipad.", estimatedValue: 1850000, unlocksActivityIds: ["act-private-contract"], tags: ["luxury", "solo"] },
  { id: "prop-downtown-loft", name: "Downtown Loft", category: "property", description: "Compact city base, fast respawn.", estimatedValue: 420000, unlocksActivityIds: [], tags: ["budget"] },
  { id: "biz-night-club", name: "Neon District Nightclub", category: "business", description: "Passive revenue venue with backroom storage.", estimatedValue: 1650000, unlocksActivityIds: ["act-club-revenue", "act-warehouse-shipment"], tags: ["passive", "high-income"] },
  { id: "biz-import-warehouse", name: "Import Warehouse", category: "business", description: "Stores high-end vehicle imports for resale.", estimatedValue: 980000, unlocksActivityIds: ["act-warehouse-shipment"], tags: ["active"] },
  { id: "biz-counterfeit", name: "Document Forgery Lab", category: "business", description: "Mid-tier passive operation.", estimatedValue: 650000, unlocksActivityIds: ["act-lab-sale"], tags: ["passive"] },
  { id: "veh-armored-suv", name: "Armored Touring SUV", category: "vehicle", description: "Bulletproof transport, crew capable.", estimatedValue: 295000, unlocksActivityIds: ["act-private-contract"], tags: ["combat"] },
  { id: "veh-sport-coupe", name: "Hypersport Coupe", category: "vehicle", description: "Top-tier street performance.", estimatedValue: 1450000, unlocksActivityIds: ["act-street-race"], tags: ["race"] },
  { id: "veh-cargo-truck", name: "Heavy Cargo Hauler", category: "vehicle", description: "Required for warehouse runs.", estimatedValue: 180000, unlocksActivityIds: ["act-warehouse-shipment"], tags: ["work"] },
  { id: "wpn-tactical-rifle", name: "Tactical Rifle", category: "weapon", description: "Balanced loadout for contracts.", estimatedValue: 45000, unlocksActivityIds: [], tags: ["combat"] },
  { id: "wpn-marksman", name: "Marksman Rifle", category: "weapon", description: "Long-range option for setups.", estimatedValue: 78000, unlocksActivityIds: [], tags: ["combat"] },
  { id: "eq-armor-mk2", name: "Heavy Armor Mk II", category: "equipment", description: "Reduces downtime in combat.", estimatedValue: 28000, unlocksActivityIds: [], tags: ["defense"] },
  { id: "eq-comms-drone", name: "Recon Comms Drone", category: "equipment", description: "Marks targets and reduces setup time.", estimatedValue: 96000, unlocksActivityIds: ["act-private-contract"], tags: ["utility"] },
];

export const MOCK_ACTIVITIES: Activity[] = [
  { id: "act-high-value-contract", name: "High-Value Contract", category: "Contract", description: "Multi-phase contract delivering a high-stakes target.", minPlayers: 1, maxPlayers: 4, setupMinutes: 8, completionMinutes: 35, minPayout: 220000, maxPayout: 290000, requirements: [], risk: "high", isPassive: false, cooldownMinutes: 90, available: true, weeklyMultiplier: 1.5, confidence: "community", lastVerified: today, tags: ["heist", "boost"] },
  { id: "act-private-contract", name: "Private Security Contract", category: "Contract", description: "Solo-friendly contract from your private command center.", minPlayers: 1, maxPlayers: 2, setupMinutes: 4, completionMinutes: 22, minPayout: 95000, maxPayout: 145000, requirements: [{ itemId: "prop-coastal-villa", reason: "Requires private command center." }], risk: "medium", isPassive: false, cooldownMinutes: 30, available: true, weeklyMultiplier: 1, confidence: "community", lastVerified: today, tags: ["solo"] },
  { id: "act-quick-security", name: "Quick Security Job", category: "Quick Job", description: "Short combat job with reliable payout.", minPlayers: 1, maxPlayers: 4, setupMinutes: 0, completionMinutes: 14, minPayout: 38000, maxPayout: 58000, requirements: [], risk: "low", isPassive: false, cooldownMinutes: 0, available: true, weeklyMultiplier: 1, confidence: "community", lastVerified: today, tags: ["solo", "no-setup"] },
  { id: "act-club-revenue", name: "Nightclub Revenue Pickup", category: "Passive", description: "Collect accumulated venue revenue.", minPlayers: 1, maxPlayers: 1, setupMinutes: 0, completionMinutes: 6, minPayout: 45000, maxPayout: 95000, requirements: [{ itemId: "biz-night-club", reason: "Requires owned nightclub." }], risk: "low", isPassive: true, cooldownMinutes: 240, available: true, weeklyMultiplier: 1.2, confidence: "community", lastVerified: today, tags: ["passive"] },
  { id: "act-warehouse-shipment", name: "Warehouse Shipment Sale", category: "Sale", description: "Deliver stockpiled imports to buyers.", minPlayers: 1, maxPlayers: 4, setupMinutes: 12, completionMinutes: 28, minPayout: 180000, maxPayout: 260000, requirements: [{ itemId: "biz-import-warehouse", reason: "Stock comes from warehouse." }, { itemId: "veh-cargo-truck", reason: "Hauler required." }], risk: "medium", isPassive: false, cooldownMinutes: 60, available: true, weeklyMultiplier: 1, confidence: "community", lastVerified: today, tags: ["sale"] },
  { id: "act-lab-sale", name: "Forgery Lab Sale", category: "Sale", description: "Mid-tier sale mission, low risk.", minPlayers: 1, maxPlayers: 2, setupMinutes: 5, completionMinutes: 18, minPayout: 70000, maxPayout: 110000, requirements: [{ itemId: "biz-counterfeit", reason: "Lab inventory required." }], risk: "low", isPassive: false, cooldownMinutes: 45, available: true, weeklyMultiplier: 1, confidence: "community", lastVerified: today, tags: ["sale"] },
  { id: "act-street-race", name: "Underground Street Race", category: "Race", description: "Competitive race circuit.", minPlayers: 2, maxPlayers: 8, setupMinutes: 2, completionMinutes: 12, minPayout: 22000, maxPayout: 65000, requirements: [{ itemId: "veh-sport-coupe", reason: "Class S vehicle required." }], risk: "low", isPassive: false, cooldownMinutes: 0, available: true, weeklyMultiplier: 2, confidence: "community", lastVerified: today, tags: ["crew", "boost"] },
  { id: "act-bonus-survival", name: "Bonus Survival Round", category: "Bonus", description: "Wave-based survival with weekly bonus.", minPlayers: 1, maxPlayers: 4, setupMinutes: 0, completionMinutes: 16, minPayout: 32000, maxPayout: 72000, requirements: [], risk: "medium", isPassive: false, cooldownMinutes: 60, available: true, weeklyMultiplier: 1.75, confidence: "community", lastVerified: today, tags: ["boost"] },
  { id: "act-cargo-air", name: "Air Cargo Run", category: "Sale", description: "Aerial cargo delivery across the map.", minPlayers: 1, maxPlayers: 4, setupMinutes: 6, completionMinutes: 22, minPayout: 85000, maxPayout: 140000, requirements: [], risk: "medium", isPassive: false, cooldownMinutes: 30, available: true, weeklyMultiplier: 1, confidence: "community", lastVerified: today, tags: [] },
  { id: "act-stash-run", name: "Stash House Clearout", category: "Quick Job", description: "Clear a stash house and grab the cash.", minPlayers: 1, maxPlayers: 2, setupMinutes: 0, completionMinutes: 9, minPayout: 18000, maxPayout: 32000, requirements: [], risk: "low", isPassive: false, cooldownMinutes: 0, available: true, weeklyMultiplier: 1, confidence: "community", lastVerified: today, tags: ["solo", "no-setup"] },
  { id: "act-vip-hit", name: "VIP Elimination", category: "Contract", description: "Tactical elimination, marksman recommended.", minPlayers: 1, maxPlayers: 2, setupMinutes: 4, completionMinutes: 15, minPayout: 62000, maxPayout: 98000, requirements: [{ itemId: "wpn-marksman", reason: "Long-range engagement." }], risk: "medium", isPassive: false, cooldownMinutes: 30, available: true, weeklyMultiplier: 1, confidence: "community", lastVerified: today, tags: [] },
  { id: "act-bonus-heist-finale", name: "Boosted Heist Finale", category: "Heist", description: "Multi-stage finale with current weekly boost.", minPlayers: 2, maxPlayers: 4, setupMinutes: 25, completionMinutes: 55, minPayout: 410000, maxPayout: 580000, requirements: [{ itemId: "prop-coastal-villa", reason: "Planning room required." }], risk: "high", isPassive: false, cooldownMinutes: 180, available: true, weeklyMultiplier: 1.5, confidence: "community", lastVerified: today, tags: ["crew", "boost"] },
];

export const MOCK_PURCHASES: PurchaseOption[] = [
  { id: "buy-coastal-villa", name: "Coastal Villa", category: "property", price: 1850000, description: "Premium operations property with planning room.", incomePotential: 78, utility: 90, soloUsefulness: 95, crewUsefulness: 80, timeSaved: 70, progressionValue: 95, unlocksActivityIds: ["act-private-contract", "act-bonus-heist-finale"] },
  { id: "buy-night-club", name: "Neon District Nightclub", category: "business", price: 1650000, description: "Passive nightly revenue and storage chain.", incomePotential: 92, utility: 80, soloUsefulness: 85, crewUsefulness: 70, timeSaved: 90, progressionValue: 88, unlocksActivityIds: ["act-club-revenue", "act-warehouse-shipment"] },
  { id: "buy-import-warehouse", name: "Import Warehouse", category: "business", price: 980000, description: "Active high-margin sales loop.", incomePotential: 80, utility: 70, soloUsefulness: 60, crewUsefulness: 88, timeSaved: 40, progressionValue: 70, unlocksActivityIds: ["act-warehouse-shipment"] },
  { id: "buy-sport-coupe", name: "Hypersport Coupe", category: "vehicle", price: 1450000, description: "Required to enter Class S race rotation.", incomePotential: 35, utility: 75, soloUsefulness: 80, crewUsefulness: 60, timeSaved: 65, progressionValue: 55, unlocksActivityIds: ["act-street-race"] },
  { id: "buy-armored-suv", name: "Armored Touring SUV", category: "vehicle", price: 295000, description: "Survivability boost for contracts.", incomePotential: 20, utility: 88, soloUsefulness: 85, crewUsefulness: 90, timeSaved: 55, progressionValue: 60, unlocksActivityIds: [] },
  { id: "buy-comms-drone", name: "Recon Comms Drone", category: "equipment", price: 96000, description: "Trims setup time on several missions.", incomePotential: 30, utility: 92, soloUsefulness: 95, crewUsefulness: 78, timeSaved: 88, progressionValue: 50, unlocksActivityIds: ["act-private-contract"] },
  { id: "buy-armor-mk2", name: "Heavy Armor Mk II", category: "equipment", price: 28000, description: "Lower-tier survivability upgrade.", incomePotential: 10, utility: 70, soloUsefulness: 75, crewUsefulness: 70, timeSaved: 25, progressionValue: 30, unlocksActivityIds: [] },
  { id: "buy-marksman", name: "Marksman Rifle", category: "weapon", price: 78000, description: "Unlocks long-range contract style.", incomePotential: 35, utility: 70, soloUsefulness: 85, crewUsefulness: 65, timeSaved: 40, progressionValue: 50, unlocksActivityIds: ["act-vip-hit"] },
];

const inDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString();

export const MOCK_WEEKLY: WeeklyModifier[] = [
  { id: "wk-bonus-contract", title: "High-Value Contracts 1.5x", description: "All High-Value Contracts pay 50% more.", type: "bonus", multiplier: 1.5, appliesToActivityIds: ["act-high-value-contract", "act-bonus-heist-finale"], expiresAt: inDays(4) },
  { id: "wk-bonus-race", title: "Underground Races 2x", description: "Race payouts doubled this week.", type: "bonus", multiplier: 2, appliesToActivityIds: ["act-street-race"], expiresAt: inDays(4) },
  { id: "wk-bonus-survival", title: "Bonus Survival 1.75x", description: "Survival rounds boosted.", type: "bonus", multiplier: 1.75, appliesToActivityIds: ["act-bonus-survival"], expiresAt: inDays(2) },
  { id: "wk-discount-suv", title: "Armored SUV 25% off", description: "Discount on the Armored Touring SUV.", type: "discount", discountPct: 25, appliesToItemIds: ["buy-armored-suv"], expiresAt: inDays(4) },
  { id: "wk-event-club", title: "Nightclub Revenue +20%", description: "Venues earn an extra 20% this week.", type: "event", multiplier: 1.2, appliesToActivityIds: ["act-club-revenue"], expiresAt: inDays(6) },
];

export const DEFAULT_PROFILE: PlayerProfile = {
  playStyle: "solo",
  currentBalance: 840000,
  sessionLength: 90,
  goal: {
    id: "goal-1",
    type: "buy-property",
    label: "Premium Operations Property",
    targetAmount: 2500000,
    targetItemId: "buy-coastal-villa",
    createdAt: new Date().toISOString(),
  },
  preferredRisk: "medium",
  preferActive: true,
  inventory: {
    ownedItemIds: ["prop-downtown-loft", "biz-counterfeit", "veh-cargo-truck", "wpn-tactical-rifle", "eq-armor-mk2"],
    favoriteItemIds: ["biz-counterfeit"],
    customItems: [],
  },
  dislikedActivityIds: [],
  minPayout: 0,
  includeSetupTime: true,
};

export const MOCK_SAVED_PLANS: SavedPlan[] = [
  {
    id: "plan-1",
    name: "Fast Coastal Villa Route",
    createdAt: inDays(-3),
    goal: DEFAULT_PROFILE.goal,
    completed: false,
    recommendation: {
      id: "rec-saved-1",
      steps: [],
      totalMinutes: 90,
      conservativePayout: 540000,
      optimisticPayout: 720000,
      expectedPayout: 630000,
      goalProgressAfter: 0.58,
      sessionsRemaining: 3,
      generatedAt: inDays(-3),
    },
  },
  {
    id: "plan-2",
    name: "Passive Income Maximizer",
    createdAt: inDays(-7),
    goal: { ...DEFAULT_PROFILE.goal, label: "Build Passive Income", type: "earn-money", targetAmount: 1000000 },
    completed: true,
    recommendation: {
      id: "rec-saved-2",
      steps: [],
      totalMinutes: 60,
      conservativePayout: 220000,
      optimisticPayout: 310000,
      expectedPayout: 265000,
      goalProgressAfter: 1,
      sessionsRemaining: 0,
      generatedAt: inDays(-7),
    },
  },
  {
    id: "plan-3",
    name: "Crew Heist Sprint",
    createdAt: inDays(-1),
    goal: { ...DEFAULT_PROFILE.goal, label: "Heist Prep Loadout", type: "prepare-heist", targetAmount: 600000 },
    completed: false,
    recommendation: {
      id: "rec-saved-3",
      steps: [],
      totalMinutes: 120,
      conservativePayout: 480000,
      optimisticPayout: 640000,
      expectedPayout: 560000,
      goalProgressAfter: 0.93,
      sessionsRemaining: 1,
      generatedAt: inDays(-1),
    },
  },
];

export const MOCK_RECENT_ACTIVITY = [
  { id: "ra1", at: inDays(-1), label: "Completed High-Value Contract", amount: 245000 },
  { id: "ra2", at: inDays(-1), label: "Collected Nightclub Revenue", amount: 68000 },
  { id: "ra3", at: inDays(-2), label: "Sold Forgery Lab inventory", amount: 92000 },
  { id: "ra4", at: inDays(-3), label: "Completed Quick Security Job", amount: 48000 },
  { id: "ra5", at: inDays(-4), label: "Won Underground Street Race", amount: 55000 },
  { id: "ra6", at: inDays(-5), label: "Sold Warehouse Shipment", amount: 215000 },
];

export const MOCK_SUBMISSIONS: CommunitySubmission[] = [
  { id: "sub-1", submittedBy: "player_neon", submittedAt: inDays(-1), type: "activity", payload: { name: "Rooftop Heist Variant", payout: "180-240k" }, status: "pending" },
  { id: "sub-2", submittedBy: "crewleader42", submittedAt: inDays(-2), type: "vehicle", payload: { name: "Stealth Coupe", price: 985000 }, status: "approved" },
  { id: "sub-3", submittedBy: "soloOps", submittedAt: inDays(-3), type: "modifier", payload: { title: "Drone Recon 2x" }, status: "rejected", reviewerNotes: "Could not verify." },
];

export const MOCK_CHANGES: AdminChangeLog[] = [
  { id: "c1", at: inDays(-1), by: "admin@scorepath", action: "updated", entityType: "activity", entityId: "act-high-value-contract", notes: "Weekly multiplier 1.5" },
  { id: "c2", at: inDays(-2), by: "admin@scorepath", action: "created", entityType: "weekly-modifier", entityId: "wk-bonus-race" },
  { id: "c3", at: inDays(-3), by: "moderator@scorepath", action: "approved", entityType: "submission", entityId: "sub-2" },
];

// Apply src() to a few records to demonstrate sourcing (kept simple to avoid noise)
MOCK_ACTIVITIES.forEach(a => { (a as Activity & { source?: ReturnType<typeof src> }).source = src("ScorePath community calibration"); });
