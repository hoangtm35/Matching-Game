"use client";

import { setPlayerName } from "@/lib/game/player";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function WelcomeForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 1) {
      setError("Enter your name to play.");
      return;
    }
    if (trimmed.length > 30) {
      setError("Name must be 30 characters or less.");
      return;
    }
    setPlayerName(trimmed);
    router.push("/play");
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
          placeholder="e.g. Alex"
          maxLength={30}
          autoComplete="nickname"
          className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        className="w-full rounded-lg bg-sky-600 px-4 py-3 font-medium text-white transition-colors hover:bg-sky-500"
      >
        Start game
      </button>
    </form>
  );
}
