import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { QuizLeaderboardEntry } from "@/types";

// GET /api/quiz-leaderboard?period=daily|weekly|all
// Ranking is by quiz XP summed across ALL languages and levels.
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const period = req.nextUrl.searchParams.get("period") ?? "daily";

  let since: string | null = null;
  if (period === "daily") {
    since = new Date().toISOString().slice(0, 10); // today (date) — compared against day column
  } else if (period === "weekly") {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    since = d.toISOString().slice(0, 10);
  }

  let query = supabase.from("quiz_scores").select("user_id, xp, day");
  if (since) query = query.gte("day", since);
  const { data: rows, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sum XP per user
  const totals = new Map<string, number>();
  for (const r of rows ?? []) {
    totals.set(r.user_id, (totals.get(r.user_id) ?? 0) + (r.xp ?? 0));
  }

  if (totals.size === 0) return NextResponse.json({ entries: [] });

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", [...totals.keys()]);

  const entries: QuizLeaderboardEntry[] = (profiles ?? [])
    .map((p) => ({
      username: p.username as string,
      avatar_url: (p.avatar_url as string) ?? undefined,
      xp: totals.get(p.id as string) ?? 0,
    }))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 100)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  return NextResponse.json({ entries });
}
