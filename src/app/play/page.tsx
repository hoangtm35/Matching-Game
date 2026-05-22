"use client";

import { MatchingGame } from "@/components/MatchingGame";
import {
  fetchLobbyByCode,
  hasPlayerFinished,
  isLobbyPlaying,
} from "@/lib/game/lobby-queries";
import { getLobbySession, getPlayerName } from "@/lib/game/session";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PlayPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [lobby, setLobby] = useState<{ id: string; code: string } | null>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    async function init() {
      const session = getLobbySession();
      const name = getPlayerName();
      if (!session || !name) {
        router.replace("/");
        return;
      }

      const data = await fetchLobbyByCode(session.code);
      if (
        !data ||
        !isLobbyPlaying(data) ||
        hasPlayerFinished(data.results, name)
      ) {
        setBlocked(true);
        setLobby(session);
        return;
      }

      setLobby(session);
      setReady(true);
    }

    void init();
  }, [router]);

  if (blocked && lobby) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-zinc-950 px-4 text-center text-zinc-300">
        <p>You cannot play right now.</p>
        <p className="text-sm text-zinc-500">
          Wait for the host to start, you may have already finished, or the
          round has ended.
        </p>
        <Link
          href={`/lobby/${lobby.code}`}
          className="text-sky-400 hover:underline"
        >
          Back to lobby
        </Link>
      </div>
    );
  }

  if (!ready || !lobby) {
    return (
      <div className="flex min-h-full items-center justify-center bg-zinc-950 text-zinc-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-zinc-950 text-zinc-100">
      <nav className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <Link
          href={`/lobby/${lobby.code}`}
          className="text-sm text-zinc-400 transition-colors hover:text-zinc-200"
        >
          ← Lobby {lobby.code}
        </Link>
      </nav>
      <MatchingGame lobbyId={lobby.id} lobbyCode={lobby.code} />
    </div>
  );
}
