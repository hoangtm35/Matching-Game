import { MatchingGame } from "@/components/MatchingGame";
import Link from "next/link";

export default function PlayPage() {
  return (
    <div className="flex min-h-full flex-col bg-zinc-950 text-zinc-100">
      <nav className="border-b border-zinc-800 px-4 py-3">
        <Link
          href="/"
          className="text-sm text-zinc-400 transition-colors hover:text-zinc-200"
        >
          ← Home
        </Link>
      </nav>
      <MatchingGame />
    </div>
  );
}
