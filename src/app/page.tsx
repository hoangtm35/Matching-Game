import { CreateLobbyForm } from "@/components/CreateLobbyForm";
import { JoinLobbyForm } from "@/components/JoinLobbyForm";

export default function Home() {
  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex min-h-full max-w-lg flex-col px-4 py-12">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            Matching Game
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Create a lobby, invite friends, compete on the same leaderboard
          </p>
        </header>

        <section className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="mb-4 text-lg font-medium">Create a lobby</h2>
          <CreateLobbyForm />
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="mb-4 text-lg font-medium">Join a lobby</h2>
          <JoinLobbyForm />
        </section>
      </div>
    </div>
  );
}
