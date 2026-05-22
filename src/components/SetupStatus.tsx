"use client";

import { useEffect, useState } from "react";
import type { ConnectionStatus } from "@/lib/supabase/check-connection";
import type { DbStats } from "@/lib/supabase/db-stats";

export function SetupStatus() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [stats, setStats] = useState<DbStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const [checkRes, statsRes] = await Promise.all([
        fetch("/api/supabase-check"),
        fetch("/api/db-stats"),
      ]);
      const checkData = (await checkRes.json()) as ConnectionStatus;
      const statsData = await statsRes.json();
      if (!cancelled) {
        setStatus(checkData);
        if (statsData && !statsData.error) {
          setStats(statsData as DbStats);
        }
        setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Checking Supabase connection…
      </p>
    );
  }

  if (!status) return null;

  const styles: Record<ConnectionStatus["state"], string> = {
    missing_env:
      "border-amber-500/40 bg-amber-500/10 text-amber-100",
    connected:
      "border-emerald-500/40 bg-emerald-500/10 text-emerald-100",
    connected_pending_schema:
      "border-sky-500/40 bg-sky-500/10 text-sky-100",
    error: "border-red-500/40 bg-red-500/10 text-red-100",
  };

  const labels: Record<ConnectionStatus["state"], string> = {
    missing_env: "Env vars missing",
    connected: "Supabase ready",
    connected_pending_schema: "Supabase connected",
    error: "Connection error",
  };

  return (
    <div className="space-y-3">
      <div
        className={`rounded-lg border px-4 py-3 text-sm ${styles[status.state]}`}
      >
        <p className="font-medium">{labels[status.state]}</p>
        {"message" in status && status.message && (
          <p className="mt-1 opacity-90">{status.message}</p>
        )}
        {status.state === "missing_env" && (
          <ol className="mt-2 list-inside list-decimal space-y-1 opacity-90">
            <li>
              Copy{" "}
              <code className="rounded bg-black/30 px-1">
                .env.local.example
              </code>{" "}
              to <code className="rounded bg-black/30 px-1">.env.local</code>
            </li>
            <li>
              In Supabase: Project Settings → API → copy URL and anon key
            </li>
            <li>Restart the dev server</li>
          </ol>
        )}
        {status.state === "connected_pending_schema" && (
          <p className="mt-2 opacity-90">
            Run <code className="rounded bg-black/30 px-1">001_schema.sql</code>{" "}
            then <code className="rounded bg-black/30 px-1">002_seed.sql</code>{" "}
            in Supabase SQL Editor (see <code className="rounded bg-black/30 px-1">supabase/README.md</code>).
          </p>
        )}
      </div>

      {stats && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-300">
          <p className="font-medium text-zinc-100">Database</p>
          <ul className="mt-2 space-y-1">
            <li>Question sets: {stats.questionSets}</li>
            <li>Options: {stats.options}</li>
            <li>Scores: {stats.scores}</li>
          </ul>
        </div>
      )}
    </div>
  );
}
