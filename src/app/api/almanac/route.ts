import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateAlmanac } from "@/lib/almanac";

// GET /api/almanac?language=es&native=pl
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const language = searchParams.get("language");
  const native = searchParams.get("native") ?? "en";
  if (!language) return NextResponse.json({ error: "Missing language" }, { status: 400 });

  try {
    const almanac = await getOrCreateAlmanac(supabase, language, native);
    return NextResponse.json({ almanac });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
