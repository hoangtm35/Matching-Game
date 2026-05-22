"use client";

import { MatchOptionRow } from "@/components/MatchOptionRow";
import { fetchRandomQuestionSet, submitScore } from "@/lib/game/queries";
import { getPlayerName } from "@/lib/game/player";
import type { GameRound, Option } from "@/types/game";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type Phase = "loading" | "playing" | "submitting" | "done";

const FADE_MS = 650;
const SHAKE_MS = 450;

export function MatchingGame() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [playerName, setPlayerNameState] = useState<string | null>(null);
  const [round, setRound] = useState<GameRound | null>(null);
  const [selectedAId, setSelectedAId] = useState<string | null>(null);
  const [removedIds, setRemovedIds] = useState<Set<string>>(() => new Set());
  const [fadingIds, setFadingIds] = useState<Set<string>>(() => new Set());
  const [wrongIds, setWrongIds] = useState<Set<string>>(() => new Set());
  const [correctCount, setCorrectCount] = useState(0);
  const [error, setError] = useState("");
  const [finalScore, setFinalScore] = useState<{
    score: number;
    totalPairs: number;
  } | null>(null);
  const [submitError, setSubmitError] = useState("");
  const finishStarted = useRef(false);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timeouts.current.push(id);
  }, []);

  useEffect(() => {
    return () => {
      timeouts.current.forEach(clearTimeout);
    };
  }, []);

  const loadRound = useCallback(async () => {
    setPhase("loading");
    setError("");
    setSelectedAId(null);
    setRemovedIds(new Set());
    setFadingIds(new Set());
    setWrongIds(new Set());
    setCorrectCount(0);
    setFinalScore(null);
    setSubmitError("");
    finishStarted.current = false;

    try {
      const data = await fetchRandomQuestionSet();
      if (!data) {
        setError("No question sets found. Run the seed SQL in Supabase.");
        return;
      }
      setRound(data);
      setPhase("playing");
    } catch {
      setError("Failed to load questions. Check your connection.");
    }
  }, []);

  const finishRound = useCallback(
    async (score: number, totalPairs: number, questionSetId: string) => {
      if (!playerName || finishStarted.current) return;
      finishStarted.current = true;
      setFinalScore({ score, totalPairs });
      setPhase("submitting");

      try {
        await submitScore({
          playerName,
          score,
          totalPairs,
          questionSetId,
        });
        setPhase("done");
      } catch {
        setSubmitError(
          "Score could not be saved. Try again from the home page.",
        );
        setPhase("done");
      }
    },
    [playerName],
  );

  useEffect(() => {
    const name = getPlayerName();
    if (!name) {
      router.replace("/");
      return;
    }
    setPlayerNameState(name);
    loadRound();
  }, [router, loadRound]);

  useEffect(() => {
    if (!round || phase !== "playing") return;
    if (correctCount < round.optionsA.length) return;

    schedule(() => {
      finishRound(
        correctCount,
        round.optionsA.length,
        round.questionSet.id,
      );
    }, FADE_MS);
  }, [correctCount, round, phase, finishRound, schedule]);

  function handleClickA(optionA: Option) {
    if (removedIds.has(optionA.id) || fadingIds.has(optionA.id)) return;
    setSelectedAId(optionA.id);
    setWrongIds(new Set());
  }

  function handleClickB(optionB: Option) {
    if (!selectedAId || !round) return;
    if (removedIds.has(optionB.id) || fadingIds.has(optionB.id)) return;

    const optionA = round.optionsA.find((a) => a.id === selectedAId);
    if (!optionA || removedIds.has(optionA.id)) return;

    setSelectedAId(null);

    if (optionA.pair_id === optionB.pair_id) {
      const ids = [optionA.id, optionB.id];
      setFadingIds((prev) => new Set([...prev, ...ids]));

      schedule(() => {
        setFadingIds((prev) => {
          const next = new Set(prev);
          ids.forEach((id) => next.delete(id));
          return next;
        });
        setRemovedIds((prev) => new Set([...prev, ...ids]));
        setCorrectCount((c) => c + 1);
      }, FADE_MS);
    } else {
      setWrongIds(new Set([optionA.id, optionB.id]));
      schedule(() => setWrongIds(new Set()), SHAKE_MS);
    }
  }

  if (phase === "loading" && !error) {
    return (
      <div className="flex flex-1 items-center justify-center text-zinc-400">
        Loading questions…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-16 text-center">
        <p className="text-red-400">{error}</p>
        <Link href="/" className="text-sky-400 hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  if (phase === "done" && finalScore && round) {
    const pct = Math.round(
      (finalScore.score / finalScore.totalPairs) * 100,
    );
    return (
      <div className="mx-auto w-full max-w-lg space-y-8 px-4 py-12">
        <div className="text-center">
          <p className="text-sm uppercase tracking-widest text-zinc-500">
            Round complete
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-zinc-100">
            {finalScore.score}/{finalScore.totalPairs}
          </h1>
          <p className="mt-2 text-zinc-400">
            {pct}% correct · {round.questionSet.title}
          </p>
          {submitError ? (
            <p className="mt-4 text-sm text-amber-400">{submitError}</p>
          ) : (
            <p className="mt-4 text-sm text-emerald-400">
              Score saved to the leaderboard!
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={loadRound}
            className="flex-1 rounded-lg bg-sky-600 py-3 font-medium text-white hover:bg-sky-500"
          >
            Play again
          </button>
          <Link
            href="/"
            className="flex flex-1 items-center justify-center rounded-lg border border-zinc-700 py-3 font-medium text-zinc-200 hover:bg-zinc-800"
          >
            Leaderboard
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "submitting" && round) {
    return (
      <div className="flex flex-1 items-center justify-center text-zinc-400">
        Saving score…
      </div>
    );
  }

  if (!round || !playerName) return null;

  const totalPairs = round.optionsA.length;
  const visibleA = round.optionsA.filter((a) => !removedIds.has(a.id));
  const visibleB = round.optionsB.filter((b) => !removedIds.has(b.id));

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500">Playing as {playerName}</p>
          <h1 className="text-2xl font-semibold text-zinc-100">
            {round.questionSet.title}
          </h1>
        </div>
        <p className="font-mono text-sm text-emerald-400">
          Matched {correctCount}/{totalPairs}
        </p>
      </header>

      <p className="mb-6 text-center text-sm text-zinc-400">
        Click <span className="text-sky-400">A</span>, then{" "}
        <span className="text-violet-400">B</span> — correct pairs fade away
      </p>

      <div className="grid gap-8 md:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-sky-400">
            Section A
          </h2>
          <ul className="space-y-2">
            {visibleA.map((optionA) => {
              const isSelected = selectedAId === optionA.id;
              const isFading = fadingIds.has(optionA.id);
              const isWrong = wrongIds.has(optionA.id);

              return (
                <MatchOptionRow
                  key={optionA.id}
                  fading={isFading}
                  wrong={isWrong}
                >
                  <button
                    type="button"
                    onClick={() => handleClickA(optionA)}
                    disabled={isFading}
                    className={[
                      "match-option-btn w-full rounded-lg border px-4 py-3 text-left font-medium text-zinc-100",
                      isFading &&
                        "match-option-btn--success border-emerald-400 bg-emerald-500/20",
                      isWrong &&
                        "border-red-500/60 bg-red-500/10",
                      isSelected
                        ? "border-sky-500 bg-sky-500/15 ring-2 ring-sky-500/50"
                        : !isFading && !isWrong
                          ? "border-zinc-700 bg-zinc-900 hover:border-zinc-600"
                          : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {optionA.label}
                  </button>
                </MatchOptionRow>
              );
            })}
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-violet-400">
            Section B
          </h2>
          <ul className="space-y-2">
            {visibleB.map((optionB) => {
              const canPick = Boolean(selectedAId);
              const isFading = fadingIds.has(optionB.id);
              const isWrong = wrongIds.has(optionB.id);

              return (
                <MatchOptionRow
                  key={optionB.id}
                  fading={isFading}
                  wrong={isWrong}
                >
                  <button
                    type="button"
                    disabled={!canPick || isFading}
                    onClick={() => handleClickB(optionB)}
                    className={[
                      "match-option-btn w-full rounded-lg border px-4 py-3 text-left font-medium",
                      isFading &&
                        "match-option-btn--success border-emerald-400 bg-emerald-500/20 text-zinc-100",
                      isWrong &&
                        "border-red-500/60 bg-red-500/10 text-zinc-100",
                      !canPick && !isFading && !isWrong
                        ? "cursor-default border-zinc-800 bg-zinc-950 text-zinc-600"
                        : !isFading && !isWrong
                          ? "border-zinc-700 bg-zinc-900 text-zinc-100 hover:border-violet-500 hover:bg-violet-500/10"
                          : "text-zinc-100",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {optionB.label}
                  </button>
                </MatchOptionRow>
              );
            })}
          </ul>
        </section>
      </div>

      {wrongIds.size > 0 && (
        <p className="mt-6 text-center text-sm text-red-400/90">
          Not a match — try again
        </p>
      )}

      <div className="mt-10 text-center">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
          Exit to home
        </Link>
      </div>
    </div>
  );
}
