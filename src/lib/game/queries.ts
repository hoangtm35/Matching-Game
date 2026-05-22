import { createClient } from "@/lib/supabase/client";
import type { GameRound, Option, QuestionSet, Score } from "@/types/game";

const LEADERBOARD_LIMIT = 10;

export async function fetchRandomQuestionSet(): Promise<GameRound | null> {
  const supabase = createClient();

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

export async function fetchLeaderboard(): Promise<Score[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("scores")
    .select("id, player_name, score, total_pairs, question_set_id, played_at")
    .order("score", { ascending: false })
    .order("played_at", { ascending: true })
    .limit(LEADERBOARD_LIMIT);

  if (error) throw error;
  return (data ?? []) as Score[];
}

export async function submitScore(input: {
  playerName: string;
  score: number;
  totalPairs: number;
  questionSetId: string;
}): Promise<Score> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("scores")
    .insert({
      player_name: input.playerName.trim(),
      score: input.score,
      total_pairs: input.totalPairs,
      question_set_id: input.questionSetId,
    })
    .select("id, player_name, score, total_pairs, question_set_id, played_at")
    .single();

  if (error) throw error;
  return data as Score;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
