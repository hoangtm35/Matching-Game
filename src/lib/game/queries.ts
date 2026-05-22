import { tryCreateClient } from "@/lib/supabase/client";
import type { GameRound, Option, QuestionSet } from "@/types/game";

export async function fetchRandomQuestionSet(): Promise<GameRound | null> {
  const supabase = tryCreateClient();
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const { data: sets, error: setsError } = await supabase
    .from("question_sets")
    .select("id, title, created_at");

  if (setsError) throw setsError;
  if (!sets?.length) return null;

  const questionSet = sets[
    Math.floor(Math.random() * sets.length)
  ] as QuestionSet;

  const { data: options, error: optionsError } = await supabase
    .from("options")
    .select("id, question_set_id, side, label, pair_id, sort_order")
    .eq("question_set_id", questionSet.id)
    .order("sort_order", { ascending: true });

  if (optionsError) throw optionsError;

  const all = (options ?? []) as Option[];
  const optionsA = all.filter((o) => o.side === "A");
  const optionsB = shuffle(all.filter((o) => o.side === "B"));

  return { questionSet, optionsA, optionsB };
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
