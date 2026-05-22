import { checkSupabaseConnection } from "@/lib/supabase/check-connection";
import { NextResponse } from "next/server";

export async function GET() {
  const status = await checkSupabaseConnection();
  return NextResponse.json(status);
}
