import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase/client";
import {
  mapActivity,
  mapInventoryItem,
  mapPurchaseOption,
  mapWeeklyModifier,
  mapGoal,
  mapSavedPlan,
  buildPlayerProfile,
} from "./supabase/mappers";
import {
  MOCK_ACTIVITIES,
  MOCK_INVENTORY,
  MOCK_PURCHASES,
  MOCK_WEEKLY,
  MOCK_SAVED_PLANS,
  DEFAULT_PROFILE,
} from "./mock-data";
import type { PlayerProfile, SavedPlan } from "./types";
import { useUser } from "./auth";

const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
);

// ----------------------------------------------------------------------------
// CATALOG (public, no auth required) — falls back to mock-data.ts so the app
// still renders in a Lovable preview or local dev before Supabase env vars
// are configured. Once real data exists in Supabase, these hooks return it
// automatically — no route file needs to change.
// ----------------------------------------------------------------------------

export function useActivities() {
  return useQuery({
    queryKey: ["activities"],
    queryFn: async () => {
      if (!isSupabaseConfigured) return MOCK_ACTIVITIES;
      const { data, error } = await supabase.from("activities").select("*").eq("available", true);
      if (error) throw error;
      return data.length ? data.map(mapActivity) : MOCK_ACTIVITIES;
    },
    staleTime: 60_000,
  });
}

export function useInventoryCatalog() {
  return useQuery({
    queryKey: ["inventory-catalog"],
    queryFn: async () => {
      if (!isSupabaseConfigured) return MOCK_INVENTORY;
      const { data, error } = await supabase.from("inventory_items").select("*");
      if (error) throw error;
      return data.length ? data.map(mapInventoryItem) : MOCK_INVENTORY;
    },
    staleTime: 60_000,
  });
}

export function usePurchaseOptions() {
  return useQuery({
    queryKey: ["purchase-options"],
    queryFn: async () => {
      if (!isSupabaseConfigured) return MOCK_PURCHASES;
      const { data, error } = await supabase.from("purchase_options").select("*");
      if (error) throw error;
      return data.length ? data.map(mapPurchaseOption) : MOCK_PURCHASES;
    },
    staleTime: 60_000,
  });
}

export function useWeeklyModifiers() {
  return useQuery({
    queryKey: ["weekly-modifiers"],
    queryFn: async () => {
      if (!isSupabaseConfigured) return MOCK_WEEKLY;
      const { data, error } = await supabase
        .from("weekly_modifiers")
        .select("*")
        .gt("expires_at", new Date().toISOString());
      if (error) throw error;
      return data.length ? data.map(mapWeeklyModifier) : MOCK_WEEKLY;
    },
    staleTime: 60_000,
  });
}

// ----------------------------------------------------------------------------
// USER-SCOPED DATA (requires auth) — falls back to DEFAULT_PROFILE / demo
// data for logged-out / demo-mode visitors so the planner is still usable
// pre-signup, matching the "see your route before you create an account"
// conversion flow from the monetization plan.
// ----------------------------------------------------------------------------

export function usePlayerProfile() {
  const user = useUser();
  return useQuery({
    queryKey: ["player-profile", user?.id ?? "anon"],
    queryFn: async (): Promise<PlayerProfile> => {
      if (!user || !isSupabaseConfigured) return DEFAULT_PROFILE;

      const [stateRes, goalRes, invRes, customRes] = await Promise.all([
        supabase.from("player_state").select("*").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("goals")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .maybeSingle(),
        supabase.from("player_inventory").select("item_id, favorite").eq("user_id", user.id),
        supabase.from("custom_inventory_items").select("*").eq("user_id", user.id),
      ]);
      if (stateRes.error) throw stateRes.error;
      if (!stateRes.data) return DEFAULT_PROFILE;

      const ownedItemIds = (invRes.data ?? []).map((r) => r.item_id);
      const favoriteItemIds = (invRes.data ?? []).filter((r) => r.favorite).map((r) => r.item_id);
      const customItems = (customRes.data ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        category: c.category,
        description: c.description,
        estimatedValue: c.estimated_value,
        unlocksActivityIds: [],
        tags: c.tags ?? [],
      }));

      return buildPlayerProfile(
        stateRes.data,
        goalRes.data ?? null,
        ownedItemIds,
        favoriteItemIds,
        customItems,
        DEFAULT_PROFILE.goal,
      );
    },
    enabled: true,
    staleTime: 10_000,
  });
}

export function useSavedPlans() {
  const user = useUser();
  return useQuery({
    queryKey: ["saved-plans", user?.id ?? "anon"],
    queryFn: async (): Promise<SavedPlan[]> => {
      if (!user || !isSupabaseConfigured) return MOCK_SAVED_PLANS;
      const { data, error } = await supabase
        .from("saved_plans")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data.map(mapSavedPlan);
    },
    staleTime: 10_000,
  });
}

export function useGoals() {
  const user = useUser();
  return useQuery({
    queryKey: ["goals", user?.id ?? "anon"],
    queryFn: async () => {
      if (!user || !isSupabaseConfigured) return [DEFAULT_PROFILE.goal];
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data.map(mapGoal);
    },
    staleTime: 10_000,
  });
}

export { isSupabaseConfigured };
