"use client";

import { LobbyResults } from "@/components/LobbyResults";
import {
  allPlayersFinished,
  countFinishedPlayers,
  hasPlayerFinished,
  isLobbyEnded,
  isLobbyExpired,
  isLobbyPlaying,
  startLobby,
  terminateLobbyByHost,
} from "@/lib/game/lobby-queries";
import { useLobbyLive } from "@/lib/game/use-lobby-live";
import { formatTime } from "@/lib/game/format-time";
import {
  clearLobbySession,
  getPlayerName,
  setLobbySession,
} from "@/lib/game/session";
import type { Lobby } from "@/types/game";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type LobbyRoomProps = {
  initialLobby: Lobby;
};

export function LobbyRoom({ initialLobby }: LobbyRoomProps) {
  const router = useRouter();
  const { lobby, players, live, refresh } = useLobbyLive({
    code: initialLobby.code,
    initialLobby,
  });
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");
  const [leaving, setLeaving] = useState(false);
  const playerName = getPlayerName();
  const isHost =
    playerName?.toLowerCase() === lobby.host_name.toLowerCase();

  const isWaiting = lobby.status === "waiting";
  const isPlaying = isLobbyPlaying(lobby);
  const isEnded = isLobbyEnded(lobby);
  const finishedCount = countFinishedPlayers(players, lobby.results);
  const everyoneDone =
    players.length > 0 && allPlayersFinished(players, lobby.results);
  const alreadyPlayed =
    playerName != null && hasPlayerFinished(lobby.results, playerName);

  useEffect(() => {
    setLobbySession({ id: lobby.id, code: lobby.code });
  }, [lobby.id, lobby.code]);

  useEffect(() => {
    if (!isPlaying || !lobby.ends_at) {
      setSecondsLeft(0);
      return;
    }

    function tick() {
      const left = Math.max(
        0,
        Math.floor((new Date(lobby.ends_at!).getTime() - Date.now()) / 1000),
      );
      setSecondsLeft(left);
      if (left === 0) void refresh();
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isPlaying, lobby.ends_at, refresh]);

  async function handleStartGame() {
    if (!playerName || !isHost) return;
    setStarting(true);
    setStartError("");
    try {
      await startLobby(lobby.id, playerName);
      await refresh();
    } catch (err) {
      setStartError(
        err instanceof Error ? err.message : "Could not start the game.",
      );
    } finally {
      setStarting(false);
    }
  }

  function copyCode() {
    void navigator.clipboard.writeText(lobby.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function leaveLobby() {
    if (leaving) return;
    setLeaving(true);

    if (isHost && playerName && lobby.status !== "ended") {
      try {
        await terminateLobbyByHost(lobby.id, playerName);
      } catch {
        /* still navigate away */
      }
    }

    clearLobbySession();
    router.push("/");
  }

  function endedReason(): string {
    if (lobby.status === "ended" && !everyoneDone && !isLobbyExpired(lobby)) {
      return "Host left — lobby closed";
    }
    if (everyoneDone && !isLobbyExpired(lobby)) {
      return "Everyone finished!";
    }
    return "Time's up!";
  }

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex min-h-full max-w-lg flex-col px-4 py-10">
        <header className="mb-8 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
            Lobby {live ? "· live" : ""}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {lobby.code}
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Host: {lobby.host_name} · up to ~80 players
          </p>
        </header>

        <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 text-center">
          {isWaiting && (
            <>
              <p className="text-xs uppercase tracking-widest text-zinc-500">
                Waiting for host
              </p>
              <p className="mt-2 text-lg text-zinc-200">
                Join now — host will start the game
              </p>
            </>
          )}
          {isPlaying && (
            <>
              <p className="text-xs text-zinc-500">Time remaining</p>
              <p className="mt-1 font-mono text-4xl tabular-nums text-sky-400">
                {formatTime(secondsLeft)}
              </p>
              <p className="mt-2 text-sm text-zinc-400">
                Finished: {finishedCount}/{players.length}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Leaderboard when everyone finishes or time runs out
              </p>
            </>
          )}
          {isEnded && (
            <>
              <p className="text-xs uppercase tracking-widest text-amber-400/90">
                {endedReason()}
              </p>
              <p className="mt-2 text-lg font-medium text-zinc-100">
                Final leaderboard
              </p>
            </>
          )}
        </section>

        {!isEnded && (
          <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-zinc-500">Join code</p>
                <p className="font-mono text-2xl tracking-widest text-sky-400">
                  {lobby.code}
                </p>
              </div>
              <button
                type="button"
                onClick={copyCode}
                className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </section>
        )}

        <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="mb-3 text-sm font-medium text-zinc-300">
            Players ({players.length})
          </h2>
          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {players.map((p) => {
              const done = lobby.results.some(
                (r) =>
                  r.player_name.toLowerCase() === p.player_name.toLowerCase(),
              );
              return (
                <li
                  key={p.id}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                    p.player_name === playerName
                      ? "bg-sky-500/15 text-sky-100"
                      : "bg-zinc-900/80 text-zinc-200"
                  }`}
                >
                  <span className="truncate pr-2">
                    {p.player_name}
                    {p.player_name === lobby.host_name && (
                      <span className="ml-2 text-xs text-zinc-500">(host)</span>
                    )}
                  </span>
                  {isPlaying && (
                    <span className="shrink-0 text-xs text-zinc-500">
                      {done ? "Done" : "…"}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {isWaiting && isHost && (
          <div className="mb-8 space-y-2">
            <button
              type="button"
              onClick={handleStartGame}
              disabled={starting || players.length < 1}
              className="w-full rounded-lg bg-sky-600 py-3 font-medium text-white transition-colors hover:bg-sky-500 disabled:opacity-50"
            >
              {starting ? "Starting…" : "Start game"}
            </button>
            {startError && (
              <p className="text-center text-sm text-red-400">{startError}</p>
            )}
            <p className="text-center text-xs text-zinc-500">
              Wait for students to join, then start ({formatTime(300)} round)
            </p>
          </div>
        )}

        {isWaiting && !isHost && (
          <p className="mb-8 text-center text-sm text-zinc-500">
            Waiting for {lobby.host_name} to start the game…
          </p>
        )}

        {isPlaying && alreadyPlayed && (
          <p className="mb-8 rounded-lg border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-center text-sm text-zinc-400">
            You finished your round. Waiting for others or the timer…
          </p>
        )}

        {isPlaying && !alreadyPlayed && (
          <Link
            href="/play"
            className="mb-8 block rounded-lg bg-emerald-600 py-3 text-center font-medium text-white transition-colors hover:bg-emerald-500"
          >
            Play game
          </Link>
        )}

        {isEnded && (
          <section className="mb-8 flex-1 rounded-xl border border-amber-500/30 bg-zinc-900/50 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium">Results</h2>
              <span className="text-xs text-zinc-500">Top 10 shown</span>
            </div>
            <LobbyResults
              results={lobby.results}
              highlightName={playerName ?? undefined}
            />
          </section>
        )}

        <footer className="mt-auto flex flex-col items-center gap-3 pt-8 text-sm">
          {isHost && !isEnded && (
            <p className="text-xs text-amber-400/80">
              Leaving ends the lobby for all students
            </p>
          )}
          <div className="flex justify-center gap-6">
            {!isHost || isEnded ? (
              <Link href="/" className="text-zinc-500 hover:text-zinc-300">
                {isEnded ? "New lobby" : "Home"}
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => void leaveLobby()}
              disabled={leaving}
              className="text-zinc-500 hover:text-zinc-300 disabled:opacity-50"
            >
              {leaving
                ? "Leaving…"
                : isHost && !isEnded
                  ? "Leave (end lobby)"
                  : "Leave"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
