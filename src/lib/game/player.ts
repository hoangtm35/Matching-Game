export const PLAYER_NAME_KEY = "matching-game-player-name";

export function getPlayerName(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(PLAYER_NAME_KEY);
}

export function setPlayerName(name: string): void {
  sessionStorage.setItem(PLAYER_NAME_KEY, name.trim());
}
