import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateAlmanac } from "@/lib/gemini";

// GET /api/almanac?language=es&native=pl
// Returns today's almanac for the language pair, generating & caching it once
// per day. Older days are deleted so only the current page is kept.
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const language = searchParams.get("language");
  const native = searchParams.get("native") ?? "en";
  if (!language) return NextResponse.json({ error: "Missing language" }, { status: 400 });

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (server-local)

  // Already have today's page?
  const { data: existing } = await supabase
    .from("almanacs")
    .select("content")
    .eq("target_language", language)
    .eq("native_language", native)
    .eq("day", today)
    .maybeSingle();

  if (existing?.content) {
    return NextResponse.json({ almanac: existing.content });
  }

  // Generate a fresh page for today
  const label = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long" });
  let content;
  try {
    content = await generateAlmanac({ targetLanguage: language, nativeLanguage: native, today: label });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Drop previous days for this pair, then store today's
  await supabase
    .from("almanacs")
    .delete()
    .eq("target_language", language)
    .eq("native_language", native)
    .neq("day", today);

  // Upsert avoids a race if two requests generate at once
  await supabase
    .from("almanacs")
    .upsert(
      { target_language: language, native_language: native, day: today, content },
      { onConflict: "target_language,native_language,day" }
    );

  return NextResponse.json({ almanac: content });
}
