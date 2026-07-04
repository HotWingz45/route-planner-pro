# Migrations

Timestamped SQL files following the Supabase CLI naming convention
(`YYYYMMDDHHMMSS_name.sql`). The project predates these — the baseline schema
lives in `../schema.sql` (+ `../seed.sql`) and was applied via the SQL Editor.

## Applying

Until the Supabase CLI is linked, apply each file **in filename order** via
Dashboard → SQL Editor → New query → paste the whole file → Run. Every file is
idempotent (safe to re-run).

If the CLI is adopted later (`supabase link --project-ref <ref>`), these files
are already in the format `supabase db push` expects; mark the baseline as
applied first (`supabase migration repair`).

## History

| File | What it does |
| --- | --- |
| `20260704120000_accounts_and_tiers.sql` | New tier lineup (free / founding_pro / launch_pass), subscription columns on `profiles`, client write-lock on billing columns |
| `20260704120100_founding_slots_and_purchases.sql` | Founding Pro 500-cap counter + atomic claim, `purchase_tier()` transaction, `expire_launch_passes()` + nightly pg_cron job |
| `20260704120200_generic_progression_model.sql` | `metadata`/`unlock_condition` jsonb on catalog tables, `recommendations` audit table |
