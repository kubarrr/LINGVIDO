"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Settings, Flame, Zap, BookOpen, Check, Plus, Trophy } from "lucide-react";
import { useProfile } from "@/context/ProfileContext";
import { LANGUAGES, getUserAppLevel } from "@/lib/constants";
import type { QuizLeaderboardEntry, LanguagePair } from "@/types";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BottomNav from "@/components/BottomNav";
import { useLanguageTheme } from "@/hooks/useLanguageTheme";

type Period = "daily" | "weekly" | "all";

export default function ProfilePage() {
  const { profile, loading, refresh } = useProfile();
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("daily");
  const [board, setBoard] = useState<QuizLeaderboardEntry[]>([]);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [switching, setSwitching] = useState(false);
  useLanguageTheme(profile?.target_language);

  useEffect(() => {
    setLoadingBoard(true);
    fetch(`/api/quiz-leaderboard?period=${period}`)
      .then((r) => r.json())
      .then((d) => setBoard(d.entries ?? []))
      .finally(() => setLoadingBoard(false));
  }, [period]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth");
  }

  async function switchLanguage(code: string) {
    if (!profile || code === profile.target_language || switching) return;
    const seen = new Set<string>();
    const all: LanguagePair[] = [
      { language: profile.target_language, level: profile.level },
      ...(profile.language_pairs ?? []),
    ].filter((p) => (seen.has(p.language) ? false : (seen.add(p.language), true)));

    const chosen = all.find((p) => p.language === code);
    if (!chosen) return;
    const newPairs = all.filter((p) => p.language !== code);

    setSwitching(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_language: code, level: chosen.level, language_pairs: newPairs }),
    });
    await refresh();
    setSwitching(false);
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-dvh">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full gradient-primary animate-spin glow-purple" />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col min-h-dvh">
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-muted-foreground">Couldn&apos;t load your profile.</p>
          <button onClick={() => refresh()} className="px-5 py-2.5 rounded-xl gradient-primary text-white font-medium">
            Retry
          </button>
          <button onClick={() => router.push("/auth")} className="text-primary text-sm underline">
            Sign in again
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  const seen = new Set<string>();
  const myLanguages: LanguagePair[] = [
    { language: profile.target_language, level: profile.level },
    ...(profile.language_pairs ?? []),
  ].filter((p) => (seen.has(p.language) ? false : (seen.add(p.language), true)));

  const appLevel = getUserAppLevel(profile.xp);
  const targetLang = LANGUAGES.find((l) => l.code === profile.target_language);

  return (
    <div className="flex flex-col min-h-dvh pt-safe page-enter">
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profile</h1>
        <button
          onClick={() => router.push("/settings")}
          className="w-9 h-9 rounded-xl glass border border-border flex items-center justify-center"
        >
          <Settings size={16} />
        </button>
      </div>

      {/* User card */}
      <div className="px-5 pb-4">
        <div className="glass rounded-3xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-2xl font-bold text-white glow-purple">
              {profile.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg">{profile.username}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm">{targetLang?.flag}</span>
                <span className="text-sm text-muted-foreground">{targetLang?.name}</span>
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-mono">
                  {profile.level}
                </span>
              </div>
            </div>
          </div>

          {/* XP bar (global across all languages & levels) */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground font-medium">{appLevel.name}</span>
              <span className="text-muted-foreground">{profile.xp} / {appLevel.next} XP</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${appLevel.progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full gradient-primary rounded-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <StatCard icon={<Flame size={18} className="text-orange-400" />} value={profile.streak} label="Streak" />
            <StatCard icon={<Zap size={18} className="text-yellow-400" />} value={profile.xp} label="XP" />
            <StatCard icon={<BookOpen size={18} className="text-primary" />} value={profile.lessons_count} label="Lessons" />
          </div>
        </div>
      </div>

      {/* My languages — tap to switch the active one (snaps & album follow it) */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">My languages</p>
          <button onClick={() => router.push("/settings")} className="text-xs text-primary flex items-center gap-1">
            <Plus size={13} /> Manage
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {myLanguages.map((pair) => {
            const lang = LANGUAGES.find((l) => l.code === pair.language);
            const active = pair.language === profile.target_language;
            return (
              <button
                key={pair.language}
                onClick={() => switchLanguage(pair.language)}
                disabled={switching}
                className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-sm transition-all disabled:opacity-60 ${
                  active
                    ? "gradient-primary text-white border-transparent glow-purple"
                    : "glass border-border text-foreground hover:border-primary/50"
                }`}
              >
                <span className="text-lg">{lang?.flag}</span>
                <span className="font-medium">{lang?.name}</span>
                <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${active ? "bg-white/20" : "bg-primary/15 text-primary"}`}>
                  {pair.level}
                </span>
                {active && <Check size={14} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quiz ranking (all languages & levels combined) */}
      <div className="px-5 pb-2 flex items-center gap-2">
        <Trophy size={16} className="text-yellow-400" />
        <h2 className="text-sm font-bold">Quiz ranking</h2>
      </div>
      <div className="px-5 pb-3">
        <div className="glass rounded-2xl p-1 flex gap-1">
          {([
            { key: "daily", label: "Today" },
            { key: "weekly", label: "This week" },
            { key: "all", label: "All time" },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                period === key ? "gradient-primary text-white" : "text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Ranking list */}
      <div className="flex-1 px-5 pb-24">
        <div className="flex flex-col gap-2">
          {loadingBoard ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 rounded-2xl bg-card animate-pulse" />
            ))
          ) : board.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No quiz scores yet. Be the first — play today&apos;s quiz! 🧠
            </div>
          ) : (
            board.map((entry, i) => (
              <motion.div
                key={entry.username + i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`glass rounded-2xl p-4 flex items-center gap-3 ${
                  entry.username === profile.username ? "border border-primary/40 glow-purple" : ""
                }`}
              >
                <div className={`w-8 text-center font-bold text-sm ${
                  i === 0 ? "text-yellow-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-600" : "text-muted-foreground"
                }`}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                </div>
                <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-sm font-bold text-white shrink-0">
                  {entry.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{entry.username}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-yellow-400">{entry.xp}</p>
                  <p className="text-xs text-muted-foreground">XP</p>
                </div>
              </motion.div>
            ))
          )}

          <button
            onClick={signOut}
            className="w-full py-3 rounded-2xl border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors mt-4"
          >
            Sign out
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="bg-secondary/50 rounded-2xl p-3 flex flex-col items-center gap-1">
      {icon}
      <p className="font-bold text-lg leading-none">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
