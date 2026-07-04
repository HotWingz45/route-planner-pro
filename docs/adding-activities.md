# Adding activities (the admin insert path)

Real GTA VI content is added as **rows in `activities`** — never as schema
migrations or engine changes. The engine (`src/lib/engine.ts`) reads only the
generic columns; anything game-specific it doesn't yet understand goes in
`metadata`.

## Pattern

Run in Supabase SQL Editor (service role / dashboard only — catalog writes are
blocked for regular users by the `catalog_staff_write` RLS policy). The
`on conflict` upsert makes it safe to re-run and to correct numbers later:

```sql
insert into public.activities
  (id, name, category, description, min_players, max_players, setup_minutes,
   completion_minutes, min_payout, max_payout, requirements, risk, is_passive,
   cooldown_minutes, available, weekly_multiplier, confidence, tags,
   metadata, unlock_condition)
values
  ('act-vi-example-heist', 'Example Heist', 'Heist',
   'Replace with the real description.',
   1, 4, 15, 45, 300000, 450000,
   '[{"itemId":"prop-example-safehouse","reason":"Planning board required."}]',
   'high', false, 120, true, 1,
   'video-confirmed',            -- unverified | community | video-confirmed |
                                 -- independently-verified | officially-confirmed
   '{vi,heist}',
   '{"gameVersion":"GTA VI 1.0","region":"Vice City"}',   -- metadata: anything goes
   null                          -- unlock_condition: null = always available
  )
on conflict (id) do update set
  name = excluded.name, description = excluded.description,
  min_payout = excluded.min_payout, max_payout = excluded.max_payout,
  requirements = excluded.requirements, metadata = excluded.metadata,
  unlock_condition = excluded.unlock_condition, confidence = excluded.confidence,
  available = excluded.available, last_verified = current_date;
```

## Rules of thumb

- **Payouts unknown?** Use your best community estimate and set
  `confidence = 'community'` — the sourcing columns (`source_*` on
  `inventory_items`, `confidence`/`last_verified` on `activities`) exist
  precisely so estimates can be upgraded later.
- **New kind of gating?** If it's "player must own item X", use
  `requirements` (the engine enforces it today). Anything else (rank, story
  progress, region) goes in `unlock_condition` for a future engine pass —
  do NOT hardcode game-specific logic into `engine.ts`.
- **Weekly events** go in `weekly_modifiers` rows, same idempotent pattern
  (see `supabase/seed.sql` for examples of all four tables).
