"use client";

import {
  fetchLobbyByCode,
  fetchLobbyPlayers,
  syncLobbyState,
} from "@/lib/game/lobby-queries";
import { tryCreateClient } from "@/lib/supabase/client";
import type { Lobby, LobbyPlayer } from "@/types/game";
import { useCallback, useEffect, useRef, useState } from "react";

type UseLobbyLiveOptions = {
  code: string;
  initialLobby: Lobby;
  pollIntervalMs?: number;
};

export function useLobbyLive({
  code,
  initialLobby,
  pollIntervalMs = 8000,
}: UseLobbyLiveOptions) {
  const [lobby, setLobby] = useState(initialLobby);
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [live, setLive] = useState(false);
  const syncing = useRef(false);

  const refresh = useCallback(async () => {
    if (syncing.current) return;
    syncing.current = true;
    try {
      let next = await fetchLobbyByCode(code);
      if (!next) return;
      next = await syncLobbyState(next);
      const list = await fetchLobbyPlayers(next.id);
      setLobby(next);
      setPlayers(list);
    } finally {
      syncing.current = false;
    }
  }, [code]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const supabase = tryCreateClient();
    if (!supabase) return;

    const lobbyId = initialLobby.id;
    const channel = supabase
      .channel(`lobby:${lobbyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lobbies",
          filter: `id=eq.${lobbyId}`,
        },
        () => void refresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lobby_players",
          filter: `lobby_id=eq.${lobbyId}`,
        },
        () => void refresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lobby_results",
          filter: `lobby_id=eq.${lobbyId}`,
        },
        () => void refresh(),
      )
      .subscribe((status) => {
        setLive(status === "SUBSCRIBED");
      });

    const poll = setInterval(() => void refresh(), pollIntervalMs);

    return () => {
      clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, [initialLobby.id, refresh, pollIntervalMs]);

  return { lobby, players, live, refresh };
}
