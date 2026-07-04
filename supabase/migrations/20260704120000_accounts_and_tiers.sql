-- ============================================================================
-- Accounts & tiers (Section 1)
-- `profiles` is the existing account anchor (1:1 with auth.users, created by
-- the handle_new_user trigger) — subscription state lives here, NOT on
-- auth.users. Idempotent; safe to re-run.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tier lineup: free | founding_pro | launch_pass
-- The single `subscription_tier` field is what the app reads to gate features
-- (no scattered boolean flags). Old placeholder values are retired.
-- ----------------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_subscription_tier_check;

-- Map any rows still on retired values (defensive; none exist in production).
update public.profiles set subscription_tier = 'founding_pro' where subscription_tier = 'founding';
update public.profiles set subscription_tier = 'free'
  where subscription_tier not in ('free', 'founding_pro', 'launch_pass');

alter table public.profiles
  add constraint profiles_subscription_tier_check
  check (subscription_tier in ('free', 'founding_pro', 'launch_pass'));

-- ----------------------------------------------------------------------------
-- 2. Subscription anchor columns
--   founding_pro_slot_number  "You're founding member #237" (unique, 1..500)
--   subscription_started_at   when the paid tier was purchased
--   subscription_renews_at    next renewal (Founding Pro: annual, price-locked)
--   subscription_price_cents  price locked at purchase time (4900 / 1999)
--   launch_pass_expires_at    set once at purchase (+90d), never recalculated
-- ----------------------------------------------------------------------------
alter table public.profiles add column if not exists founding_pro_slot_number integer;
alter table public.profiles add column if not exists subscription_started_at timestamptz;
alter table public.profiles add column if not exists subscription_renews_at timestamptz;
alter table public.profiles add column if not exists subscription_price_cents integer;
alter table public.profiles add column if not exists launch_pass_expires_at timestamptz;

create unique index if not exists profiles_founding_slot_unique
  on public.profiles (founding_pro_slot_number)
  where founding_pro_slot_number is not null;

-- ----------------------------------------------------------------------------
-- 3. Lock billing columns against client writes.
-- RLS's `profiles_update_own` policy governs WHICH ROWS a user may update;
-- column-level grants govern WHICH COLUMNS. Without this, any logged-in user
-- could self-upgrade subscription_tier through PostgREST. The service-role
-- key (server only) bypasses grants, so src/lib/actions/* keep working.
-- No client code updates profiles today, so granting display_name only is
-- forward-compatible, not a behavior change.
-- ----------------------------------------------------------------------------
revoke update on table public.profiles from authenticated, anon;
grant update (display_name) on table public.profiles to authenticated;

-- RLS reminder (unchanged, verified present in schema.sql): users can only
-- SELECT/UPDATE their own profiles row, so no user can read another user's
-- tier, slot number, or usage counters.
