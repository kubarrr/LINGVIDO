"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LANGUAGES, LEVELS } from "@/lib/constants";
import type { Language, LanguageLevel } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/context/ProfileContext";

const steps = ["welcome", "native", "target", "level", "done"] as const;
type Step = typeof steps[number];

export default function OnboardingPage() {
  const router = useRouter();
  const { refresh } = useProfile();
  const [step, setStep] = useState<Step>("welcome");
  const [nativeLang, setNativeLang] = useState<Language | null>(null);
  const [targetLang, setTargetLang] = useState<Language | null>(null);
  const [level, setLevel] = useState<LanguageLevel | null>(null);
  const [saving, setSaving] = useState(false);

  const stepIndex = steps.indexOf(step);

  async function finish() {
    if (!nativeLang || !targetLang || !level) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          native_language: nativeLang.code,
          target_language: targetLang.code,
          level,
        }),
      });
      await refresh();
      router.push("/");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background pt-safe pb-safe px-6">
      {/* Progress dots */}
      {step !== "welcome" && step !== "done" && (
        <div className="flex gap-2 justify-center pt-6 pb-2">
          {["native", "target", "level"].map((s, i) => (
            <div
              key={s}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: stepIndex - 1 >= i ? "2rem" : "0.5rem",
                background: stepIndex - 1 >= i
                  ? "oklch(0.62 0.22 280)"
                  : "oklch(0.2 0.025 270)",
              }}
            />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === "welcome" && (
          <StepWrapper key="welcome">
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
              <div className="text-7xl mb-2">📸</div>
              <h1 className="text-4xl font-bold tracking-tight">
                <span style={{ background: "linear-gradient(135deg, oklch(0.62 0.22 280), oklch(0.72 0.18 310))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Lingvido
                </span>
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-xs">
                Snap a photo of anything around you. Get an instant language lesson about it.
              </p>
              <div className="grid grid-cols-3 gap-3 w-full max-w-xs mt-4">
                {["☕ Coffee", "🏥 Hospital", "🌳 Park"].map((ex) => (
                  <div key={ex} className="glass rounded-xl p-3 text-sm text-center text-muted-foreground">
                    {ex}
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => setStep("native")}
              className="w-full py-4 rounded-2xl font-semibold text-white gradient-primary glow-purple transition-transform active:scale-95"
            >
              Get started →
            </button>
          </StepWrapper>
        )}

        {step === "native" && (
          <StepWrapper key="native">
            <h2 className="text-2xl font-bold mt-6 mb-1">Your native language</h2>
            <p className="text-muted-foreground mb-6 text-sm">We'll translate everything into this language</p>
            <LanguageGrid
              languages={LANGUAGES}
              selected={nativeLang}
              onSelect={(l) => { setNativeLang(l); setTimeout(() => setStep("target"), 200); }}
            />
          </StepWrapper>
        )}

        {step === "target" && (
          <StepWrapper key="target">
            <h2 className="text-2xl font-bold mt-6 mb-1">Language to learn</h2>
            <p className="text-muted-foreground mb-6 text-sm">Which language are you learning?</p>
            <LanguageGrid
              languages={LANGUAGES.filter((l) => l.code !== nativeLang?.code)}
              selected={targetLang}
              onSelect={(l) => { setTargetLang(l); setTimeout(() => setStep("level"), 200); }}
            />
          </StepWrapper>
        )}

        {step === "level" && (
          <StepWrapper key="level">
            <h2 className="text-2xl font-bold mt-6 mb-1">Your level</h2>
            <p className="text-muted-foreground mb-6 text-sm">
              {targetLang?.flag} {targetLang?.name} — how advanced are you?
            </p>
            <div className="flex flex-col gap-3 flex-1">
              {LEVELS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { setLevel(l.code as LanguageLevel); setTimeout(() => setStep("done"), 150); }}
                  className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 ${
                    level === l.code
                      ? "border-primary bg-primary/10 glow-purple"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <div className="font-semibold">{l.label}</div>
                  <div className="text-sm text-muted-foreground">{l.description}</div>
                </button>
              ))}
            </div>
          </StepWrapper>
        )}

        {step === "done" && (
          <StepWrapper key="done">
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
              <div className="text-6xl badge-in">🎉</div>
              <h2 className="text-3xl font-bold">You're all set!</h2>
              <div className="glass rounded-2xl p-5 w-full max-w-xs flex flex-col gap-3">
                <Row label="Native" value={`${nativeLang?.flag} ${nativeLang?.name}`} />
                <Row label="Learning" value={`${targetLang?.flag} ${targetLang?.name}`} />
                <Row label="Level" value={level ?? ""} />
              </div>
              <p className="text-muted-foreground text-sm">
                Snap your first photo and start learning!
              </p>
            </div>
            <button
              onClick={finish}
              disabled={saving}
              className="w-full py-4 rounded-2xl font-semibold text-white gradient-primary glow-purple transition-transform active:scale-95 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Start learning 🚀"}
            </button>
          </StepWrapper>
        )}
      </AnimatePresence>
    </div>
  );
}

function StepWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex flex-col flex-1 gap-4"
    >
      {children}
    </motion.div>
  );
}

function LanguageGrid({
  languages, selected, onSelect,
}: {
  languages: Language[];
  selected: Language | null;
  onSelect: (l: Language) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 flex-1 overflow-y-auto">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => onSelect(lang)}
          className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all duration-200 ${
            selected?.code === lang.code
              ? "border-primary bg-primary/10 glow-purple"
              : "border-border bg-card hover:border-primary/50"
          }`}
        >
          <span className="text-2xl">{lang.flag}</span>
          <span className="font-medium text-sm leading-tight">{lang.name}</span>
        </button>
      ))}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
