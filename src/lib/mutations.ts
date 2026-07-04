import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase/client";
import { useUser } from "./auth";
import { isSupabaseConfigured } from "./queries";
import type { Database } from "./supabase/database.types";
import type { Goal, PlayerProfile, Recommendation } from "./types";

type PlayerStateUpdate = Database["public"]["Tables"]["player_state"]["Update"];

/** Persists the mutable session fields of PlayerProfile (not goal/inventory — those have their own tables). */
export function useUpdatePlayerState() {
  const user = useUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<PlayerProfile>) => {
      if (!user || !isSupabaseConfigured) return; // demo mode: caller's local state is the source of truth
      const dbPatch: PlayerStateUpdate = {};
      if (patch.playStyle !== undefined) dbPatch.play_style = patch.playStyle;
      if (patch.currentBalance !== undefined) dbPatch.current_balance = patch.currentBalance;
      if (patch.sessionLength !== undefined) dbPatch.session_length = patch.sessionLength;
      if (patch.preferredRisk !== undefined) dbPatch.preferred_risk = patch.preferredRisk;
      if (patch.preferActive !== undefined) dbPatch.prefer_active = patch.preferActive;
      if (patch.dislikedActivityIds !== undefined)
        dbPatch.disliked_activity_ids = patch.dislikedActivityIds;
      if (patch.minPayout !== undefined) dbPatch.min_payout = patch.minPayout;
      if (patch.includeSetupTime !== undefined) dbPatch.include_setup_time = patch.includeSetupTime;
      if (Object.keys(dbPatch).length === 0) return;
      const { error } = await supabase.from("player_state").update(dbPatch).eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["player-profile"] }),
  });
}

export function useUpsertGoal() {
  const user = useUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (goal: Omit<Goal, "id" | "createdAt"> & { id?: string }) => {
      if (!user || !isSupabaseConfigured) return null;
      // Deactivate previous active goal, then insert the new one as active.
      await supabase
        .from("goals")
        .update({ is_active: false })
        .eq("user_id", user.id)
        .eq("is_active", true);
      const { data, error } = await supabase
        .from("goals")
        .insert({
          user_id: user.id,
          type: goal.type,
          label: goal.label,
          target_amount: goal.targetAmount,
          target_item_id: goal.targetItemId ?? null,
          is_active: true,
        })
        .select()
        .single();
      if (error) throw error;
      await supabase
        .from("player_state")
        .update({ active_goal_id: data.id })
        .eq("user_id", user.id);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["player-profile"] });
      qc.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}

export function useToggleOwnedItem() {
  const user = useUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, owned }: { itemId: string; owned: boolean }) => {
      if (!user || !isSupabaseConfigured) return;
      if (owned) {
        const { error } = await supabase
          .from("player_inventory")
          .delete()
          .eq("user_id", user.id)
          .eq("item_id", itemId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("player_inventory")
          .upsert({ user_id: user.id, item_id: itemId });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["player-profile"] }),
  });
}

export function useToggleFavoriteItem() {
  const user = useUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, favorite }: { itemId: string; favorite: boolean }) => {
      if (!user || !isSupabaseConfigured) return;
      const { error } = await supabase
        .from("player_inventory")
        .upsert({ user_id: user.id, item_id: itemId, favorite });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["player-profile"] }),
  });
}

export function useSaveRoutePlan() {
  const user = useUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      goal,
      recommendation,
    }: {
      name: string;
      goal: Goal;
      recommendation: Recommendation;
    }) => {
      if (!user || !isSupabaseConfigured) return null;
      const { data, error } = await supabase
        .from("saved_plans")
        .insert({
          user_id: user.id,
          name,
          goal: goal as unknown as Record<string, unknown>,
          recommendation: recommendation as unknown as Record<string, unknown>,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-plans"] }),
  });
}

export function useMarkPlanComplete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (planId: string) => {
      if (!isSupabaseConfigured) return;
      const { error } = await supabase
        .from("saved_plans")
        .update({ completed: true })
        .eq("id", planId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-plans"] }),
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (planId: string) => {
      if (!isSupabaseConfigured) return;
      const { error } = await supabase.from("saved_plans").delete().eq("id", planId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-plans"] }),
  });
}
