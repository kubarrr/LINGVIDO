import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateLesson } from "@/lib/gemini";
import { BADGES, XP_PER_LESSON, XP_PER_WORD, XP_STREAK_BONUS } from "@/lib/constants";
import type { LanguageLevel, LessonInputType, UserProfile } from "@/types";

const RATE_LIMIT_PER_DAY = 20;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Rate limiting: count today's lessons
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("lessons")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", todayStart.toISOString());

    if ((count ?? 0) >= RATE_LIMIT_PER_DAY) {
      return NextResponse.json({ error: "Daily limit reached (20 lessons/day)" }, { status: 429 });
    }

    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    const userText = (formData.get("text") as string | null)?.trim() || null;
    const inputType = (formData.get("inputType") as LessonInputType) ?? "photo";
    const targetLanguage = formData.get("targetLanguage") as string;
    const nativeLanguage = formData.get("nativeLanguage") as string;
    const level = formData.get("level") as LanguageLevel;

    if (!targetLanguage || !nativeLanguage || !level) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!file && !userText) {
      return NextResponse.json({ error: "Provide a photo or some text" }, { status: 400 });
    }

    // Convert image (if any) to base64
    let base64: string | undefined;
    if (file) {
      const bytes = await file.arrayBuffer();
      base64 = Buffer.from(bytes).toString("base64");
    }

    // Gather recently covered topics for this language so the model picks
    // something fresh instead of repeating "person", "tree", etc.
    const { data: recent } = await supabase
      .from("lessons")
      .select("object_detected")
      .eq("user_id", user.id)
      .eq("target_language", targetLanguage)
      .order("created_at", { ascending: false })
      .limit(15);
    const avoidTopics = (recent ?? [])
      .map((r) => r.object_detected as string)
      .filter(Boolean);

    // Generate lesson via OpenRouter
    const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long" });
    const lessonData = await generateLesson({
      imageBase64: base64,
      mimeType: file?.type,
      userText: userText ?? undefined,
      targetLanguage,
      nativeLanguage,
      level,
      avoidTopics,
      today,
    });

    // Upload image to Supabase Storage (only when a photo was provided)
    let publicUrl: string | null = null;
    if (file && base64) {
      const fileName = `${user.id}/${Date.now()}.${file.type.split("/")[1]}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("lesson-images")
        .upload(fileName, file, { contentType: file.type });
      if (uploadError) throw uploadError;
      publicUrl = supabase.storage.from("lesson-images").getPublicUrl(uploadData.path).data.publicUrl;
    }

    // Calculate XP
    const xpEarned = XP_PER_LESSON + lessonData.words.length * XP_PER_WORD;

    // Save lesson
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .insert({
        user_id: user.id,
        image_url: publicUrl,
        user_input: userText,
        input_type: inputType,
        object_detected: lessonData.object_detected,
        target_language: targetLanguage,
        native_language: nativeLanguage,
        level,
        words: lessonData.words,
        constructions: lessonData.constructions,
        cultural_note: lessonData.cultural_note,
        lesson_extra: {
          cultural_note_target: lessonData.cultural_note_target,
          history: lessonData.history,
        },
        xp_earned: xpEarned,
      })
      .select()
      .single();

    if (lessonError) throw lessonError;

    // Update profile: XP, streak, badges, lessons_count
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profile) {
      const now = new Date();
      const lastLesson = profile.last_lesson_at ? new Date(profile.last_lesson_at) : null;
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      let newStreak = profile.streak;
      let streakBonus = 0;

      if (!lastLesson) {
        newStreak = 1;
      } else {
        const lastDate = lastLesson.toDateString();
        const todayDate = now.toDateString();
        const yesterdayDate = yesterday.toDateString();

        if (lastDate === todayDate) {
          // Already did a lesson today, keep streak
        } else if (lastDate === yesterdayDate) {
          newStreak = profile.streak + 1;
          streakBonus = XP_STREAK_BONUS;
        } else {
          newStreak = 1; // Streak broken
        }
      }

      const newXp = profile.xp + xpEarned + streakBonus;
      const newLessonsCount = profile.lessons_count + 1;

      // Check for new badges
      const updatedProfile: UserProfile = {
        ...profile,
        xp: newXp,
        streak: newStreak,
        lessons_count: newLessonsCount,
      };
      const earnedBadgeIds = BADGES
        .filter((b) => !profile.badges.includes(b.id) && b.condition(updatedProfile))
        .map((b) => b.id);

      await supabase
        .from("profiles")
        .update({
          xp: newXp,
          streak: newStreak,
          last_lesson_at: now.toISOString(),
          streak_updated_at: now.toISOString(),
          lessons_count: newLessonsCount,
          badges: [...profile.badges, ...earnedBadgeIds],
        })
        .eq("id", user.id);

      return NextResponse.json({
        lesson,
        xpEarned: xpEarned + streakBonus,
        streakBonus,
        newStreak,
        newBadges: earnedBadgeIds,
      });
    }

    return NextResponse.json({ lesson, xpEarned });
  } catch (error) {
    // Supabase errors are plain objects with message/code/details/hint —
    // not Error instances, so handle both shapes.
    let message: string;
    if (error instanceof Error) {
      message = error.message;
    } else if (error && typeof error === "object") {
      const e = error as { message?: string; details?: string; hint?: string; code?: string };
      message = e.message ?? e.details ?? e.hint ?? JSON.stringify(error);
      if (e.code) message = `[${e.code}] ${message}`;
    } else {
      message = String(error);
    }
    console.error("Analyze error:", JSON.stringify(error, Object.getOwnPropertyNames(error ?? {})));
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
