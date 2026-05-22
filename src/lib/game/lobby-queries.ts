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

function sortResults(results: LobbyResult[]): LobbyResult[] {
  return [...results]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.time_seconds - a.time_seconds;
    })
    .slice(0, TOP_RESULTS);
}

type LobbyRow = {
  id: string;
  code: string;
  host_name: string;
  created_at: string;
  ends_at: string | null;
  status: Lobby["status"];
};

async function attachResults(
  row: LobbyRow,
  results?: LobbyResult[],
): Promise<Lobby> {
  const list = results ?? (await fetchLobbyResults(row.id));
  return { ...row, results: list };
}

export async function fetchLobbyResults(lobbyId: string): Promise<LobbyResult[]> {
  const supabase = tryCreateClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("lobby_results")
    .select(
      "id, player_name, score, total_pairs, time_seconds, question_set_title, finished_at",
    )
    .eq("lobby_id", lobbyId)
    .order("score", { ascending: false })
    .order("time_seconds", { ascending: true });

  if (error) throw error;
  return (data ?? []) as LobbyResult[];
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
      })
      .select("id, code, host_name, created_at, ends_at, status")
      .single();

    if (!error && data) {
      await supabase.from("lobby_players").insert({
        lobby_id: data.id,
        player_name: trimmed,
      });
      return attachResults(data as LobbyRow);
    }

    if (error?.code !== "23505") throw error;
  }

  throw new Error("Could not create a lobby. Please try again.");
}

export async function joinLobby(
  codeInput: string,
  playerName: string,
): Promise<Lobby> {
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

  const supabase = requireClient();
  const { error: playerError } = await supabase.from("lobby_players").upsert(
    { lobby_id: lobby.id, player_name: trimmed },
    { onConflict: "lobby_id,player_name" },
  );

  if (playerError) throw playerError;

  return lobby;
}

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

  await supabase.from("lobby_results").delete().eq("lobby_id", lobbyId);

  const endsAt = new Date(
    Date.now() + DEFAULT_LOBBY_DURATION_SEC * 1000,
  ).toISOString();

  const { data, error } = await supabase
    .from("lobbies")
    .update({ status: "playing", ends_at: endsAt })
    .eq("id", lobbyId)
    .select("id, code, host_name, created_at, ends_at, status")
    .single();

  if (error) throw error;
  return attachResults(data as LobbyRow, []);
}

export async function fetchLobbyByCode(codeInput: string): Promise<Lobby | null> {
  const supabase = tryCreateClient();
  if (!supabase) return null;

  const code = normalizeLobbyCode(codeInput);
  if (code.length !== 6) return null;

  const { data, error } = await supabase
    .from("lobbies")
    .select("id, code, host_name, created_at, ends_at, status")
    .eq("code", code)
    .single();

  if (error || !data) return null;

  return attachResults(data as LobbyRow);
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
    .select("id, code, host_name, created_at, ends_at, status")
    .single();

  if (error) throw error;
  return attachResults(data as LobbyRow);
}

export async function syncLobbyState(lobby: Lobby): Promise<Lobby> {
  if (lobby.status === "ended") {
    const results = await fetchLobbyResults(lobby.id);
    return { ...lobby, results };
  }

  if (lobby.status === "playing") {
    const results = await fetchLobbyResults(lobby.id);
    const withResults = { ...lobby, results };

    if (isLobbyExpired(withResults)) {
      return endLobby(lobby.id);
    }

    const players = await fetchLobbyPlayers(lobby.id);
    if (allPlayersFinished(players, results)) {
      return endLobby(lobby.id);
    }

    return withResults;
  }

  const results = await fetchLobbyResults(lobby.id);
  return { ...lobby, results };
}

export async function submitLobbyResult(
  lobbyId: string,
  result: Omit<LobbyResult, "finished_at" | "id">,
): Promise<void> {
  const supabase = requireClient();

  const { data: lobby, error: fetchError } = await supabase
    .from("lobbies")
    .select("ends_at, status")
    .eq("id", lobbyId)
    .single();

  if (fetchError || !lobby) throw new Error("Lobby not found.");

  if (lobby.status !== "playing") {
    throw new Error("The game is not in progress.");
  }

  if (new Date(lobby.ends_at as string).getTime() <= Date.now()) {
    throw new Error("Lobby time has ended.");
  }

  const { error: insertError } = await supabase.from("lobby_results").insert({
    lobby_id: lobbyId,
    player_name: result.player_name.trim(),
    score: result.score,
    total_pairs: result.total_pairs,
    time_seconds: result.time_seconds,
    question_set_title: result.question_set_title,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      throw new Error("You already played in this lobby.");
    }
    throw insertError;
  }

  const [players, results] = await Promise.all([
    fetchLobbyPlayers(lobbyId),
    fetchLobbyResults(lobbyId),
  ]);

  if (allPlayersFinished(players, results)) {
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
