"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Volume2, BookOpen, Wrench, Globe, Star,
  CalendarDays, ScrollText, User, MapPin, PartyPopper,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Lesson, Bilingual, PartOfSpeech } from "@/types";
import { BADGES } from "@/lib/constants";
import { toast } from "sonner";
import { useLanguageTheme } from "@/hooks/useLanguageTheme";

type Tab = "words" | "constructions" | "culture" | "history";
type DisplayMode = "native" | "both" | "target";

// Part-of-speech colour coding (works on light & dark themes)
const POS_STYLE: Record<PartOfSpeech, { text: string; bg: string; label: string }> = {
  noun:      { text: "text-sky-500",     bg: "bg-sky-500/15",     label: "noun" },
  verb:      { text: "text-emerald-500", bg: "bg-emerald-500/15", label: "verb" },
  adjective: { text: "text-amber-500",   bg: "bg-amber-500/15",   label: "adj" },
  adverb:    { text: "text-fuchsia-500", bg: "bg-fuchsia-500/15", label: "adv" },
  phrase:    { text: "text-rose-500",    bg: "bg-rose-500/15",    label: "phrase" },
  other:     { text: "text-foreground",  bg: "bg-muted",          label: "" },
};

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("words");
  const [mode, setMode] = useState<DisplayMode>("both");
  const [showXpBanner, setShowXpBanner] = useState(false);
  const [showBadges, setShowBadges] = useState(false);

  const xpEarned = parseInt(searchParams.get("xp") ?? "0");
  const newStreak = parseInt(searchParams.get("streak") ?? "0");
  const newBadgeIds = searchParams.get("badges")?.split(",").filter(Boolean) ?? [];
  const newBadges = BADGES.filter((b) => newBadgeIds.includes(b.id));
  const isNewLesson = xpEarned > 0;

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("lessons").select("*").eq("id", id).single();
      setLesson(data);
      setLoading(false);
      if (isNewLesson) {
        setTimeout(() => setShowXpBanner(true), 400);
        if (newBadges.length > 0) setTimeout(() => setShowBadges(true), 1200);
      }
    }
    load();
  }, [id]);

  useLanguageTheme(lesson?.target_language);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="w-12 h-12 rounded-full gradient-primary animate-spin glow-purple" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh gap-4">
        <p className="text-muted-foreground">Lesson not found</p>
        <button onClick={() => router.push("/")} className="text-primary underline">Go home</button>
      </div>
    );
  }

  function speak(text: string) {
    if ("speechSynthesis" in window) {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lesson!.target_language;
      window.speechSynthesis.speak(utter);
    } else {
      toast.info("Text-to-speech not supported in this browser");
    }
  }

  const history = lesson.lesson_extra?.history;
  const cultureBi: Bilingual = {
    native: lesson.cultural_note ?? "",
    target: lesson.lesson_extra?.cultural_note_target ?? "",
  };

  return (
    <div className="flex flex-col min-h-dvh pt-safe page-enter">
      {/* XP Banner */}
      <AnimatePresence>
        {showXpBanner && (
          <motion.div
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 glass rounded-2xl px-5 py-3 flex items-center gap-3 glow-purple border border-primary/30"
            onClick={() => setShowXpBanner(false)}
          >
            <Star size={18} className="text-yellow-400 fill-yellow-400" />
            <span className="font-semibold">+{xpEarned} XP earned!</span>
            {newStreak > 1 && <span className="text-sm text-muted-foreground">🔥 {newStreak} day streak</span>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Badge celebration */}
      <AnimatePresence>
        {showBadges && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/90 backdrop-blur flex flex-col items-center justify-center gap-6 px-6"
            onClick={() => setShowBadges(false)}
          >
            <h2 className="text-2xl font-bold">New badge{newBadges.length > 1 ? "s" : ""}!</h2>
            {newBadges.map((badge, i) => (
              <motion.div
                key={badge.id}
                initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: i * 0.15, type: "spring", stiffness: 200 }}
                className="glass rounded-2xl px-6 py-4 flex items-center gap-4 border border-primary/30 glow-purple"
              >
                <span className="text-4xl badge-in">{badge.icon}</span>
                <div>
                  <p className="font-bold">{badge.name}</p>
                  <p className="text-sm text-muted-foreground">{badge.description}</p>
                </div>
              </motion.div>
            ))}
            <p className="text-muted-foreground text-sm mt-2">Tap to continue</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="relative h-56 overflow-hidden">
        {lesson.image_url ? (
          <img src={lesson.image_url} alt={lesson.object_detected} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full gradient-primary flex items-end">
            {lesson.user_input && (
              <p className="text-white/90 text-sm italic leading-snug px-5 pb-20 line-clamp-3">“{lesson.user_input}”</p>
            )}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-9 h-9 rounded-full glass flex items-center justify-center border border-border"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="absolute bottom-4 left-5 right-5">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            {lesson.input_type === "voice" ? "Voice lesson about" : lesson.input_type === "text" ? "Text lesson about" : "Lesson about"}
          </span>
          <h1 className="text-2xl font-bold capitalize">{lesson.object_detected}</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 pt-4">
        <div className="glass rounded-2xl p-1 flex gap-1">
          {([
            { key: "words", icon: BookOpen, label: "Words" },
            { key: "constructions", icon: Wrench, label: "Grammar" },
            { key: "culture", icon: Globe, label: "Culture" },
            { key: "history", icon: CalendarDays, label: "Almanac" },
          ] as const).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl text-[11px] font-medium transition-all duration-200 ${
                activeTab === key ? "gradient-primary text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Display-language toggle */}
      <div className="px-5 pt-3 flex justify-end">
        <div className="glass rounded-xl p-0.5 flex gap-0.5 text-xs">
          {([
            { key: "native", label: lesson.native_language.toUpperCase() },
            { key: "both", label: `${lesson.native_language.toUpperCase()}+${lesson.target_language.toUpperCase()}` },
            { key: "target", label: lesson.target_language.toUpperCase() },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`px-2.5 py-1 rounded-lg font-mono font-semibold transition-all ${
                mode === key ? "gradient-primary text-white" : "text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-4">
        <AnimatePresence mode="wait">
          {/* WORDS */}
          {activeTab === "words" && (
            <motion.div key="words" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-3">
              {lesson.words.map((word, i) => {
                const pos = (word.pos ?? "other") as PartOfSpeech;
                const style = POS_STYLE[pos] ?? POS_STYLE.other;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className="glass rounded-2xl p-4 flex items-center gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-bold text-lg ${style.text}`}>{word.word}</span>
                        {style.label && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${style.bg} ${style.text}`}>
                            {style.label}
                          </span>
                        )}
                        <button onClick={() => speak(word.word)} className="text-muted-foreground hover:text-primary transition-colors">
                          <Volume2 size={14} />
                        </button>
                      </div>
                      {word.pronunciation && <p className="text-xs text-muted-foreground italic">{word.pronunciation}</p>}
                      {mode !== "target" && <p className="text-sm text-muted-foreground mt-0.5">{word.translation}</p>}
                    </div>
                    <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {i + 1}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* GRAMMAR */}
          {activeTab === "constructions" && (
            <motion.div key="constructions" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-3">
              {lesson.constructions.map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className="glass rounded-2xl p-4 flex flex-col gap-2"
                >
                  <div className="inline-flex self-start px-2 py-0.5 rounded-lg bg-primary/15 text-primary text-xs font-mono font-semibold">
                    {c.pattern}
                  </div>
                  <div className="flex items-start gap-2">
                    <button onClick={() => speak(c.example)} className="text-muted-foreground hover:text-primary mt-0.5 shrink-0">
                      <Volume2 size={14} />
                    </button>
                    <p className="font-medium">{c.example}</p>
                  </div>
                  {mode !== "target" && (
                    <p className="text-sm text-muted-foreground border-t border-border pt-2">{c.translation}</p>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* CULTURE */}
          {activeTab === "culture" && (
            <motion.div key="culture" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4">
              <div className="glass rounded-2xl p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🌍</span>
                  <h3 className="font-semibold text-base">Cultural Context</h3>
                </div>
                <Bi value={cultureBi} mode={mode} onSpeak={speak} />
              </div>
            </motion.div>
          )}

          {/* ALMANAC / HISTORY */}
          {activeTab === "history" && (
            <motion.div key="history" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4">
              {history ? (
                <>
                  {/* Calendar header */}
                  <div className="glass rounded-2xl overflow-hidden">
                    <div className="gradient-primary px-5 py-3 flex items-center gap-2 text-white">
                      <CalendarDays size={18} />
                      <span className="font-bold tracking-wide">{history.date_label}</span>
                    </div>
                    <div className="px-5 py-3 text-sm text-muted-foreground">
                      A page from the calendar — discover this country&apos;s heritage.
                    </div>
                  </div>

                  <AlmanacItem icon={<ScrollText size={16} />} title="On this day" value={history.on_this_day} mode={mode} onSpeak={speak} />
                  <AlmanacItem icon={<User size={16} />} title="Notable figure" value={history.figure} mode={mode} onSpeak={speak} />
                  <AlmanacItem icon={<MapPin size={16} />} title="Geography" value={history.geo_fact} mode={mode} onSpeak={speak} />
                  {history.holiday && (history.holiday.native || history.holiday.target) && (
                    <AlmanacItem icon={<PartyPopper size={16} />} title="Holiday & traditions" value={history.holiday} mode={mode} onSpeak={speak} />
                  )}
                </>
              ) : (
                <div className="glass rounded-2xl p-8 flex flex-col items-center gap-3 text-center">
                  <CalendarDays size={36} className="text-muted-foreground" />
                  <p className="text-muted-foreground text-sm">The almanac isn&apos;t available for this older lesson. New lessons include it!</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Done button */}
      <div className="px-5 pb-8">
        <button
          onClick={() => router.push("/")}
          className="w-full py-4 rounded-2xl font-semibold gradient-primary text-white glow-purple transition-transform active:scale-95"
        >
          Done — learn something new ✨
        </button>
      </div>
    </div>
  );
}

/** Renders a bilingual block according to the display mode. */
function Bi({ value, mode, onSpeak }: { value?: Bilingual; mode: DisplayMode; onSpeak?: (t: string) => void }) {
  if (!value) return null;
  const hasTarget = !!value.target?.trim();
  const hasNative = !!value.native?.trim();

  // Graceful fallback when one side is missing (e.g. older lessons)
  const showNative = (mode === "native" || mode === "both") ? hasNative : !hasTarget && hasNative;
  const showTarget = (mode === "target" || mode === "both") ? hasTarget : false;

  return (
    <div className="flex flex-col gap-2">
      {showNative && (
        <p className="text-base leading-relaxed text-foreground/90">{value.native}</p>
      )}
      {showTarget && (
        <div className={`flex items-start gap-2 ${showNative ? "border-t border-border pt-2" : ""}`}>
          {onSpeak && (
            <button onClick={() => onSpeak(value.target)} className="text-muted-foreground hover:text-primary mt-1 shrink-0">
              <Volume2 size={14} />
            </button>
          )}
          <p className={`text-base leading-relaxed ${showNative ? "text-primary italic" : "text-foreground/90"}`}>{value.target}</p>
        </div>
      )}
    </div>
  );
}

function AlmanacItem({
  icon, title, value, mode, onSpeak,
}: {
  icon: React.ReactNode;
  title: string;
  value: Bilingual;
  mode: DisplayMode;
  onSpeak: (t: string) => void;
}) {
  return (
    <div className="glass rounded-2xl p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <h4 className="text-xs uppercase tracking-wider font-semibold">{title}</h4>
      </div>
      <Bi value={value} mode={mode} onSpeak={onSpeak} />
    </div>
  );
}
