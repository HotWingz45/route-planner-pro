// Proves the Founding Pro cap holds under concurrent load.
//
//   bun run scripts/test-founding-cap.ts
//
// Needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (bun auto-loads .env).
// Strategy: temporarily set the cap to a small number, fire 5x that many
// claim_founding_slot() calls CONCURRENTLY against the real database, and
// assert exactly `cap` succeed with exactly the slot numbers 1..cap and no
// duplicates. Restores the original counter state afterwards, so it is safe
// to run against a live project (as long as no real checkout is in flight).

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/database.types";

const TEST_CAP = 5;
const CONCURRENT_CLAIMS = 25;

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars.");
  process.exit(1);
}
const admin = createClient<Database>(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: original, error: readErr } = await admin
  .from("founding_pro_slots")
  .select("claimed, cap")
  .eq("id", 1)
  .single();
if (readErr || !original) {
  console.error("Could not read founding_pro_slots — did migration 20260704120100 run?", readErr);
  process.exit(1);
}
console.log(`Original state: claimed=${original.claimed} cap=${original.cap}`);

let failed = false;
try {
  await admin.from("founding_pro_slots").update({ claimed: 0, cap: TEST_CAP }).eq("id", 1);
  console.log(`Set test state: claimed=0 cap=${TEST_CAP}; firing ${CONCURRENT_CLAIMS} concurrent claims…`);

  const results = await Promise.all(
    Array.from({ length: CONCURRENT_CLAIMS }, () => admin.rpc("claim_founding_slot")),
  );

  const rpcErrors = results.filter(r => r.error);
  const slots = results.map(r => r.data).filter((n): n is number => typeof n === "number");
  const uniqueSlots = new Set(slots);

  console.log(`Successful claims: ${slots.length} (slots: ${[...slots].sort((a, b) => a - b).join(", ")})`);
  console.log(`Rejected (sold out): ${results.length - slots.length - rpcErrors.length}, RPC errors: ${rpcErrors.length}`);

  if (rpcErrors.length > 0) {
    console.error("FAIL: unexpected RPC errors", rpcErrors[0]?.error);
    failed = true;
  }
  if (slots.length !== TEST_CAP) {
    console.error(`FAIL: expected exactly ${TEST_CAP} successful claims, got ${slots.length}`);
    failed = true;
  }
  if (uniqueSlots.size !== slots.length) {
    console.error("FAIL: duplicate slot numbers were handed out");
    failed = true;
  }
  if (slots.some(n => n < 1 || n > TEST_CAP)) {
    console.error(`FAIL: slot number outside 1..${TEST_CAP} was handed out`);
    failed = true;
  }

  const { data: after } = await admin
    .from("founding_pro_slots")
    .select("claimed")
    .eq("id", 1)
    .single();
  if (after?.claimed !== TEST_CAP) {
    console.error(`FAIL: counter ended at ${after?.claimed}, expected ${TEST_CAP}`);
    failed = true;
  }

  if (!failed) console.log(`PASS: cap held — ${TEST_CAP}/${CONCURRENT_CLAIMS} claims succeeded, no dupes, counter exact.`);
} finally {
  await admin
    .from("founding_pro_slots")
    .update({ claimed: original.claimed, cap: original.cap })
    .eq("id", 1);
  console.log(`Restored original state: claimed=${original.claimed} cap=${original.cap}`);
}

process.exit(failed ? 1 : 0);
