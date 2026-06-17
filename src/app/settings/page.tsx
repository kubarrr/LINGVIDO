"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Trash2, Check, Globe } from "lucide-react";
import { useProfile } from "@/context/ProfileContext";
import { LANGUAGES, LEVELS } from "@/lib/constants";
import { useLanguageTheme } from "@/hooks/useLanguageTheme";
import type { LanguagePair, LanguageLevel } from "@/types";
import { toast } from "sonner";

export default function SettingsPage() {
  const router = useRouter();
  const { profile, refresh } = useProfile();

  const [username, setUsername] = useState("");
  const [nativeLanguage, setNativeLanguage] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("");
  const [level, setLevel] = useState<LanguageLevel>("A1");
  const [extraPairs, setExtraPairs] = useState<LanguagePair[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newLang, setNewLang] = useState("");
  const [newLevel, setNewLevel] = useState<LanguageLevel>("A1");
  const [saving, setSaving] = useState(false);

  // Seed local state once the profile loads
  useEffect(() => {
    if (!profile) return;
    setUsername(profile.username);
    setNativeLanguage(profile.native_language);
    setTargetLanguage(profile.target_language);
    setLevel(profile.level);
    setExtraPairs(profile.language_pairs ?? []);
  }, [profile]);

  // Live preview of the theme as the primary language changes
  useLanguageTheme(targetLanguage);

  if (!profile) return null;

  // Languages already in use (primary + extras) — can't be added again
  const usedCodes = new Set([targetLanguage, ...extraPairs.map((p) => p.language)]);

  function addPair() {
    if (!newLang) return;
    if (usedCodes.has(newLang)) {
      toast.error("This language is already in your list");
      return;
    }
    setExtraPairs((prev) => [...prev, { language: newLang, level: newLevel }]);
    setNewLang("");
    setNewLevel("A1");
    setShowAdd(false);
  }

  function removePair(code: string) {
    setExtraPairs((prev) => prev.filter((p) => p.language !== code));
  }

  function setPairLevel(code: string, lvl: LanguageLevel) {
    setExtraPairs((prev) => prev.map((p) => (p.language === code ? { ...p, level: lvl } : p)));
  }

  async function save() {
    if (username.trim().length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }
    if (targetLanguage === nativeLanguage) {
      toast.error("Target and native language can't be the same");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          native_language: nativeLanguage,
          target_language: targetLanguage,
          level,
          language_pairs: extraPairs,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Could not save changes");
        return;
      }
      await refresh();
      toast.success("Profile updated");
      router.push("/profile");
    } catch {
      toast.error("Network error — try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col min-h-dvh pt-safe page-enter">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl glass border border-border flex items-center justify-center"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="flex-1 px-5 pb-28 flex flex-col gap-5">
        {/* Account */}
        <Section title="Account">
          <label className="text-xs text-muted-foreground font-medium">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="glass rounded-2xl px-4 py-3 text-sm outline-none border border-border focus:border-primary transition-colors"
          />

          <label className="text-xs text-muted-foreground font-medium mt-1">Native language</label>
          <select
            value={nativeLanguage}
            onChange={(e) => setNativeLanguage(e.target.value)}
            className="glass rounded-2xl px-4 py-3 text-sm outline-none border border-border focus:border-primary transition-colors"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
            ))}
          </select>
        </Section>

        {/* Primary language */}
        <Section title="Primary language">
          <p className="text-xs text-muted-foreground -mt-1">The language shown first when you open the app.</p>
          <select
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
            className="glass rounded-2xl px-4 py-3 text-sm outline-none border border-border focus:border-primary transition-colors"
          >
            {LANGUAGES.filter((l) => l.code !== nativeLanguage).map((l) => (
              <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
            ))}
          </select>
          <div className="grid grid-cols-3 gap-2">
            {LEVELS.map((lvl) => (
              <button
                key={lvl.code}
                onClick={() => setLevel(lvl.code as LanguageLevel)}
                className={`py-2 rounded-xl text-sm font-mono font-semibold border transition-all ${
                  level === lvl.code
                    ? "gradient-primary text-white border-transparent"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                {lvl.code}
              </button>
            ))}
          </div>
        </Section>

        {/* Additional languages */}
        <Section title="Additional languages">
          {extraPairs.length === 0 && !showAdd && (
            <p className="text-xs text-muted-foreground -mt-1">
              Add more languages to switch between them on the home screen.
            </p>
          )}

          <div className="flex flex-col gap-2">
            {extraPairs.map((pair) => {
              const lang = LANGUAGES.find((l) => l.code === pair.language);
              return (
                <div key={pair.language} className="glass rounded-2xl px-3 py-2.5 flex items-center gap-3 border border-border">
                  <span className="text-xl">{lang?.flag}</span>
                  <span className="flex-1 text-sm font-medium">{lang?.name}</span>
                  <select
                    value={pair.level}
                    onChange={(e) => setPairLevel(pair.language, e.target.value as LanguageLevel)}
                    className="bg-secondary rounded-lg px-2 py-1 text-xs font-mono outline-none border border-border"
                  >
                    {LEVELS.map((l) => (
                      <option key={l.code} value={l.code}>{l.code}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => removePair(pair.language)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>

          <AnimatePresence>
            {showAdd ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col gap-2 overflow-hidden"
              >
                <select
                  value={newLang}
                  onChange={(e) => setNewLang(e.target.value)}
                  className="glass rounded-2xl px-4 py-3 text-sm outline-none border border-border"
                >
                  <option value="">Select language…</option>
                  {LANGUAGES.filter((l) => !usedCodes.has(l.code) && l.code !== nativeLanguage).map((l) => (
                    <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
                  ))}
                </select>
                <select
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value as LanguageLevel)}
                  className="glass rounded-2xl px-4 py-3 text-sm outline-none border border-border"
                >
                  {LEVELS.map((l) => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowAdd(false); setNewLang(""); }}
                    className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addPair}
                    disabled={!newLang}
                    className="flex-1 py-2.5 rounded-xl gradient-primary text-white text-sm font-medium disabled:opacity-40 flex items-center justify-center gap-1.5"
                  >
                    <Check size={15} /> Add
                  </button>
                </div>
              </motion.div>
            ) : (
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-primary/40 text-sm text-muted-foreground hover:text-foreground hover:border-primary/60 transition-colors"
              >
                <Plus size={16} /> Add language
              </button>
            )}
          </AnimatePresence>
        </Section>
      </div>

      {/* Save bar */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-safe pt-3 bg-gradient-to-t from-background via-background to-transparent">
        <button
          onClick={save}
          disabled={saving}
          className="w-full py-4 rounded-2xl font-semibold text-white gradient-primary glow-purple transition-transform active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <Globe size={18} />
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold px-1">{title}</h2>
      {children}
    </div>
  );
}
