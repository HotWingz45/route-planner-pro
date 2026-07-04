// Converts Supabase rows (snake_case) into the app's domain types (camelCase,
// defined in src/lib/types.ts). Keeping this in one file means engine.ts and
// every route stay database-agnostic — they only ever see the app types.

import type { Database } from "./database.types";
import type {
  Activity,
  InventoryItem,
  PurchaseOption,
  WeeklyModifier,
  PlayerProfile,
  Goal,
  SavedPlan,
} from "../types";

type ActivityRow = Database["public"]["Tables"]["activities"]["Row"];
type InventoryRow = Database["public"]["Tables"]["inventory_items"]["Row"];
type PurchaseRow = Database["public"]["Tables"]["purchase_options"]["Row"];
type WeeklyRow = Database["public"]["Tables"]["weekly_modifiers"]["Row"];
type PlayerStateRow = Database["public"]["Tables"]["player_state"]["Row"];
type GoalRow = Database["public"]["Tables"]["goals"]["Row"];
type SavedPlanRow = Database["public"]["Tables"]["saved_plans"]["Row"];

export function mapActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    minPlayers: row.min_players,
    maxPlayers: row.max_players,
    setupMinutes: row.setup_minutes,
    completionMinutes: row.completion_minutes,
    minPayout: row.min_payout,
    maxPayout: row.max_payout,
    requirements: row.requirements ?? [],
    risk: row.risk,
    isPassive: row.is_passive,
    cooldownMinutes: row.cooldown_minutes,
    available: row.available,
    weeklyMultiplier: Number(row.weekly_multiplier),
    confidence: row.confidence,
    lastVerified: row.last_verified,
    tags: row.tags ?? [],
    metadata: row.metadata ?? {},
    unlockCondition: row.unlock_condition ?? undefined,
  };
}

export function mapInventoryItem(row: InventoryRow): InventoryItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    estimatedValue: row.estimated_value,
    unlocksActivityIds: row.unlocks_activity_ids ?? [],
    tags: row.tags ?? [],
    source: row.source_name
      ? {
          name: row.source_name,
          url: row.source_url ?? undefined,
          dateVerified: row.source_date_verified ?? "",
          gameVersion: row.source_game_version ?? "",
          confidence: row.source_confidence ?? "community",
          verifiedBy: row.source_verified_by ?? "",
        }
      : undefined,
  };
}

export function mapPurchaseOption(row: PurchaseRow): PurchaseOption {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: row.price,
    description: row.description,
    incomePotential: row.income_potential,
    utility: row.utility,
    soloUsefulness: row.solo_usefulness,
    crewUsefulness: row.crew_usefulness,
    timeSaved: row.time_saved,
    progressionValue: row.progression_value,
    unlocksActivityIds: row.unlocks_activity_ids ?? [],
  };
}

export function mapWeeklyModifier(row: WeeklyRow): WeeklyModifier {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    multiplier: row.multiplier ?? undefined,
    discountPct: row.discount_pct ?? undefined,
    appliesToActivityIds: row.applies_to_activity_ids ?? undefined,
    appliesToItemIds: row.applies_to_item_ids ?? undefined,
    expiresAt: row.expires_at,
  };
}

export function mapGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    type: row.type,
    label: row.label,
    targetAmount: row.target_amount,
    targetItemId: row.target_item_id ?? undefined,
    createdAt: row.created_at,
  };
}

export function mapSavedPlan(row: SavedPlanRow): SavedPlan {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    // stored as jsonb — trusted shape because we only ever write it via engine.ts output
    recommendation: row.recommendation as unknown as SavedPlan["recommendation"],
    goal: row.goal as unknown as SavedPlan["goal"],
    completed: row.completed,
  };
}

/** Builds a full PlayerProfile from the separate player_state + goal + inventory rows. */
export function buildPlayerProfile(
  state: PlayerStateRow,
  goal: GoalRow | null,
  ownedItemIds: string[],
  favoriteItemIds: string[],
  customItems: InventoryItem[],
  fallbackGoal: Goal,
): PlayerProfile {
  return {
    playStyle: state.play_style,
    currentBalance: state.current_balance,
    sessionLength: state.session_length,
    goal: goal ? mapGoal(goal) : fallbackGoal,
    preferredRisk: state.preferred_risk,
    preferActive: state.prefer_active,
    inventory: { ownedItemIds, favoriteItemIds, customItems },
    dislikedActivityIds: state.disliked_activity_ids ?? [],
    minPayout: state.min_payout,
    includeSetupTime: state.include_setup_time,
  };
}
