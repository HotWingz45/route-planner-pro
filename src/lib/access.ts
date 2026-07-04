// The ONE place paid access is decided. Every route, component, and server
// action must call hasActiveAccess() rather than comparing tiers or
// timestamps itself — expiry semantics live here and nowhere else.
//
// Note the launch_pass expiry check: the nightly expire_launch_passes() job
// flips expired accounts back to 'free' in the database, but this read-time
// check covers the window between expiry and the next job run.

import type { SubscriptionTier } from "./supabase/database.types";

export interface AccountAccess {
  subscriptionTier: SubscriptionTier;
  launchPassExpiresAt: string | null;
}

export function hasActiveAccess(account: AccountAccess, now: Date = new Date()): boolean {
  switch (account.subscriptionTier) {
    case "founding_pro":
      return true;
    case "launch_pass":
      return (
        account.launchPassExpiresAt !== null && new Date(account.launchPassExpiresAt) > now
      );
    default:
      return false;
  }
}
