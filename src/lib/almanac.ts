import type { SupabaseClient } from "@supabase/supabase-js";
import { generateAlmanac } from "@/lib/gemini";
import type { LessonHistory } from "@/types";

/** Today's date as YYYY-MM-DD (server-local). */
export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Returns today's almanac for a language pair, generating & caching it once
 * per day and deleting previous days. Shared by /api/almanac and /api/quiz.
 */
export async function getOrCreateAlmanac(
  supabase: SupabaseClient,
  language: string,
  native: string,
): Promise<LessonHistory> {
  const today = todayKey();

  const { data: existing } = await supabase
    .from("almanacs")
    .select("content")
    .eq("target_language", language)
    .eq("native_language", native)
    .eq("day", today)
    .maybeSingle();

  if (existing?.content) return existing.content as LessonHistory;

  const label = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long" });
  const content = await generateAlmanac({ targetLanguage: language, nativeLanguage: native, today: label });

  await supabase
    .from("almanacs")
    .delete()
    .eq("target_language", language)
    .eq("native_language", native)
    .neq("day", today);

  await supabase
    .from("almanacs")
    .upsert(
      { target_language: language, native_language: native, day: today, content },
      { onConflict: "target_language,native_language,day" },
    );

  return content;
}
