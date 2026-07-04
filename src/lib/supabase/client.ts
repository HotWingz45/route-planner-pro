import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Client-side Supabase instance. Uses the public anon key — safe to expose,
// RLS policies in supabase/schema.sql are what actually protect the data.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Fails loudly in dev instead of silently returning null data everywhere.

  console.error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill in your Supabase project values.",
  );
}

export const supabase = createClient<Database>(url ?? "", anonKey ?? "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
