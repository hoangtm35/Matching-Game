import type { Option } from "@/types/game";

export function scoreMatches(
  optionsA: Option[],
  optionsB: Option[],
  matches: Record<string, string>,
): { score: number; totalPairs: number; correctPairIds: string[] } {
  const bById = new Map(optionsB.map((b) => [b.id, b]));
  const correctPairIds: string[] = [];
  let score = 0;

  for (const optionA of optionsA) {
    const matchedB = bById.get(matches[optionA.id] ?? "");
    if (matchedB && matchedB.pair_id === optionA.pair_id) {
      score += 1;
      correctPairIds.push(optionA.pair_id);
    }
  }

  return { score, totalPairs: optionsA.length, correctPairIds };
}
