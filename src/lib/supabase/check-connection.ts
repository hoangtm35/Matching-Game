import { createClient } from "./client";

export type ConnectionStatus =
  | { state: "missing_env" }
  | { state: "connected"; message: string }
  | { state: "connected_pending_schema"; message: string }
  | { state: "error"; message: string };

/**
 * Smoke-test Supabase reachability. Before Step 2 tables exist,
 * a "relation does not exist" response still means the API is reachable.
 */
export async function checkSupabaseConnection(): Promise<ConnectionStatus> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return { state: "missing_env" };
  }

  try {
    const supabase = createClient();
    const { error } = await supabase.from("scores").select("id").limit(1);

    if (!error) {
      const { count, error: setsError } = await supabase
        .from("question_sets")
        .select("id", { count: "exact", head: true });

      if (!setsError && (count ?? 0) > 0) {
        return {
          state: "connected",
          message: `Connected. Database ready (${count} question set(s) in pool).`,
        };
      }

      return {
        state: "connected_pending_schema",
        message:
          "Tables exist. Run supabase/002_seed.sql in SQL Editor to add question sets.",
      };
    }

    const code = error.code ?? "";
    const msg = error.message.toLowerCase();

    if (
      code === "42P01" ||
      msg.includes("does not exist") ||
      msg.includes("could not find the table")
    ) {
      return {
        state: "connected_pending_schema",
        message:
          "Connected to Supabase. Database tables are not created yet (expected until Step 2).",
      };
    }

    return { state: "error", message: error.message };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { state: "error", message };
  }
}
