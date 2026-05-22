"use client";

import { joinLobby } from "@/lib/game/lobby-queries";
import { normalizeLobbyCode } from "@/lib/game/lobby-code";
import { setLobbySession, setPlayerName } from "@/lib/game/session";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function JoinLobbyForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    const normalized = normalizeLobbyCode(code);
    if (trimmed.length < 1) {
      setError("Enter your name.");
      return;
    }
    if (normalized.length !== 6) {
      setError("Enter the 6-character lobby code.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const lobby = await joinLobby(normalized, trimmed);
      setPlayerName(trimmed);
      setLobbySession({ id: lobby.id, code: lobby.code });
      router.push(`/lobby/${lobby.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join lobby.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="text-sm text-zinc-400">Your name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          placeholder="e.g. Sam"
          maxLength={30}
          autoComplete="nickname"
          className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
      </label>
      <label className="block">
        <span className="text-sm text-zinc-400">Lobby code</span>
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError("");
          }}
          placeholder="ABC123"
          maxLength={6}
          className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 font-mono uppercase tracking-widest text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-violet-600 px-4 py-3 font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
      >
        {loading ? "Joining…" : "Join lobby"}
      </button>
    </form>
  );
}
