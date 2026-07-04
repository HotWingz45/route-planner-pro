// Server-only purchase flow.
//
// ============================= PAYMENT STUB =================================
// completePurchase() is the "payment already succeeded" entry point: it grants
// the tier but processes no money. When a payment provider is chosen, DO NOT
// call this from the client on checkout success — call it from the provider's
// webhook handler (e.g. checkout.session.completed) after verifying the
// webhook signature, passing the user id from the session metadata. Until
// then, this server function trusts the caller's Supabase session only.
// =============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerSupabaseForUser, getServerSupabaseAdmin } from "../supabase/server";

const purchaseInputSchema = z.object({
  tier: z.enum(["founding_pro", "launch_pass"]),
  accessToken: z.string().min(1),
});

export type PurchaseResult =
  | { status: "ok"; tier: "founding_pro"; slotNumber: number }
  | { status: "ok"; tier: "launch_pass"; expiresAt: string }
  // Founding Pro cap reached — a specific, frontend-checkable state, not an error.
  | { status: "sold_out" }
  | { status: "already_owned" };

export const completePurchase = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => purchaseInputSchema.parse(data))
  .handler(async ({ data }): Promise<PurchaseResult> => {
    const userClient = getServerSupabaseForUser(data.accessToken);
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes.user) {
      throw new Error("Not authenticated.");
    }

    // purchase_tier runs the entire grant in one DB transaction (atomic slot
    // claim included) and is EXECUTE-revoked for client roles — only the
    // service role may call it.
    const admin = getServerSupabaseAdmin();
    const { data: result, error } = await admin.rpc("purchase_tier", {
      p_user_id: userRes.user.id,
      p_tier: data.tier,
    });
    if (error) throw error;

    const r = result as { status: string; slot?: number; expires_at?: string };
    switch (r.status) {
      case "ok":
        return data.tier === "founding_pro"
          ? { status: "ok", tier: "founding_pro", slotNumber: r.slot! }
          : { status: "ok", tier: "launch_pass", expiresAt: r.expires_at! };
      case "sold_out":
        return { status: "sold_out" };
      case "already_owned":
        return { status: "already_owned" };
      default:
        // 'no_account' should be impossible for an authenticated user (the
        // signup trigger creates the profile row) — treat it as a hard error.
        throw new Error(`Purchase failed: ${r.status}`);
    }
  });
