import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

export function tryCreateClient() {
  const { url, anonKey, isConfigured } = getSupabaseEnv();
  if (!isConfigured) return null;
  return createSupabaseClient(url!, anonKey!);
}

export function createClient() {
  const client = tryCreateClient();
  if (!client) {
    throw new Error(
      "Missing Supabase env vars. Copy .env.local.example to .env.local and add your project URL and anon key.",
    );
  }
  return client;
}
