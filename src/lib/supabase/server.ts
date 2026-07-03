import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Server-only Supabase client. Uses the SERVICE ROLE key, which bypasses RLS —
 * never import this file from client code. Only use inside TanStack Start
 * server functions (files that run with the "use server" directive, or
 * anything under src/lib/server/**).
 *
 * We still pass the caller's access token through where relevant so that
 * auth.uid() resolves correctly for RLS-aware queries when you choose to use
 * the anon-scoped client instead — see getServerSupabaseForUser below.
 */
export function getServerSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY server env vars. See .env.example.",
    );
  }
  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Server client scoped to a specific user's access token, so RLS policies
 * apply exactly as they would for that user's own client-side session.
 * Prefer this over getServerSupabaseAdmin() whenever you're acting on behalf
 * of a logged-in user rather than doing trusted system-level work.
 */
export function getServerSupabaseForUser(accessToken: string) {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY server env vars. See .env.example.");
  }
  return createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
