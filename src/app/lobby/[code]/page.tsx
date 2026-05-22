import { LobbyRoom } from "@/components/LobbyRoom";
import { normalizeLobbyCode } from "@/lib/game/lobby-code";
import { tryCreateClient } from "@/lib/supabase/server";
import type { Lobby, LobbyResult } from "@/types/game";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ code: string }>;
};

function parseResults(raw: unknown): LobbyResult[] {
  if (!Array.isArray(raw)) return [];
  return raw as LobbyResult[];
}

export default async function LobbyPage({ params }: PageProps) {
  const { code: raw } = await params;
  const code = normalizeLobbyCode(raw);

  if (code.length !== 6) notFound();

  const supabase = tryCreateClient();
  if (!supabase) {
    return (
      <div className="flex min-h-full items-center justify-center bg-zinc-950 px-4 text-amber-400">
        Supabase is not configured.
      </div>
    );
  }

  const { data, error } = await supabase
    .from("lobbies")
    .select("id, code, host_name, created_at, ends_at, status, results")
    .eq("code", code)
    .single();

  if (error || !data) notFound();

  const lobby: Lobby = {
    ...(data as Lobby),
    results: parseResults(data.results),
  };

  return <LobbyRoom initialLobby={lobby} />;
}
