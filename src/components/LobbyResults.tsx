import { formatTime } from "@/lib/game/format-time";
import { getSortedResults } from "@/lib/game/lobby-queries";
import type { LobbyResult } from "@/types/game";

export function LobbyResults({
  results,
  highlightName,
}: {
  results: LobbyResult[];
  highlightName?: string;
}) {
  const sorted = getSortedResults(results);

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No one finished a round before time ran out.
      </p>
    );
  }

  return (
    <ol className="space-y-2">
      {sorted.map((row, index) => {
        const isHighlight =
          highlightName &&
          row.player_name.toLowerCase() === highlightName.toLowerCase();
        return (
          <li
            key={`${row.player_name}-${row.finished_at}`}
            className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm ${
              isHighlight
                ? "bg-sky-500/15 ring-1 ring-sky-500/40"
                : "bg-zinc-900/80"
            }`}
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="w-6 shrink-0 text-center font-mono text-zinc-500">
                {index + 1}
              </span>
              <span className="truncate font-medium text-zinc-100">
                {row.player_name}
              </span>
            </span>
            <span className="shrink-0 text-right">
              <span className="font-mono text-emerald-400">
                {row.score}/{row.total_pairs}
              </span>
              <span className="block font-mono text-xs text-zinc-500">
                {formatTime(row.time_seconds)}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
