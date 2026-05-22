import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

export function createClient() {
  const { url, anonKey, isConfigured } = getSupabaseEnv();

  if (!isConfigured) {
    throw new Error(
      "Missing Supabase env vars. Copy .env.local.example to .env.local and add your project URL and anon key.",
    );
  }

  return createSupabaseClient(url!, anonKey!);
}
