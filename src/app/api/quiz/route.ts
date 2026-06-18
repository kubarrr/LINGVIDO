import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateAlmanac, todayKey } from "@/lib/almanac";
import { generateQuiz } from "@/lib/gemini";
import { XP_PER_QUIZ_CORRECT } from "@/lib/constants";
import type { Quiz } from "@/types";

async function getOrCreateQuiz(
  supabase: Awaited<ReturnType<typeof createClient>>,
  language: string,
  native: string,
): Promise<Quiz> {
  const today = todayKey();

  const { data: existing } = await supabase
    .from("quizzes")
    .select("content")
    .eq("target_language", language)
    .eq("native_language", native)
    .eq("day", today)
    .maybeSingle();

  if (existing?.content) return existing.content as Quiz;

  const almanac = await getOrCreateAlmanac(supabase, language, native);
  const content = await generateQuiz({ targetLanguage: language, nativeLanguage: native, almanac });

  await supabase
    .from("quizzes")
    .delete()
    .eq("target_language", language)
    .eq("native_language", native)
    .neq("day", today);

  await supabase
    .from("quizzes")
    .upsert(
      { target_language: language, native_language: native, day: today, content },
      { onConflict: "target_language,native_language,day" },
    );

  return content;
}

// GET /api/quiz?language=es&native=pl  → today's quiz + whether already played
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const language = searchParams.get("language");
  const native = searchParams.get("native") ?? "en";
  if (!language) return NextResponse.json({ error: "Missing language" }, { status: 400 });

  const today = todayKey();
  const { data: existingScore } = await supabase
    .from("quiz_scores")
    .select("correct,total,xp")
    .eq("user_id", user.id)
    .eq("target_language", language)
    .eq("day", today)
    .maybeSingle();

  try {
    const quiz = await getOrCreateQuiz(supabase, language, native);
    return NextResponse.json({
      quiz,
      done: !!existingScore,
      score: existingScore ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/quiz  body: { language, native, answers: number[] }
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { language, native = "en", answers } = await req.json();
  if (!language || !Array.isArray(answers)) {
    return NextResponse.json({ error: "Missing language or answers" }, { status: 400 });
  }

  const today = todayKey();

  // Already played today for this language?
  const { data: existingScore } = await supabase
    .from("quiz_scores")
    .select("id")
    .eq("user_id", user.id)
    .eq("target_language", language)
    .eq("day", today)
    .maybeSingle();
  if (existingScore) {
    return NextResponse.json({ error: "Already played today" }, { status: 409 });
  }

  // Score against the cached quiz (authoritative)
  const { data: quizRow } = await supabase
    .from("quizzes")
    .select("content")
    .eq("target_language", language)
    .eq("native_language", native)
    .eq("day", today)
    .maybeSingle();

  if (!quizRow?.content) {
    return NextResponse.json({ error: "Quiz not found — reload and try again" }, { status: 400 });
  }

  const quiz = quizRow.content as Quiz;
  const total = quiz.questions.length;
  let correct = 0;
  const correctIndexes = quiz.questions.map((q) => q.correct);
  quiz.questions.forEach((q, i) => { if (answers[i] === q.correct) correct++; });
  const xp = correct * XP_PER_QUIZ_CORRECT;

  // Record score
  await supabase.from("quiz_scores").insert({
    user_id: user.id,
    day: today,
    target_language: language,
    correct,
    total,
    xp,
  });

  // Add to the player's global XP
  const { data: profile } = await supabase.from("profiles").select("xp").eq("id", user.id).single();
  if (profile) {
    await supabase.from("profiles").update({ xp: (profile.xp ?? 0) + xp }).eq("id", user.id);
  }

  return NextResponse.json({ correct, total, xp, correctIndexes });
}
