import { WelcomeForm } from "@/components/WelcomeForm";
import { Leaderboard } from "@/components/Leaderboard";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex min-h-full max-w-lg flex-col px-4 py-12">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            Matching Game
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Match Section A to Section B · top 10 leaderboard
          </p>
        </header>

        <section className="mb-10 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="mb-4 text-lg font-medium">Play</h2>
          <WelcomeForm />
        </section>

        <section className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium">Leaderboard</h2>
            <span className="text-xs text-zinc-500">Top 10 · time</span>
          </div>
          <Leaderboard />
        </section>

        <footer className="mt-8 text-center text-xs text-zinc-600">
          <Link href="/play" className="hover:text-zinc-400">
            Continue last session →
          </Link>
        </footer>
      </div>
    </div>
  );
}
