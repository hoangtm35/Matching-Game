import { LobbyRoom } from "@/components/LobbyRoom";
import { normalizeLobbyCode } from "@/lib/game/lobby-code";
import { tryCreateClient } from "@/lib/supabase/server";
import type { Lobby } from "@/types/game";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ code: string }>;
};

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
    .select("id, code, host_name, created_at, ends_at, status")
    .eq("code", code)
    .single();

  if (error || !data) notFound();

  const { data: results } = await supabase
    .from("lobby_results")
    .select(
      "id, player_name, score, total_pairs, time_seconds, question_set_title, finished_at",
    )
    .eq("lobby_id", data.id)
    .order("score", { ascending: false })
    .order("time_seconds", { ascending: true });

  const lobby: Lobby = {
    ...(data as Lobby),
    results: results ?? [],
  };

  return <LobbyRoom initialLobby={lobby} />;
}
