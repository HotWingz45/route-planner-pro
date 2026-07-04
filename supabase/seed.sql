-- ============================================================================
-- ScorePath Seed Data
-- Run AFTER schema.sql. This is your existing mock-data.ts content, now real
-- rows. Everything is marked confidence='community' — replace with verified
-- GTA VI numbers as they become available (see confidence/source columns).
-- Safe to re-run: uses ON CONFLICT DO UPDATE.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- INVENTORY ITEMS
-- ----------------------------------------------------------------------------
insert into public.inventory_items
  (id, name, category, description, estimated_value, unlocks_activity_ids, tags, source_confidence, source_name)
values
  ('prop-coastal-villa', 'Coastal Villa', 'property', 'Beachfront residence with rooftop helipad.', 1850000, '{act-private-contract}', '{luxury,solo}', 'community', 'ScorePath sample data'),
  ('prop-downtown-loft', 'Downtown Loft', 'property', 'Compact city base, fast respawn.', 420000, '{}', '{budget}', 'community', 'ScorePath sample data'),
  ('biz-night-club', 'Neon District Nightclub', 'business', 'Passive revenue venue with backroom storage.', 1650000, '{act-club-revenue,act-warehouse-shipment}', '{passive,high-income}', 'community', 'ScorePath sample data'),
  ('biz-import-warehouse', 'Import Warehouse', 'business', 'Stores high-end vehicle imports for resale.', 980000, '{act-warehouse-shipment}', '{active}', 'community', 'ScorePath sample data'),
  ('biz-counterfeit', 'Document Forgery Lab', 'business', 'Mid-tier passive operation.', 650000, '{act-lab-sale}', '{passive}', 'community', 'ScorePath sample data'),
  ('veh-armored-suv', 'Armored Touring SUV', 'vehicle', 'Bulletproof transport, crew capable.', 295000, '{act-private-contract}', '{combat}', 'community', 'ScorePath sample data'),
  ('veh-sport-coupe', 'Hypersport Coupe', 'vehicle', 'Top-tier street performance.', 1450000, '{act-street-race}', '{race}', 'community', 'ScorePath sample data'),
  ('veh-cargo-truck', 'Heavy Cargo Hauler', 'vehicle', 'Required for warehouse runs.', 180000, '{act-warehouse-shipment}', '{work}', 'community', 'ScorePath sample data'),
  ('wpn-tactical-rifle', 'Tactical Rifle', 'weapon', 'Balanced loadout for contracts.', 45000, '{}', '{combat}', 'community', 'ScorePath sample data'),
  ('wpn-marksman', 'Marksman Rifle', 'weapon', 'Long-range option for setups.', 78000, '{}', '{combat}', 'community', 'ScorePath sample data'),
  ('eq-armor-mk2', 'Heavy Armor Mk II', 'equipment', 'Reduces downtime in combat.', 28000, '{}', '{defense}', 'community', 'ScorePath sample data'),
  ('eq-comms-drone', 'Recon Comms Drone', 'equipment', 'Marks targets and reduces setup time.', 96000, '{act-private-contract}', '{utility}', 'community', 'ScorePath sample data')
on conflict (id) do update set
  name = excluded.name, category = excluded.category, description = excluded.description,
  estimated_value = excluded.estimated_value, unlocks_activity_ids = excluded.unlocks_activity_ids,
  tags = excluded.tags;

-- ----------------------------------------------------------------------------
-- ACTIVITIES
-- requirements is jsonb: [{"itemId": "...", "reason": "..."}]
-- ----------------------------------------------------------------------------
insert into public.activities
  (id, name, category, description, min_players, max_players, setup_minutes, completion_minutes,
   min_payout, max_payout, requirements, risk, is_passive, cooldown_minutes, available,
   weekly_multiplier, confidence, tags)
values
  ('act-high-value-contract', 'High-Value Contract', 'Contract', 'Multi-phase contract delivering a high-stakes target.',
   1, 4, 8, 35, 220000, 290000, '[]', 'high', false, 90, true, 1.5, 'community', '{heist,boost}'),

  ('act-private-contract', 'Private Security Contract', 'Contract', 'Solo-friendly contract from your private command center.',
   1, 2, 4, 22, 95000, 145000,
   '[{"itemId":"prop-coastal-villa","reason":"Requires private command center."}]',
   'medium', false, 30, true, 1, 'community', '{solo}'),

  ('act-quick-security', 'Quick Security Job', 'Quick Job', 'Short combat job with reliable payout.',
   1, 4, 0, 14, 38000, 58000, '[]', 'low', false, 0, true, 1, 'community', '{solo,no-setup}'),

  ('act-club-revenue', 'Nightclub Revenue Pickup', 'Passive', 'Collect accumulated venue revenue.',
   1, 1, 0, 6, 45000, 95000,
   '[{"itemId":"biz-night-club","reason":"Requires owned nightclub."}]',
   'low', true, 240, true, 1.2, 'community', '{passive}'),

  ('act-warehouse-shipment', 'Warehouse Shipment Sale', 'Sale', 'Deliver stockpiled imports to buyers.',
   1, 4, 12, 28, 180000, 260000,
   '[{"itemId":"biz-import-warehouse","reason":"Stock comes from warehouse."},{"itemId":"veh-cargo-truck","reason":"Hauler required."}]',
   'medium', false, 60, true, 1, 'community', '{sale}'),

  ('act-lab-sale', 'Forgery Lab Sale', 'Sale', 'Mid-tier sale mission, low risk.',
   1, 2, 5, 18, 70000, 110000,
   '[{"itemId":"biz-counterfeit","reason":"Lab inventory required."}]',
   'low', false, 45, true, 1, 'community', '{sale}'),

  ('act-street-race', 'Underground Street Race', 'Race', 'Competitive race circuit.',
   2, 8, 2, 12, 22000, 65000,
   '[{"itemId":"veh-sport-coupe","reason":"Class S vehicle required."}]',
   'low', false, 0, true, 2, 'community', '{crew,boost}'),

  ('act-bonus-survival', 'Bonus Survival Round', 'Bonus', 'Wave-based survival with weekly bonus.',
   1, 4, 0, 16, 32000, 72000, '[]', 'medium', false, 60, true, 1.75, 'community', '{boost}'),

  ('act-cargo-air', 'Air Cargo Run', 'Sale', 'Aerial cargo delivery across the map.',
   1, 4, 6, 22, 85000, 140000, '[]', 'medium', false, 30, true, 1, 'community', '{}'),

  ('act-stash-run', 'Stash House Clearout', 'Quick Job', 'Clear a stash house and grab the cash.',
   1, 2, 0, 9, 18000, 32000, '[]', 'low', false, 0, true, 1, 'community', '{solo,no-setup}'),

  ('act-vip-hit', 'VIP Elimination', 'Contract', 'Tactical elimination, marksman recommended.',
   1, 2, 4, 15, 62000, 98000,
   '[{"itemId":"wpn-marksman","reason":"Long-range engagement."}]',
   'medium', false, 30, true, 1, 'community', '{}'),

  ('act-bonus-heist-finale', 'Boosted Heist Finale', 'Heist', 'Multi-stage finale with current weekly boost.',
   2, 4, 25, 55, 410000, 580000,
   '[{"itemId":"prop-coastal-villa","reason":"Planning room required."}]',
   'high', false, 180, true, 1.5, 'community', '{crew,boost}')
on conflict (id) do update set
  name = excluded.name, description = excluded.description, min_payout = excluded.min_payout,
  max_payout = excluded.max_payout, requirements = excluded.requirements,
  weekly_multiplier = excluded.weekly_multiplier, available = excluded.available,
  last_verified = current_date;

-- ----------------------------------------------------------------------------
-- PURCHASE OPTIONS
-- ----------------------------------------------------------------------------
insert into public.purchase_options
  (id, name, category, price, description, income_potential, utility, solo_usefulness,
   crew_usefulness, time_saved, progression_value, unlocks_activity_ids)
values
  ('buy-coastal-villa', 'Coastal Villa', 'property', 1850000, 'Premium operations property with planning room.', 78, 90, 95, 80, 70, 95, '{act-private-contract,act-bonus-heist-finale}'),
  ('buy-night-club', 'Neon District Nightclub', 'business', 1650000, 'Passive nightly revenue and storage chain.', 92, 80, 85, 70, 90, 88, '{act-club-revenue,act-warehouse-shipment}'),
  ('buy-import-warehouse', 'Import Warehouse', 'business', 980000, 'Active high-margin sales loop.', 80, 70, 60, 88, 40, 70, '{act-warehouse-shipment}'),
  ('buy-sport-coupe', 'Hypersport Coupe', 'vehicle', 1450000, 'Required to enter Class S race rotation.', 35, 75, 80, 60, 65, 55, '{act-street-race}'),
  ('buy-armored-suv', 'Armored Touring SUV', 'vehicle', 295000, 'Survivability boost for contracts.', 20, 88, 85, 90, 55, 60, '{}'),
  ('buy-comms-drone', 'Recon Comms Drone', 'equipment', 96000, 'Trims setup time on several missions.', 30, 92, 95, 78, 88, 50, '{act-private-contract}'),
  ('buy-armor-mk2', 'Heavy Armor Mk II', 'equipment', 28000, 'Lower-tier survivability upgrade.', 10, 70, 75, 70, 25, 30, '{}'),
  ('buy-marksman', 'Marksman Rifle', 'weapon', 78000, 'Unlocks long-range contract style.', 35, 70, 85, 65, 40, 50, '{act-vip-hit}')
on conflict (id) do update set
  price = excluded.price, description = excluded.description,
  income_potential = excluded.income_potential, utility = excluded.utility;

-- ----------------------------------------------------------------------------
-- WEEKLY MODIFIERS
-- Note: expires_at values are relative to seed run time. Replace this table's
-- contents every Thursday — see the scraper task in the project roadmap.
-- ----------------------------------------------------------------------------
insert into public.weekly_modifiers
  (id, title, description, type, multiplier, discount_pct, applies_to_activity_ids, applies_to_item_ids, expires_at)
values
  ('wk-bonus-contract', 'High-Value Contracts 1.5x', 'All High-Value Contracts pay 50% more.', 'bonus', 1.5, null, '{act-high-value-contract,act-bonus-heist-finale}', '{}', now() + interval '4 days'),
  ('wk-bonus-race', 'Underground Races 2x', 'Race payouts doubled this week.', 'bonus', 2, null, '{act-street-race}', '{}', now() + interval '4 days'),
  ('wk-bonus-survival', 'Bonus Survival 1.75x', 'Survival rounds boosted.', 'bonus', 1.75, null, '{act-bonus-survival}', '{}', now() + interval '2 days'),
  ('wk-discount-suv', 'Armored SUV 25% off', 'Discount on the Armored Touring SUV.', 'discount', null, 25, '{}', '{buy-armored-suv}', now() + interval '4 days'),
  ('wk-event-club', 'Nightclub Revenue +20%', 'Venues earn an extra 20% this week.', 'event', 1.2, null, '{act-club-revenue}', '{}', now() + interval '6 days')
on conflict (id) do update set
  title = excluded.title, multiplier = excluded.multiplier, discount_pct = excluded.discount_pct,
  expires_at = excluded.expires_at;

-- ============================================================================
-- Done. Catalog data is live. Per-user data (player_state, goals, saved_plans,
-- chat history) is created automatically on signup via the handle_new_user
-- trigger in schema.sql — nothing to seed there.
-- ============================================================================
