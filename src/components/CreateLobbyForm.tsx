"use client";

import { createLobby } from "@/lib/game/lobby-queries";
import { setLobbySession, setPlayerName } from "@/lib/game/session";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function CreateLobbyForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 1) {
      setError("Enter your name.");
      return;
    }
    if (trimmed.length > 30) {
      setError("Name must be 30 characters or less.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const lobby = await createLobby(trimmed);
      setPlayerName(trimmed);
      setLobbySession({ id: lobby.id, code: lobby.code });
      router.push(`/lobby/${lobby.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create lobby.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="text-sm text-zinc-400">Your name (host)</span>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          placeholder="e.g. Alex"
          maxLength={30}
          autoComplete="nickname"
          className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-sky-600 px-4 py-3 font-medium text-white transition-colors hover:bg-sky-500 disabled:opacity-50"
      >
        {loading ? "Creating…" : "Create lobby"}
      </button>
    </form>
  );
}
