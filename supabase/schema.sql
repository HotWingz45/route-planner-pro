-- ============================================================================
-- ScorePath Database Schema
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New Query)
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE throughout.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- EXTENSIONS
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ----------------------------------------------------------------------------
-- PROFILES
-- One row per auth.users row. Created automatically on signup via trigger.
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null default 'Operator',
  subscription_tier text not null default 'free'
    check (subscription_tier in ('free', 'pro-monthly', 'pro-annual', 'founding')),
  is_admin boolean not null default false,
  is_moderator boolean not null default false,
  ai_conversations_used_this_week integer not null default 0,
  ai_conversations_reset_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id and is_admin = (select is_admin from public.profiles where id = auth.uid()));
  -- prevents a user from granting themselves admin via a client-side update

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  insert into public.player_state (user_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- PLAYER STATE
-- The live PlayerProfile (session config) — 1:1 with profiles.
-- ----------------------------------------------------------------------------
create table if not exists public.player_state (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  play_style text not null default 'solo'
    check (play_style in ('solo', 'small-crew', 'large-crew', 'mixed')),
  current_balance bigint not null default 0,
  session_length integer not null default 90
    check (session_length in (30, 60, 90, 120, 180)),
  preferred_risk text not null default 'medium'
    check (preferred_risk in ('low', 'medium', 'high')),
  prefer_active boolean not null default true,
  disliked_activity_ids text[] not null default '{}',
  min_payout bigint not null default 0,
  include_setup_time boolean not null default true,
  active_goal_id uuid,
  updated_at timestamptz not null default now()
);

alter table public.player_state enable row level security;

drop policy if exists "player_state_owner_all" on public.player_state;
create policy "player_state_owner_all" on public.player_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- GOALS
-- ----------------------------------------------------------------------------
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null
    check (type in ('earn-money', 'buy-property', 'buy-vehicle', 'upgrade-equipment', 'complete-progression', 'prepare-heist')),
  label text not null,
  target_amount bigint not null,
  target_item_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.goals enable row level security;

drop policy if exists "goals_owner_all" on public.goals;
create policy "goals_owner_all" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.player_state
  add constraint player_state_active_goal_fk
  foreign key (active_goal_id) references public.goals (id) on delete set null;

-- ----------------------------------------------------------------------------
-- CATALOG TABLES (shared, admin/moderator-writable, everyone-readable)
-- ----------------------------------------------------------------------------

create table if not exists public.inventory_items (
  id text primary key,
  name text not null,
  category text not null check (category in ('property', 'business', 'vehicle', 'weapon', 'equipment', 'upgrade')),
  description text not null default '',
  estimated_value bigint not null default 0,
  unlocks_activity_ids text[] not null default '{}',
  tags text[] not null default '{}',
  source_name text,
  source_url text,
  source_date_verified date,
  source_game_version text,
  source_confidence text default 'community'
    check (source_confidence in ('unverified','community','video-confirmed','independently-verified','officially-confirmed')),
  source_verified_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activities (
  id text primary key,
  name text not null,
  category text not null,
  description text not null default '',
  min_players integer not null default 1,
  max_players integer not null default 1,
  setup_minutes integer not null default 0,
  completion_minutes integer not null default 0,
  min_payout bigint not null default 0,
  max_payout bigint not null default 0,
  requirements jsonb not null default '[]', -- [{itemId, reason}]
  risk text not null default 'low' check (risk in ('low','medium','high')),
  is_passive boolean not null default false,
  cooldown_minutes integer not null default 0,
  available boolean not null default true,
  weekly_multiplier numeric not null default 1,
  confidence text not null default 'community'
    check (confidence in ('unverified','community','video-confirmed','independently-verified','officially-confirmed')),
  last_verified date not null default current_date,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchase_options (
  id text primary key,
  name text not null,
  category text not null check (category in ('property', 'business', 'vehicle', 'weapon', 'equipment', 'upgrade')),
  price bigint not null default 0,
  description text not null default '',
  income_potential integer not null default 0 check (income_potential between 0 and 100),
  utility integer not null default 0 check (utility between 0 and 100),
  solo_usefulness integer not null default 0 check (solo_usefulness between 0 and 100),
  crew_usefulness integer not null default 0 check (crew_usefulness between 0 and 100),
  time_saved integer not null default 0 check (time_saved between 0 and 100),
  progression_value integer not null default 0 check (progression_value between 0 and 100),
  unlocks_activity_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.weekly_modifiers (
  id text primary key,
  title text not null,
  description text not null default '',
  type text not null check (type in ('bonus', 'discount', 'event')),
  multiplier numeric,
  discount_pct numeric,
  applies_to_activity_ids text[] default '{}',
  applies_to_item_ids text[] default '{}',
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.inventory_items enable row level security;
alter table public.activities enable row level security;
alter table public.purchase_options enable row level security;
alter table public.weekly_modifiers enable row level security;

drop policy if exists "catalog_public_read" on public.inventory_items;
create policy "catalog_public_read" on public.inventory_items for select using (true);
drop policy if exists "catalog_public_read" on public.activities;
create policy "catalog_public_read" on public.activities for select using (true);
drop policy if exists "catalog_public_read" on public.purchase_options;
create policy "catalog_public_read" on public.purchase_options for select using (true);
drop policy if exists "catalog_public_read" on public.weekly_modifiers;
create policy "catalog_public_read" on public.weekly_modifiers for select using (true);

-- Only admins/moderators can write catalog data. Helper function used by policies below.
create or replace function public.is_staff()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select coalesce((select is_admin or is_moderator from public.profiles where id = auth.uid()), false);
$$;

drop policy if exists "catalog_staff_write" on public.inventory_items;
create policy "catalog_staff_write" on public.inventory_items
  for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists "catalog_staff_write" on public.activities;
create policy "catalog_staff_write" on public.activities
  for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists "catalog_staff_write" on public.purchase_options;
create policy "catalog_staff_write" on public.purchase_options
  for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists "catalog_staff_write" on public.weekly_modifiers;
create policy "catalog_staff_write" on public.weekly_modifiers
  for all using (public.is_staff()) with check (public.is_staff());

-- ----------------------------------------------------------------------------
-- PLAYER INVENTORY (owned / favorited items, join against catalog)
-- ----------------------------------------------------------------------------
create table if not exists public.player_inventory (
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_id text not null references public.inventory_items (id) on delete cascade,
  favorite boolean not null default false,
  acquired_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

alter table public.player_inventory enable row level security;
drop policy if exists "player_inventory_owner_all" on public.player_inventory;
create policy "player_inventory_owner_all" on public.player_inventory
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- User-authored custom inventory items (not in the shared catalog).
create table if not exists public.custom_inventory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  category text not null check (category in ('property', 'business', 'vehicle', 'weapon', 'equipment', 'upgrade')),
  description text not null default '',
  estimated_value bigint not null default 0,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.custom_inventory_items enable row level security;
drop policy if exists "custom_inventory_owner_all" on public.custom_inventory_items;
create policy "custom_inventory_owner_all" on public.custom_inventory_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- SAVED PLANS
-- ----------------------------------------------------------------------------
create table if not exists public.saved_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  goal jsonb not null,
  recommendation jsonb not null,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.saved_plans enable row level security;
drop policy if exists "saved_plans_owner_all" on public.saved_plans;
create policy "saved_plans_owner_all" on public.saved_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- AI CHAT
-- Conversation history for the global AI intake chat bar.
-- ----------------------------------------------------------------------------
create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.chat_conversations enable row level security;
drop policy if exists "chat_conversations_owner_all" on public.chat_conversations;
create policy "chat_conversations_owner_all" on public.chat_conversations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  -- if this message produced a route, the full Recommendation is stored here
  -- so the chat thread can re-render the route card without recomputation.
  recommendation jsonb,
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;
drop policy if exists "chat_messages_owner_all" on public.chat_messages;
create policy "chat_messages_owner_all" on public.chat_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- COMMUNITY SUBMISSIONS + ADMIN CHANGE LOG
-- ----------------------------------------------------------------------------
create table if not exists public.community_submissions (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('activity', 'vehicle', 'property', 'business', 'weapon', 'modifier')),
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewer_id uuid references public.profiles (id),
  reviewer_notes text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.community_submissions enable row level security;

drop policy if exists "submissions_insert_own" on public.community_submissions;
create policy "submissions_insert_own" on public.community_submissions
  for insert with check (auth.uid() = submitted_by);

drop policy if exists "submissions_select_own_or_staff" on public.community_submissions;
create policy "submissions_select_own_or_staff" on public.community_submissions
  for select using (auth.uid() = submitted_by or public.is_staff());

drop policy if exists "submissions_update_staff" on public.community_submissions;
create policy "submissions_update_staff" on public.community_submissions
  for update using (public.is_staff()) with check (public.is_staff());

create table if not exists public.admin_change_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles (id),
  action text not null,
  entity_type text not null,
  entity_id text not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.admin_change_log enable row level security;
drop policy if exists "change_log_staff_read" on public.admin_change_log;
create policy "change_log_staff_read" on public.admin_change_log
  for select using (public.is_staff());
drop policy if exists "change_log_staff_insert" on public.admin_change_log;
create policy "change_log_staff_insert" on public.admin_change_log
  for insert with check (public.is_staff());

-- ----------------------------------------------------------------------------
-- updated_at auto-touch trigger, applied to the tables that track it
-- ----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_profiles on public.profiles;
create trigger touch_profiles before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_player_state on public.player_state;
create trigger touch_player_state before update on public.player_state
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_inventory_items on public.inventory_items;
create trigger touch_inventory_items before update on public.inventory_items
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_activities on public.activities;
create trigger touch_activities before update on public.activities
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_purchase_options on public.purchase_options;
create trigger touch_purchase_options before update on public.purchase_options
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_chat_conversations on public.chat_conversations;
create trigger touch_chat_conversations before update on public.chat_conversations
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- INDEXES
-- ----------------------------------------------------------------------------
create index if not exists idx_goals_user on public.goals (user_id);
create index if not exists idx_saved_plans_user on public.saved_plans (user_id, created_at desc);
create index if not exists idx_player_inventory_user on public.player_inventory (user_id);
create index if not exists idx_chat_messages_conversation on public.chat_messages (conversation_id, created_at);
create index if not exists idx_chat_conversations_user on public.chat_conversations (user_id, updated_at desc);
create index if not exists idx_activities_available on public.activities (available) where available = true;
create index if not exists idx_weekly_modifiers_expires on public.weekly_modifiers (expires_at);
create index if not exists idx_submissions_status on public.community_submissions (status);

-- ============================================================================
-- Done. Next: run supabase/seed.sql to load starter catalog data.
-- ============================================================================
