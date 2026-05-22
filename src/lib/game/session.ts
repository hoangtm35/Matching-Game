export const PLAYER_NAME_KEY = "matching-game-player-name";
export const LOBBY_ID_KEY = "matching-game-lobby-id";
export const LOBBY_CODE_KEY = "matching-game-lobby-code";

export function getPlayerName(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(PLAYER_NAME_KEY);
}

export function setPlayerName(name: string): void {
  sessionStorage.setItem(PLAYER_NAME_KEY, name.trim());
}

export function getLobbySession(): { id: string; code: string } | null {
  if (typeof window === "undefined") return null;
  const id = sessionStorage.getItem(LOBBY_ID_KEY);
  const code = sessionStorage.getItem(LOBBY_CODE_KEY);
  if (!id || !code) return null;
  return { id, code };
}

export function setLobbySession(lobby: { id: string; code: string }): void {
  sessionStorage.setItem(LOBBY_ID_KEY, lobby.id);
  sessionStorage.setItem(LOBBY_CODE_KEY, lobby.code.toUpperCase());
}

export function clearLobbySession(): void {
  sessionStorage.removeItem(LOBBY_ID_KEY);
  sessionStorage.removeItem(LOBBY_CODE_KEY);
}
