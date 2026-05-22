import { tryCreateClient } from "@/lib/supabase/server";
import type { Score } from "@/types/game";

export async function Leaderboard({
  highlightName,
}: {
  highlightName?: string;
}) {
  const supabase = tryCreateClient();

  if (!supabase) {
    return (
      <p className="text-sm text-amber-400">
        Supabase is not configured. In Vercel → Project → Settings → Environment
        Variables, add{" "}
        <code className="rounded bg-black/40 px-1">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
        and{" "}
        <code className="rounded bg-black/40 px-1">
          NEXT_PUBLIC_SUPABASE_ANON_KEY
        </code>
        , then redeploy.
      </p>
    );
  }

  try {
    const { data, error } = await supabase
      .from("scores")
      .select("id, player_name, score, total_pairs, question_set_id, played_at")
      .order("score", { ascending: false })
      .order("played_at", { ascending: true })
      .limit(10);

    if (error) {
      return (
        <p className="text-sm text-red-400">Could not load leaderboard.</p>
      );
    }

    const scores = (data ?? []) as Score[];

    if (scores.length === 0) {
      return (
        <p className="text-sm text-zinc-500">No scores yet. Be the first!</p>
      );
    }

    return (
      <ol className="space-y-2">
        {scores.map((row, index) => {
          const isHighlight =
            highlightName &&
            row.player_name.toLowerCase() === highlightName.toLowerCase();
          return (
            <li
              key={row.id}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                isHighlight
                  ? "bg-sky-500/15 ring-1 ring-sky-500/40"
                  : "bg-zinc-900/80"
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="w-6 text-center font-mono text-zinc-500">
                  {index + 1}
                </span>
                <span className="font-medium text-zinc-100">
                  {row.player_name}
                </span>
              </span>
              <span className="font-mono text-emerald-400">
                {row.score}/{row.total_pairs}
              </span>
            </li>
          );
        })}
      </ol>
    );
  } catch {
    return (
      <p className="text-sm text-red-400">Could not load leaderboard.</p>
    );
  }
}
