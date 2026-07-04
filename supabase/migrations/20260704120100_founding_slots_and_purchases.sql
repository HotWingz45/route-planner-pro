-- ============================================================================
-- Subscriptions (Section 2): Founding Pro cap + purchase flow + expiry job
-- Idempotent; safe to re-run.
--
-- Cap approach: single counter row updated atomically inside the purchase
-- transaction. Chosen over a sequence because nextval() is non-transactional —
-- a failed purchase would burn its slot number forever, letting the tier
-- appear sold out below 500 real members. This counter rolls back with the
-- transaction, so 501 members is impossible and no slot is ever wasted.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Slot counter (single row, id locked to 1)
-- RLS enabled with NO policies: clients get default-deny in both directions.
-- Only security-definer functions below and the service role can touch it.
-- ----------------------------------------------------------------------------
create table if not exists public.founding_pro_slots (
  id integer primary key check (id = 1),
  claimed integer not null default 0 check (claimed >= 0),
  cap integer not null default 500 check (cap >= 0),
  check (claimed <= cap)
);
insert into public.founding_pro_slots (id) values (1) on conflict (id) do nothing;

alter table public.founding_pro_slots enable row level security;

-- ----------------------------------------------------------------------------
-- 2. Atomic slot claim. Returns the claimed slot number (1-based), or NULL
-- when sold out. The row-level lock taken by UPDATE serializes concurrent
-- claimants; the WHERE clause makes over-claiming impossible.
-- ----------------------------------------------------------------------------
create or replace function public.claim_founding_slot()
returns integer
language sql
security definer set search_path = public
as $$
  update public.founding_pro_slots
     set claimed = claimed + 1
   where id = 1 and claimed < cap
   returning claimed;
$$;

revoke execute on function public.claim_founding_slot() from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3. Purchase entry point — the WHOLE purchase in one transaction (a plpgsql
-- function body is atomic: if the profile update fails, the slot claim rolls
-- back too). Server-only: EXECUTE revoked from client roles; called via the
-- service-role client from src/lib/actions/billing.ts AFTER payment has
-- succeeded (payment processing itself is stubbed there for now).
--
-- Founding Pro: $49/year, price-locked, annual renewal (renews_at + 1 year).
-- Launch Pass:  $19.99, expires exactly 90 days after purchase (window is
--               anchored to PURCHASE TIME, set once, never recalculated).
--               Re-purchasing an expired/active pass resets the window.
-- ----------------------------------------------------------------------------
create or replace function public.purchase_tier(p_user_id uuid, p_tier text)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_current text;
  v_slot integer;
  v_expires timestamptz;
begin
  if p_tier not in ('founding_pro', 'launch_pass') then
    raise exception 'unknown tier: %', p_tier;
  end if;

  -- Lock the caller's profile row: serializes double-purchases per user.
  select subscription_tier into v_current
    from public.profiles where id = p_user_id for update;
  if v_current is null then
    return jsonb_build_object('status', 'no_account');
  end if;
  if v_current = 'founding_pro' then
    -- Never claim a second slot (also blocks pointless launch_pass downgrades).
    return jsonb_build_object('status', 'already_owned');
  end if;

  if p_tier = 'founding_pro' then
    v_slot := public.claim_founding_slot();
    if v_slot is null then
      return jsonb_build_object('status', 'sold_out');
    end if;
    update public.profiles
       set subscription_tier = 'founding_pro',
           founding_pro_slot_number = v_slot,
           subscription_started_at = now(),
           subscription_renews_at = now() + interval '1 year',
           subscription_price_cents = 4900,
           launch_pass_expires_at = null
     where id = p_user_id;
    return jsonb_build_object('status', 'ok', 'slot', v_slot);
  end if;

  -- launch_pass
  v_expires := now() + interval '90 days';
  update public.profiles
     set subscription_tier = 'launch_pass',
         subscription_started_at = now(),
         subscription_renews_at = null,
         subscription_price_cents = 1999,
         launch_pass_expires_at = v_expires
   where id = p_user_id;
  return jsonb_build_object('status', 'ok', 'expires_at', v_expires);
end;
$$;

revoke execute on function public.purchase_tier(uuid, text) from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 4. Expiry job: actively flip expired Launch Pass accounts back to free so
-- they lose paid UI state — read-time checks (hasActiveAccess) are the
-- safety net, not the mechanism. Returns how many accounts were downgraded.
-- ----------------------------------------------------------------------------
create or replace function public.expire_launch_passes()
returns integer
language sql
security definer set search_path = public
as $$
  with expired as (
    update public.profiles
       set subscription_tier = 'free'
     where subscription_tier = 'launch_pass'
       and launch_pass_expires_at is not null
       and launch_pass_expires_at <= now()
    returning 1
  )
  select count(*)::integer from expired;
$$;

revoke execute on function public.expire_launch_passes() from public, anon, authenticated;

-- Schedule nightly via pg_cron (available on hosted Supabase). cron.schedule
-- with an existing job name replaces it, so this stays idempotent. If the
-- extension can't be created in this environment, we log and continue — in
-- that case schedule expire_launch_passes() externally (e.g. a Vercel cron
-- hitting a server route that calls it via the service role).
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule(
    'expire-launch-passes',
    '15 3 * * *',
    $job$ select public.expire_launch_passes(); $job$
  );
exception when others then
  raise notice 'pg_cron unavailable (%). Schedule public.expire_launch_passes() externally.', sqlerrm;
end $$;
