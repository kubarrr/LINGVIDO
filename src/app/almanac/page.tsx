"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, ScrollText, User, MapPin, Volume2 } from "lucide-react";
import { useProfile } from "@/context/ProfileContext";
import { useLanguageTheme } from "@/hooks/useLanguageTheme";
import { LANGUAGES } from "@/lib/constants";
import type { Bilingual, LessonHistory } from "@/types";
import BottomNav from "@/components/BottomNav";

type DisplayMode = "both" | "target";

export default function AlmanacPage() {
  const { profile } = useProfile();
  const [almanac, setAlmanac] = useState<LessonHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<DisplayMode>("both");

  const target = profile?.target_language;
  const native = profile?.native_language;
  useLanguageTheme(target);
  const lang = LANGUAGES.find((l) => l.code === target);

  useEffect(() => {
    if (!target || !native) return;
    setLoading(true);
    setAlmanac(null);
    fetch(`/api/almanac?language=${target}&native=${native}`)
      .then((r) => r.json())
      .then((d) => { if (d.almanac) setAlmanac(d.almanac); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [target, native]);

  function speak(text: string) {
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = target ?? "en";
      window.speechSynthesis.speak(u);
    }
  }

  return (
    <div className="flex flex-col min-h-dvh pt-safe page-enter">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Almanac</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {lang?.flag} A daily page about {lang?.name}
          </p>
        </div>
        {almanac && (
          <div className="glass rounded-xl p-0.5 flex gap-0.5 text-xs border border-border">
            {([
              { key: "both", label: `${native?.toUpperCase()}+${target?.toUpperCase()}` },
              { key: "target", label: target?.toUpperCase() },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`px-2.5 py-1 rounded-lg font-mono font-semibold transition-all ${
                  mode === key ? "bg-primary/15 text-primary" : "text-muted-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 px-5 pb-24 flex flex-col gap-4">
        {loading ? (
          <div className="glass rounded-2xl p-10 flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full gradient-primary animate-spin glow-purple" />
            <p className="text-sm text-muted-foreground">Turning today&apos;s calendar page…</p>
          </div>
        ) : almanac ? (
          <>
            {/* Calendar date — subtle, paper-like */}
            <div className="glass rounded-2xl px-5 py-4 flex items-center gap-3 border border-border">
              <div className="w-11 h-11 rounded-xl bg-primary/12 flex items-center justify-center text-primary shrink-0">
                <CalendarDays size={20} />
              </div>
              <div>
                <p className="text-lg font-bold leading-tight">{almanac.date_label}</p>
                <p className="text-xs text-muted-foreground">A page from {lang?.name}&apos;s calendar</p>
              </div>
            </div>

            <Item index={0} icon={<ScrollText size={16} />} title="On this day" value={almanac.on_this_day} mode={mode} onSpeak={speak} />
            <Item index={1} icon={<User size={16} />} title="Notable figure" value={almanac.figure} mode={mode} onSpeak={speak} />
            <Item index={2} icon={<MapPin size={16} />} title="Geography" value={almanac.geo_fact} mode={mode} onSpeak={speak} />
          </>
        ) : (
          <div className="glass rounded-2xl p-8 flex flex-col items-center gap-3 text-center">
            <CalendarDays size={36} className="text-muted-foreground" />
            <p className="text-muted-foreground text-sm">Couldn&apos;t load today&apos;s almanac. Try again in a moment.</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function Item({
  index, icon, title, value, mode, onSpeak,
}: {
  index: number;
  icon: React.ReactNode;
  title: string;
  value: Bilingual;
  mode: DisplayMode;
  onSpeak: (t: string) => void;
}) {
  const hasTarget = !!value.target?.trim();
  const hasNative = !!value.native?.trim();
  const showNative = mode === "both" && hasNative;
  const showTarget = hasTarget || !hasNative;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}
      className="glass rounded-2xl p-4 flex flex-col gap-2"
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <h4 className="text-xs uppercase tracking-wider font-semibold">{title}</h4>
      </div>
      {showNative && <p className="text-[15px] leading-relaxed text-foreground/90">{value.native}</p>}
      {showTarget && (
        <div className={`flex items-start gap-2 ${showNative ? "border-t border-border pt-2 mt-0.5" : ""}`}>
          <button onClick={() => onSpeak(value.target)} className="text-muted-foreground hover:text-primary mt-1 shrink-0">
            <Volume2 size={14} />
          </button>
          <p className={`text-[15px] leading-relaxed ${showNative ? "text-foreground/70 italic" : "text-foreground/90"}`}>
            {value.target || value.native}
          </p>
        </div>
      )}
    </motion.div>
  );
}
