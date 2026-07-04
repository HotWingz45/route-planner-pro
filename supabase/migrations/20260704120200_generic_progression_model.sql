-- ============================================================================
-- Generic progression data model (Section 3)
-- Goal: when real GTA VI content lands (previews → launch → post-launch), it
-- arrives as ROWS, never as schema migrations or engine changes. The engine
-- (src/lib/engine.ts) reads only generic fields and stays untouched.
-- Idempotent; safe to re-run.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Future-proofing columns on the catalog
--   metadata          jsonb catch-all for game-specific facts we can't predict
--                     yet (e.g. {"region": "...", "rp_reward": 1200}). The
--                     engine ignores it; UI and future scoring passes can read
--                     it without schema changes.
--   unlock_condition  jsonb describing how the activity unlocks (null = always
--                     available). Kept separate from `requirements` (owned-item
--                     gating the engine already enforces) so progression-style
--                     conditions can be layered in without engine changes.
-- ----------------------------------------------------------------------------
alter table public.activities
  add column if not exists metadata jsonb not null default '{}',
  add column if not exists unlock_condition jsonb;

alter table public.inventory_items
  add column if not exists metadata jsonb not null default '{}';

alter table public.purchase_options
  add column if not exists metadata jsonb not null default '{}';

-- ----------------------------------------------------------------------------
-- 2. recommendations — audited engine output. Links the exact player-state
-- snapshot that went IN to the ranked steps that came OUT, plus the
-- calculation basis (multipliers, $/min, engine version) so any recommendation
-- can be explained or re-derived later ("why did it tell me to do X?").
-- ----------------------------------------------------------------------------
create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  source text not null default 'planner' check (source in ('planner', 'chat')),
  player_state_snapshot jsonb not null,
  steps jsonb not null,
  calculation_basis jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_recommendations_user
  on public.recommendations (user_id, created_at desc);

alter table public.recommendations enable row level security;

drop policy if exists "recommendations_owner_all" on public.recommendations;
create policy "recommendations_owner_all" on public.recommendations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
