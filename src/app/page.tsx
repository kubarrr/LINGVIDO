"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Image as ImageIcon, X, Zap, Upload, ChevronDown, Plus, Check } from "lucide-react";
import { useProfile } from "@/context/ProfileContext";
import { toast } from "sonner";
import { LANGUAGES, LEVELS } from "@/lib/constants";
import type { LanguagePair, LanguageLevel } from "@/types";
import BottomNav from "@/components/BottomNav";
import { useLanguageTheme } from "@/hooks/useLanguageTheme";

type State = "idle" | "preview" | "analyzing";

export default function HomePage() {
  const router = useRouter();
  const { profile, refresh } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<State>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showAddPair, setShowAddPair] = useState(false);
  const [newLang, setNewLang] = useState("");
  const [newLevel, setNewLevel] = useState<LanguageLevel>("A1");

  // Active pair for this lesson — defaults to profile settings
  const [activePair, setActivePair] = useState<LanguagePair | null>(null);

  const pairs: LanguagePair[] = profile
    ? [
        { language: profile.target_language, level: profile.level },
        ...(profile.language_pairs ?? []).filter(
          (p) => p.language !== profile.target_language
        ),
      ]
    : [];

  const currentPair = activePair ?? pairs[0] ?? { language: "en", level: "A1" as LanguageLevel };
  const currentLang = LANGUAGES.find((l) => l.code === currentPair.language);
  useLanguageTheme(currentPair.language);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please select an image"); return; }
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setState("preview");
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const analyze = async () => {
    if (!imageFile) { toast.error("No image selected"); return; }
    if (!profile) { toast.error("Profile not loaded — try refreshing"); return; }
    setState("analyzing");

    const form = new FormData();
    form.append("image", imageFile);
    form.append("targetLanguage", currentPair.language);
    form.append("nativeLanguage", profile.native_language);
    form.append("level", currentPair.level);

    try {
      const res = await fetch("/api/analyze", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Something went wrong"); setState("preview"); return; }
      router.push(`/lesson/${data.lesson.id}?xp=${data.xpEarned}&streak=${data.newStreak}&badges=${(data.newBadges ?? []).join(",")}`);
    } catch {
      toast.error("Network error. Please try again.");
      setState("preview");
    }
  };

  const reset = () => {
    setState("idle");
    setPreview(null);
    setImageFile(null);
  };

  const addLanguagePair = async () => {
    if (!newLang || !profile) return;
    const existing = pairs.find((p) => p.language === newLang);
    if (existing) { toast.error("This language is already added"); return; }

    const updatedPairs = [...(profile.language_pairs ?? []), { language: newLang, level: newLevel }];
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language_pairs: updatedPairs }),
    });
    await refresh();
    setNewLang("");
    setShowAddPair(false);
    toast.success(`${LANGUAGES.find((l) => l.code === newLang)?.name} added!`);
  };

  return (
    <div className="flex flex-col min-h-dvh pt-safe">
      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            <span style={{ background: "linear-gradient(135deg, var(--lang-from), var(--lang-to))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Lingvido
            </span>
          </h1>
        </div>
        {profile && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-sm font-semibold">
              <span className="streak-fire text-base">🔥</span>
              <span>{profile.streak}</span>
            </div>
            <div className="flex items-center gap-1 text-sm font-semibold text-yellow-400">
              <Zap size={14} />
              <span>{profile.xp}</span>
            </div>
          </div>
        )}
      </div>

      {/* Language switcher */}
      {profile && (
        <div className="px-5 pb-3">
          <div className="relative">
            <button
              onClick={() => setShowLangPicker((v) => !v)}
              className="glass rounded-2xl px-4 py-2.5 flex items-center gap-2 border border-border w-full text-left"
            >
              <span className="text-xl">{currentLang?.flag}</span>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm">{currentLang?.name}</span>
                <span className="ml-2 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-md font-mono">{currentPair.level}</span>
              </div>
              <ChevronDown size={16} className={`text-muted-foreground transition-transform ${showLangPicker ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {showLangPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-2 glass border border-border rounded-2xl overflow-hidden z-30 shadow-xl"
                >
                  {pairs.map((pair) => {
                    const lang = LANGUAGES.find((l) => l.code === pair.language);
                    const isActive = pair.language === currentPair.language && pair.level === currentPair.level;
                    return (
                      <button
                        key={pair.language}
                        onClick={() => { setActivePair(pair); setShowLangPicker(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isActive ? "bg-primary/10" : "hover:bg-accent"}`}
                      >
                        <span className="text-xl">{lang?.flag}</span>
                        <div className="flex-1">
                          <span className="font-medium text-sm">{lang?.name}</span>
                          <span className="ml-2 text-xs bg-primary/15 text-primary px-1.5 py-0.5 rounded font-mono">{pair.level}</span>
                        </div>
                        {isActive && <Check size={14} className="text-primary" />}
                      </button>
                    );
                  })}

                  {/* Add new language */}
                  {!showAddPair ? (
                    <button
                      onClick={() => setShowAddPair(true)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-accent border-t border-border"
                    >
                      <Plus size={16} />
                      <span className="text-sm">Add language</span>
                    </button>
                  ) : (
                    <div className="p-3 border-t border-border flex flex-col gap-2">
                      <select
                        value={newLang}
                        onChange={(e) => setNewLang(e.target.value)}
                        className="bg-secondary rounded-xl px-3 py-2 text-sm outline-none w-full border border-border"
                      >
                        <option value="">Select language...</option>
                        {LANGUAGES.filter((l) => !pairs.find((p) => p.language === l.code) && l.code !== profile.native_language).map((l) => (
                          <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
                        ))}
                      </select>
                      <select
                        value={newLevel}
                        onChange={(e) => setNewLevel(e.target.value as LanguageLevel)}
                        className="bg-secondary rounded-xl px-3 py-2 text-sm outline-none w-full border border-border"
                      >
                        {LEVELS.map((l) => (
                          <option key={l.code} value={l.code}>{l.label}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button onClick={() => setShowAddPair(false)} className="flex-1 py-2 rounded-xl border border-border text-sm text-muted-foreground">
                          Cancel
                        </button>
                        <button onClick={addLanguagePair} disabled={!newLang} className="flex-1 py-2 rounded-xl gradient-primary text-white text-sm font-medium disabled:opacity-40">
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col px-5 pb-24 gap-4" onClick={() => showLangPicker && setShowLangPicker(false)}>
        <AnimatePresence mode="wait">
          {state === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="flex-1 flex flex-col gap-4">
              <div
                className="flex-1 glass rounded-3xl flex flex-col items-center justify-center gap-5 cursor-pointer active:scale-[0.98] transition-transform border border-dashed border-primary/30 min-h-64"
                onClick={() => fileInputRef.current?.click()}
                onDrop={onDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center camera-btn glow-purple">
                  <Camera size={32} className="text-white" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-lg">Take or upload a photo</p>
                  <p className="text-muted-foreground text-sm mt-1">Anything around you — food, places, objects</p>
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  {["☕ Coffee", "📚 Books", "🌿 Plants"].map((ex) => (
                    <span key={ex} className="glass px-3 py-1.5 rounded-full">{ex}</span>
                  ))}
                </div>
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
              <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

              <button
                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-border text-sm text-muted-foreground hover:border-primary/50 transition-colors"
                onClick={() => galleryInputRef.current?.click()}
              >
                <ImageIcon size={16} />
                Choose from gallery
              </button>
            </motion.div>
          )}

          {(state === "preview" || state === "analyzing") && preview && (
            <motion.div key="preview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex-1 flex flex-col gap-4">
              <div className="relative rounded-3xl overflow-hidden flex-1 min-h-72">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                {state === "analyzing" && (
                  <div className="absolute inset-0 bg-background/75 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center glow-purple">
                      <span className="text-2xl">✨</span>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">Analyzing image...</p>
                      <p className="text-muted-foreground text-sm">Creating your {currentLang?.name} lesson</p>
                    </div>
                  </div>
                )}
                {state !== "analyzing" && (
                  <button onClick={reset} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-background/80 backdrop-blur flex items-center justify-center border border-border">
                    <X size={16} />
                  </button>
                )}
              </div>
              {state !== "analyzing" && (
                <button onClick={analyze} className="w-full py-4 rounded-2xl font-semibold text-white gradient-primary glow-purple transition-transform active:scale-95 flex items-center justify-center gap-2">
                  <Upload size={18} />
                  Generate {currentLang?.flag} lesson
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {state === "idle" && (
          <div className="glass rounded-2xl p-4">
            <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wider">Tips</p>
            <ul className="text-sm text-muted-foreground flex flex-col gap-1.5">
              <li>📍 Snap objects in cafés, parks, stores</li>
              <li>🎯 Better lighting = better recognition</li>
              <li>🔥 Daily lessons keep your streak alive</li>
            </ul>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
