import { getDbStats } from "@/lib/supabase/db-stats";
import { NextResponse } from "next/server";

export async function GET() {
  const stats = await getDbStats();
  return NextResponse.json(stats ?? { error: "unavailable" });
}
