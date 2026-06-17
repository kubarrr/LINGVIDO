"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Settings, Flame, Zap, BookOpen } from "lucide-react";
import { useProfile } from "@/context/ProfileContext";
import { BADGES, LANGUAGES, getUserAppLevel } from "@/lib/constants";
import type { LeaderboardEntry } from "@/types";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BottomNav from "@/components/BottomNav";
import { useLanguageTheme } from "@/hooks/useLanguageTheme";

export default function ProfilePage() {
  const { profile } = useProfile();
  const router = useRouter();
  const [tab, setTab] = useState<"badges" | "leaderboard">("badges");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingBoard, setLoadingBoard] = useState(false);
  useLanguageTheme(profile?.target_language);

  useEffect(() => {
    if (tab === "leaderboard" && leaderboard.length === 0) {
      setLoadingBoard(true);
      fetch("/api/leaderboard")
        .then((r) => r.json())
        .then(setLeaderboard)
        .finally(() => setLoadingBoard(false));
    }
  }, [tab, leaderboard.length]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth");
  }

  if (!profile) return null;

  const appLevel = getUserAppLevel(profile.xp);
  const targetLang = LANGUAGES.find((l) => l.code === profile.target_language);
  const earnedBadges = BADGES.filter((b) => profile.badges.includes(b.id));
  const lockedBadges = BADGES.filter((b) => !profile.badges.includes(b.id));

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

          {/* XP bar */}
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

      {/* Tabs */}
      <div className="px-5 pb-4">
        <div className="glass rounded-2xl p-1 flex gap-1">
          {(["badges", "leaderboard"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                tab === t ? "gradient-primary text-white" : "text-muted-foreground"
              }`}
            >
              {t === "leaderboard" ? "🏆 Ranking" : "🎖️ Badges"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pb-24">
        {tab === "badges" && (
          <div className="flex flex-col gap-4">
            {earnedBadges.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Earned</p>
                <div className="grid grid-cols-2 gap-3">
                  {earnedBadges.map((badge, i) => (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.07 }}
                      className="glass rounded-2xl p-4 flex items-center gap-3 border border-primary/20"
                    >
                      <span className="text-2xl">{badge.icon}</span>
                      <div>
                        <p className="text-sm font-semibold leading-tight">{badge.name}</p>
                        <p className="text-xs text-muted-foreground">{badge.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {lockedBadges.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Locked</p>
                <div className="grid grid-cols-2 gap-3">
                  {lockedBadges.map((badge) => (
                    <div key={badge.id} className="rounded-2xl p-4 flex items-center gap-3 border border-border opacity-40">
                      <span className="text-2xl grayscale">{badge.icon}</span>
                      <div>
                        <p className="text-sm font-semibold leading-tight">{badge.name}</p>
                        <p className="text-xs text-muted-foreground">{badge.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={signOut}
              className="w-full py-3 rounded-2xl border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors mt-2"
            >
              Sign out
            </button>
          </div>
        )}

        {tab === "leaderboard" && (
          <div className="flex flex-col gap-2">
            {loadingBoard ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 rounded-2xl bg-card animate-pulse" />
              ))
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No data yet</div>
            ) : (
              leaderboard.map((entry, i) => (
                <motion.div
                  key={entry.username}
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
                    <p className="text-xs text-muted-foreground">🔥 {entry.streak} days</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-yellow-400">{entry.xp}</p>
                    <p className="text-xs text-muted-foreground">XP</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
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
