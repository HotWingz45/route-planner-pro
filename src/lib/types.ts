// ScorePath domain types
export type PlayStyle = "solo" | "small-crew" | "large-crew" | "mixed";
export type SessionLength = 30 | 60 | 90 | 120 | 180;
export type RiskLevel = "low" | "medium" | "high";
export type ConfidenceLevel =
  | "unverified"
  | "community"
  | "video-confirmed"
  | "independently-verified"
  | "officially-confirmed";
export type ItemCategory =
  | "property"
  | "business"
  | "vehicle"
  | "weapon"
  | "equipment"
  | "upgrade";
export type GoalType =
  | "earn-money"
  | "buy-property"
  | "buy-vehicle"
  | "upgrade-equipment"
  | "complete-progression"
  | "prepare-heist";

export interface User {
  id: string;
  email: string;
  displayName: string;
  isDemo: boolean;
  subscription: SubscriptionTier;
  createdAt: string;
}

export type SubscriptionTier = "free" | "pro-monthly" | "pro-annual" | "founding";

export interface DataSource {
  name: string;
  url?: string;
  dateVerified: string;
  gameVersion: string;
  confidence: ConfidenceLevel;
  verifiedBy: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: ItemCategory;
  description: string;
  estimatedValue: number;
  unlocksActivityIds: string[];
  tags: string[];
  source?: DataSource;
}

export interface PlayerInventory {
  ownedItemIds: string[];
  favoriteItemIds: string[];
  customItems: InventoryItem[];
}

export interface Goal {
  id: string;
  type: GoalType;
  label: string;
  targetAmount: number;
  targetItemId?: string;
  createdAt: string;
}

export interface ActivityRequirement {
  itemId: string;
  reason: string;
}

export interface Activity {
  id: string;
  name: string;
  category: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  setupMinutes: number;
  completionMinutes: number;
  minPayout: number;
  maxPayout: number;
  requirements: ActivityRequirement[];
  risk: RiskLevel;
  isPassive: boolean;
  cooldownMinutes: number;
  available: boolean;
  weeklyMultiplier: number;
  confidence: ConfidenceLevel;
  lastVerified: string;
  tags: string[];
}

export interface WeeklyModifier {
  id: string;
  title: string;
  description: string;
  type: "bonus" | "discount" | "event";
  multiplier?: number;
  discountPct?: number;
  appliesToActivityIds?: string[];
  appliesToItemIds?: string[];
  expiresAt: string;
}

export interface PlayerProfile {
  playStyle: PlayStyle;
  currentBalance: number;
  sessionLength: SessionLength;
  goal: Goal;
  preferredRisk: RiskLevel;
  preferActive: boolean;
  inventory: PlayerInventory;
  dislikedActivityIds: string[];
  minPayout: number;
  includeSetupTime: boolean;
}

export interface RecommendationStep {
  activity: Activity;
  estimatedMinutes: number;
  estimatedPayoutMin: number;
  estimatedPayoutMax: number;
  rationale: string;
}

export interface Recommendation {
  id: string;
  steps: RecommendationStep[];
  totalMinutes: number;
  conservativePayout: number;
  optimisticPayout: number;
  expectedPayout: number;
  goalProgressAfter: number;
  sessionsRemaining: number;
  generatedAt: string;
}

export interface PurchaseOption {
  id: string;
  name: string;
  category: ItemCategory;
  price: number;
  description: string;
  incomePotential: number; // 0-100
  utility: number;
  soloUsefulness: number;
  crewUsefulness: number;
  timeSaved: number;
  progressionValue: number;
  unlocksActivityIds: string[];
  source?: DataSource;
}

export interface SavedPlan {
  id: string;
  name: string;
  createdAt: string;
  recommendation: Recommendation;
  goal: Goal;
  completed: boolean;
}

export interface CommunitySubmission {
  id: string;
  submittedBy: string;
  submittedAt: string;
  type: "activity" | "vehicle" | "property" | "business" | "weapon" | "modifier";
  payload: Record<string, unknown>;
  status: "pending" | "approved" | "rejected";
  reviewerNotes?: string;
}

export interface AdminChangeLog {
  id: string;
  at: string;
  by: string;
  action: string;
  entityType: string;
  entityId: string;
  notes?: string;
}
