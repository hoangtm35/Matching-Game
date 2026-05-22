import { createClient } from "./client";

export type DbStats = {
  questionSets: number;
  options: number;
  scores: number;
  ready: boolean;
};

export async function getDbStats(): Promise<DbStats | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  try {
    const supabase = createClient();

    const [sets, options, scores] = await Promise.all([
      supabase.from("question_sets").select("id", { count: "exact", head: true }),
      supabase.from("options").select("id", { count: "exact", head: true }),
      supabase.from("scores").select("id", { count: "exact", head: true }),
    ]);

    const hasError =
      sets.error?.message.includes("does not exist") ||
      sets.error?.code === "42P01" ||
      sets.error?.message.includes("could not find");

    if (hasError) {
      return { questionSets: 0, options: 0, scores: 0, ready: false };
    }

    if (sets.error) throw sets.error;
    if (options.error) throw options.error;
    if (scores.error) throw scores.error;

    const questionSets = sets.count ?? 0;
    const optionCount = options.count ?? 0;

    return {
      questionSets,
      options: optionCount,
      scores: scores.count ?? 0,
      ready: questionSets > 0 && optionCount > 0,
    };
  } catch {
    return null;
  }
}
