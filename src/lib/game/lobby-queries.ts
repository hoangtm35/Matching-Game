import { generateLobbyCode, normalizeLobbyCode } from "@/lib/game/lobby-code";
import { tryCreateClient } from "@/lib/supabase/client";
import type { Lobby, LobbyPlayer, LobbyResult } from "@/types/game";

export const DEFAULT_LOBBY_DURATION_SEC = 300; // 5 minutes
const MAX_CODE_ATTEMPTS = 8;
const TOP_RESULTS = 10;

function requireClient() {
  const supabase = tryCreateClient();
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return supabase;
}

function parseResults(raw: unknown): LobbyResult[] {
  if (!Array.isArray(raw)) return [];
  return raw as LobbyResult[];
}

function sortResults(results: LobbyResult[]): LobbyResult[] {
  return [...results]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.time_seconds ?? 999) - (b.time_seconds ?? 999);
    })
    .slice(0, TOP_RESULTS);
}

function mapLobby(data: {
  id: string;
  code: string;
  host_name: string;
  created_at: string;
  ends_at: string | null;
  status: Lobby["status"];
  results: unknown;
}): Lobby {
  return {
    ...data,
    results: parseResults(data.results),
  };
}

export function allPlayersFinished(
  players: LobbyPlayer[],
  results: LobbyResult[],
): boolean {
  if (players.length === 0) return false;
  const finished = new Set(
    results.map((r) => r.player_name.toLowerCase()),
  );
  return players.every((p) => finished.has(p.player_name.toLowerCase()));
}

export function isLobbyExpired(lobby: Lobby): boolean {
  if (!lobby.ends_at) return false;
  return new Date(lobby.ends_at).getTime() <= Date.now();
}

export function isLobbyPlaying(lobby: Lobby): boolean {
  return lobby.status === "playing" && !isLobbyExpired(lobby);
}

export function isLobbyEnded(lobby: Lobby): boolean {
  return lobby.status === "ended";
}

export async function createLobby(hostName: string): Promise<Lobby> {
  const supabase = requireClient();
  const trimmed = hostName.trim();

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const code = generateLobbyCode();
    const { data, error } = await supabase
      .from("lobbies")
      .insert({
        code,
        host_name: trimmed,
        ends_at: null,
        status: "waiting",
        results: [],
      })
      .select(
        "id, code, host_name, created_at, ends_at, status, results",
      )
      .single();

    if (!error && data) {
      await supabase.from("lobby_players").insert({
        lobby_id: data.id,
        player_name: trimmed,
      });
      return mapLobby(data);
    }

    if (error?.code !== "23505") throw error;
  }

  throw new Error("Could not create a lobby. Please try again.");
}

export async function joinLobby(
  codeInput: string,
  playerName: string,
): Promise<Lobby> {
  const supabase = requireClient();
  const code = normalizeLobbyCode(codeInput);
  const trimmed = playerName.trim();

  if (code.length !== 6) {
    throw new Error("Lobby code must be 6 characters.");
  }

  const lobby = await fetchLobbyByCode(code);
  if (!lobby) {
    throw new Error("Lobby not found. Check the code and try again.");
  }

  if (lobby.status === "ended") {
    throw new Error("This lobby has already ended.");
  }

  if (lobby.status === "playing") {
    throw new Error("The game already started. You cannot join now.");
  }

  const { error: playerError } = await supabase.from("lobby_players").upsert(
    { lobby_id: lobby.id, player_name: trimmed },
    { onConflict: "lobby_id,player_name" },
  );

  if (playerError) throw playerError;

  return lobby;
}

/** Host starts the round — timer begins and players can play. */
export async function startLobby(
  lobbyId: string,
  hostName: string,
): Promise<Lobby> {
  const supabase = requireClient();
  const trimmed = hostName.trim();

  const { data: lobby, error: fetchError } = await supabase
    .from("lobbies")
    .select("id, host_name, status")
    .eq("id", lobbyId)
    .single();

  if (fetchError || !lobby) throw new Error("Lobby not found.");

  if (lobby.host_name.toLowerCase() !== trimmed.toLowerCase()) {
    throw new Error("Only the host can start the game.");
  }

  if (lobby.status !== "waiting") {
    throw new Error("The game has already started or ended.");
  }

  const endsAt = new Date(
    Date.now() + DEFAULT_LOBBY_DURATION_SEC * 1000,
  ).toISOString();

  const { data, error } = await supabase
    .from("lobbies")
    .update({ status: "playing", ends_at: endsAt, results: [] })
    .eq("id", lobbyId)
    .select("id, code, host_name, created_at, ends_at, status, results")
    .single();

  if (error) throw error;
  return mapLobby(data);
}

export async function fetchLobbyByCode(codeInput: string): Promise<Lobby | null> {
  const supabase = tryCreateClient();
  if (!supabase) return null;

  const code = normalizeLobbyCode(codeInput);
  if (code.length !== 6) return null;

  const { data, error } = await supabase
    .from("lobbies")
    .select("id, code, host_name, created_at, ends_at, status, results")
    .eq("code", code)
    .single();

  if (error || !data) return null;

  return mapLobby(data);
}

export async function fetchLobbyPlayers(
  lobbyId: string,
): Promise<LobbyPlayer[]> {
  const supabase = tryCreateClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("lobby_players")
    .select("id, lobby_id, player_name, joined_at")
    .eq("lobby_id", lobbyId)
    .order("joined_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as LobbyPlayer[];
}

export async function endLobby(lobbyId: string): Promise<Lobby> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from("lobbies")
    .update({ status: "ended" })
    .eq("id", lobbyId)
    .select("id, code, host_name, created_at, ends_at, status, results")
    .single();

  if (error) throw error;
  return mapLobby(data);
}

export async function syncLobbyState(lobby: Lobby): Promise<Lobby> {
  if (lobby.status === "ended") return lobby;

  if (lobby.status === "playing") {
    if (isLobbyExpired(lobby)) {
      return endLobby(lobby.id);
    }

    const players = await fetchLobbyPlayers(lobby.id);
    if (allPlayersFinished(players, lobby.results)) {
      return endLobby(lobby.id);
    }
  }

  return lobby;
}

/** Record a finish in the lobby session (temporary — not the scores table). */
export async function submitLobbyResult(
  lobbyId: string,
  result: Omit<LobbyResult, "finished_at">,
): Promise<void> {
  const supabase = requireClient();

  const { data: lobby, error: fetchError } = await supabase
    .from("lobbies")
    .select("ends_at, status, results")
    .eq("id", lobbyId)
    .single();

  if (fetchError || !lobby) throw new Error("Lobby not found.");

  if (lobby.status !== "playing") {
    throw new Error("The game is not in progress.");
  }

  if (new Date(lobby.ends_at as string).getTime() <= Date.now()) {
    throw new Error("Lobby time has ended.");
  }

  const entry: LobbyResult = {
    ...result,
    finished_at: new Date().toISOString(),
  };

  const existing = parseResults(lobby.results);
  if (hasPlayerFinished(existing, result.player_name)) {
    throw new Error("You already played in this lobby.");
  }
  const updated = sortResults([...existing, entry]);

  const { error: updateError } = await supabase
    .from("lobbies")
    .update({ results: updated })
    .eq("id", lobbyId);

  if (updateError) throw updateError;

  const players = await fetchLobbyPlayers(lobbyId);
  if (allPlayersFinished(players, updated)) {
    await endLobby(lobbyId);
  }
}

export function getSortedResults(results: LobbyResult[]): LobbyResult[] {
  return sortResults(results);
}

export function countFinishedPlayers(
  players: LobbyPlayer[],
  results: LobbyResult[],
): number {
  const finished = new Set(
    results.map((r) => r.player_name.toLowerCase()),
  );
  return players.filter((p) => finished.has(p.player_name.toLowerCase())).length;
}

export function hasPlayerFinished(
  results: LobbyResult[],
  playerName: string,
): boolean {
  const key = playerName.trim().toLowerCase();
  return results.some((r) => r.player_name.toLowerCase() === key);
}
