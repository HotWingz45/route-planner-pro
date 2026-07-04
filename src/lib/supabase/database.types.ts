// Hand-authored types matching supabase/schema.sql.
// Once the Supabase CLI is set up, replace this file by running:
//   supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts
// Keeping it hand-written for now keeps the project buildable without the CLI.

export type SubscriptionTier = "free" | "founding_pro" | "launch_pass";
export type PlayStyleDb = "solo" | "small-crew" | "large-crew" | "mixed";
export type SessionLengthDb = 30 | 60 | 90 | 120 | 180;
export type RiskLevelDb = "low" | "medium" | "high";
export type ConfidenceDb =
  | "unverified"
  | "community"
  | "video-confirmed"
  | "independently-verified"
  | "officially-confirmed";
export type ItemCategoryDb =
  "property" | "business" | "vehicle" | "weapon" | "equipment" | "upgrade";
export type GoalTypeDb =
  | "earn-money"
  | "buy-property"
  | "buy-vehicle"
  | "upgrade-equipment"
  | "complete-progression"
  | "prepare-heist";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string;
          subscription_tier: SubscriptionTier;
          founding_pro_slot_number: number | null;
          subscription_started_at: string | null;
          subscription_renews_at: string | null;
          subscription_price_cents: number | null;
          launch_pass_expires_at: string | null;
          is_admin: boolean;
          is_moderator: boolean;
          ai_conversations_used_this_week: number;
          ai_conversations_reset_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      player_state: {
        Row: {
          user_id: string;
          play_style: PlayStyleDb;
          current_balance: number;
          session_length: SessionLengthDb;
          preferred_risk: RiskLevelDb;
          prefer_active: boolean;
          disliked_activity_ids: string[];
          min_payout: number;
          include_setup_time: boolean;
          active_goal_id: string | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["player_state"]["Row"]> & { user_id: string };
        Update: Partial<Database["public"]["Tables"]["player_state"]["Row"]>;
        Relationships: [];
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          type: GoalTypeDb;
          label: string;
          target_amount: number;
          target_item_id: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["goals"]["Row"]> & {
          user_id: string;
          type: GoalTypeDb;
          label: string;
          target_amount: number;
        };
        Update: Partial<Database["public"]["Tables"]["goals"]["Row"]>;
        Relationships: [];
      };
      inventory_items: {
        Row: {
          id: string;
          name: string;
          category: ItemCategoryDb;
          description: string;
          estimated_value: number;
          unlocks_activity_ids: string[];
          tags: string[];
          source_name: string | null;
          source_url: string | null;
          source_date_verified: string | null;
          source_game_version: string | null;
          source_confidence: ConfidenceDb | null;
          source_verified_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["inventory_items"]["Row"]> & {
          id: string;
          name: string;
          category: ItemCategoryDb;
        };
        Update: Partial<Database["public"]["Tables"]["inventory_items"]["Row"]>;
        Relationships: [];
      };
      activities: {
        Row: {
          id: string;
          name: string;
          category: string;
          description: string;
          min_players: number;
          max_players: number;
          setup_minutes: number;
          completion_minutes: number;
          min_payout: number;
          max_payout: number;
          requirements: { itemId: string; reason: string }[];
          risk: RiskLevelDb;
          is_passive: boolean;
          cooldown_minutes: number;
          available: boolean;
          weekly_multiplier: number;
          confidence: ConfidenceDb;
          last_verified: string;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["activities"]["Row"]> & {
          id: string;
          name: string;
          category: string;
        };
        Update: Partial<Database["public"]["Tables"]["activities"]["Row"]>;
        Relationships: [];
      };
      purchase_options: {
        Row: {
          id: string;
          name: string;
          category: ItemCategoryDb;
          price: number;
          description: string;
          income_potential: number;
          utility: number;
          solo_usefulness: number;
          crew_usefulness: number;
          time_saved: number;
          progression_value: number;
          unlocks_activity_ids: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["purchase_options"]["Row"]> & {
          id: string;
          name: string;
          category: ItemCategoryDb;
          price: number;
        };
        Update: Partial<Database["public"]["Tables"]["purchase_options"]["Row"]>;
        Relationships: [];
      };
      weekly_modifiers: {
        Row: {
          id: string;
          title: string;
          description: string;
          type: "bonus" | "discount" | "event";
          multiplier: number | null;
          discount_pct: number | null;
          applies_to_activity_ids: string[] | null;
          applies_to_item_ids: string[] | null;
          expires_at: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["weekly_modifiers"]["Row"]> & {
          id: string;
          title: string;
          type: "bonus" | "discount" | "event";
          expires_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["weekly_modifiers"]["Row"]>;
        Relationships: [];
      };
      player_inventory: {
        Row: { user_id: string; item_id: string; favorite: boolean; acquired_at: string };
        Insert: { user_id: string; item_id: string; favorite?: boolean };
        Update: Partial<Database["public"]["Tables"]["player_inventory"]["Row"]>;
        Relationships: [];
      };
      custom_inventory_items: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          category: ItemCategoryDb;
          description: string;
          estimated_value: number;
          tags: string[];
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["custom_inventory_items"]["Row"]> & {
          user_id: string;
          name: string;
          category: ItemCategoryDb;
        };
        Update: Partial<Database["public"]["Tables"]["custom_inventory_items"]["Row"]>;
        Relationships: [];
      };
      saved_plans: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          goal: Record<string, unknown>;
          recommendation: Record<string, unknown>;
          completed: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["saved_plans"]["Row"]> & {
          user_id: string;
          name: string;
          goal: Record<string, unknown>;
          recommendation: Record<string, unknown>;
        };
        Update: Partial<Database["public"]["Tables"]["saved_plans"]["Row"]>;
        Relationships: [];
      };
      chat_conversations: {
        Row: { id: string; user_id: string; title: string; created_at: string; updated_at: string };
        Insert: Partial<Database["public"]["Tables"]["chat_conversations"]["Row"]> & {
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["chat_conversations"]["Row"]>;
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          role: "user" | "assistant";
          content: string;
          recommendation: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["chat_messages"]["Row"]> & {
          conversation_id: string;
          user_id: string;
          role: "user" | "assistant";
          content: string;
        };
        Update: Partial<Database["public"]["Tables"]["chat_messages"]["Row"]>;
        Relationships: [];
      };
      community_submissions: {
        Row: {
          id: string;
          submitted_by: string;
          type: "activity" | "vehicle" | "property" | "business" | "weapon" | "modifier";
          payload: Record<string, unknown>;
          status: "pending" | "approved" | "rejected";
          reviewer_id: string | null;
          reviewer_notes: string | null;
          created_at: string;
          reviewed_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["community_submissions"]["Row"]> & {
          submitted_by: string;
          type: "activity" | "vehicle" | "property" | "business" | "weapon" | "modifier";
          payload: Record<string, unknown>;
        };
        Update: Partial<Database["public"]["Tables"]["community_submissions"]["Row"]>;
        Relationships: [];
      };
      admin_change_log: {
        Row: {
          id: string;
          actor_id: string;
          action: string;
          entity_type: string;
          entity_id: string;
          notes: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["admin_change_log"]["Row"]> & {
          actor_id: string;
          action: string;
          entity_type: string;
          entity_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["admin_change_log"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
