"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Image as ImageIcon, X, Zap, Sparkles, Mic, Type, MicOff } from "lucide-react";
import { useProfile } from "@/context/ProfileContext";
import { toast } from "sonner";
import { LANGUAGES } from "@/lib/constants";
import type { LessonInputType } from "@/types";
import BottomNav from "@/components/BottomNav";
import { useLanguageTheme } from "@/hooks/useLanguageTheme";

// Minimal typing for the Web Speech API (not in standard lib.dom)
type SpeechResult = { isFinal: boolean; 0: { transcript: string }; length: number };
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<SpeechResult> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

const SPEECH_LANG: Record<string, string> = {
  en: "en-US", es: "es-ES", fr: "fr-FR", de: "de-DE", it: "it-IT", pt: "pt-PT",
  pl: "pl-PL", ja: "ja-JP", zh: "zh-CN", ko: "ko-KR", ru: "ru-RU", ar: "ar-SA", uk: "uk-UA",
  nl: "nl-NL", sv: "sv-SE", no: "nb-NO", da: "da-DK", fi: "fi-FI", is: "is-IS",
  cs: "cs-CZ", sk: "sk-SK", hu: "hu-HU", ro: "ro-RO", bg: "bg-BG", el: "el-GR",
  tr: "tr-TR", hr: "hr-HR", sr: "sr-RS", sl: "sl-SI", lt: "lt-LT", lv: "lv-LV",
  et: "et-EE", hi: "hi-IN", bn: "bn-BD", th: "th-TH", vi: "vi-VN", id: "id-ID",
  ms: "ms-MY", he: "he-IL", fa: "fa-IR",
};

type State = "idle" | "analyzing";
type Mode = LessonInputType;

export default function HomePage() {
  const router = useRouter();
  const { profile } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const wantListeningRef = useRef(false); // true while the user wants to keep recording
  const finalRef = useRef("");            // confirmed (final) transcript so far

  const [state, setState] = useState<State>("idle");
  const [mode, setMode] = useState<Mode>("photo");
  const [preview, setPreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);

  const targetLanguage = profile?.target_language ?? "en";
  const level = profile?.level ?? "A1";
  const currentLang = LANGUAGES.find((l) => l.code === targetLanguage);
  useLanguageTheme(targetLanguage);

  const speechSupported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // Stop any recognition when leaving the page
  useEffect(() => {
    return () => { wantListeningRef.current = false; recognitionRef.current?.abort(); };
  }, []);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please select an image"); return; }
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
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

  function stopListening() {
    wantListeningRef.current = false;
    setListening(false);
    recognitionRef.current?.stop();
  }

  function startListening() {
    if (!speechSupported) { toast.error("Voice input isn't supported in this browser"); return; }
    // Mic only works over HTTPS or localhost
    if (typeof window !== "undefined" && !window.isSecureContext) {
      toast.error("Microphone needs HTTPS or localhost — try the Text tab here.");
      return;
    }
    const Ctor = (window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    });
    const Recognition = Ctor.SpeechRecognition ?? Ctor.webkitSpeechRecognition;
    if (!Recognition) { toast.error("Voice input isn't supported in this browser"); return; }

    // Continue appending to whatever is already in the box
    finalRef.current = text ? text.trim() + " " : "";
    wantListeningRef.current = true;

    const rec = new Recognition();
    rec.lang = SPEECH_LANG[profile?.native_language ?? "en"] ?? "en-US";
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalRef.current += r[0].transcript + " ";
        else interim += r[0].transcript;
      }
      setText((finalRef.current + interim).trimStart());
    };

    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        toast.error("Microphone blocked — allow mic access in your browser.");
        wantListeningRef.current = false;
        setListening(false);
      }
      // other errors (no-speech, aborted, network) fall through to onend → auto-restart
    };

    rec.onend = () => {
      // Chrome ends the session after a pause; restart if the user still wants to record
      if (wantListeningRef.current) {
        try { rec.start(); } catch { /* already starting */ }
      } else {
        setListening(false);
      }
    };

    recognitionRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      // start() throws if called too quickly after a previous stop
      wantListeningRef.current = false;
      setListening(false);
    }
  }

  function toggleListening() {
    if (listening) stopListening();
    else startListening();
  }

  function switchMode(m: Mode) {
    if (listening) stopListening();
    setMode(m);
  }

  const canSubmit = (mode === "photo" && !!imageFile) || (mode !== "photo" && text.trim().length > 1) ||
    (mode === "photo" && text.trim().length > 1);

  const analyze = async () => {
    if (!profile) { toast.error("Profile not loaded — try refreshing"); return; }
    if (!imageFile && text.trim().length < 2) {
      toast.error("Add a photo or write something first");
      return;
    }
    if (listening) stopListening();
    setState("analyzing");

    const form = new FormData();
    if (imageFile) form.append("image", imageFile);
    if (text.trim()) form.append("text", text.trim());
    form.append("inputType", mode);
    form.append("targetLanguage", targetLanguage);
    form.append("nativeLanguage", profile.native_language);
    form.append("level", level);

    try {
      const res = await fetch("/api/analyze", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Something went wrong"); setState("idle"); return; }
      router.push(`/lesson/${data.lesson.id}?xp=${data.xpEarned}&streak=${data.newStreak}&badges=${(data.newBadges ?? []).join(",")}`);
    } catch {
      toast.error("Network error. Please try again.");
      setState("idle");
    }
  };

  const clearImage = () => { setPreview(null); setImageFile(null); };

  return (
    <div className="flex flex-col min-h-dvh pt-safe">
      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          <span style={{ background: "linear-gradient(135deg, var(--lang-from), var(--lang-to))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Lingvido
          </span>
        </h1>
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

      {/* Active language (managed in Profile) */}
      {profile && (
        <div className="px-5 pb-3">
          <button
            onClick={() => router.push("/profile")}
            className="glass rounded-2xl px-4 py-2.5 flex items-center gap-2 border border-border w-full text-left"
          >
            <span className="text-xl">{currentLang?.flag}</span>
            <div className="flex-1 min-w-0">
              <span className="font-medium text-sm">Learning {currentLang?.name}</span>
              <span className="ml-2 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-md font-mono">{level}</span>
            </div>
            <span className="text-xs text-muted-foreground">Change ›</span>
          </button>
        </div>
      )}

      {/* Mode selector */}
      <div className="px-5 pb-3">
        <div className="glass rounded-2xl p-1 flex gap-1">
          {([
            { key: "photo", icon: Camera, label: "Photo" },
            { key: "voice", icon: Mic, label: "Voice" },
            { key: "text", icon: Type, label: "Text" },
          ] as const).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => switchMode(key)}
              disabled={state === "analyzing"}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                mode === key ? "gradient-primary text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Composer */}
      <div className="flex-1 flex flex-col px-5 pb-24 gap-4">
        {state === "analyzing" ? (
          <div className="flex-1 glass rounded-3xl flex flex-col items-center justify-center gap-4 min-h-64">
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center glow-purple">
              <span className="text-2xl">✨</span>
            </div>
            <div className="text-center">
              <p className="font-semibold">Creating your lesson…</p>
              <p className="text-muted-foreground text-sm">Building a {currentLang?.name} micro-lesson</p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* PHOTO */}
            {mode === "photo" && (
              <motion.div key="photo" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="flex-1 flex flex-col gap-3">
                {preview ? (
                  <div className="relative rounded-3xl overflow-hidden flex-1 min-h-64">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <button onClick={clearImage} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-background/80 backdrop-blur flex items-center justify-center border border-border">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div
                    className="flex-1 glass rounded-3xl flex flex-col items-center justify-center gap-5 cursor-pointer active:scale-[0.98] transition-transform border border-dashed border-primary/30 min-h-64"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={onDrop}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center camera-btn glow-purple">
                      <Camera size={32} className="text-white" />
                    </div>
                    <div className="text-center px-6">
                      <p className="font-semibold text-lg">Take or upload a photo</p>
                      <p className="text-muted-foreground text-sm mt-1">Snap anything around you to learn from it</p>
                    </div>
                  </div>
                )}

                <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
                <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

                {!preview && (
                  <button
                    className="flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-border text-sm text-muted-foreground hover:border-primary/50 transition-colors"
                    onClick={() => galleryInputRef.current?.click()}
                  >
                    <ImageIcon size={16} />
                    Choose from gallery
                  </button>
                )}

                {/* Optional note */}
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Add a note (optional) — e.g. where you are, what caught your eye…"
                  rows={2}
                  className="glass rounded-2xl px-4 py-3 text-sm outline-none border border-border focus:border-primary transition-colors resize-none placeholder:text-muted-foreground"
                />
              </motion.div>
            )}

            {/* VOICE */}
            {mode === "voice" && (
              <motion.div key="voice" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="flex-1 flex flex-col gap-3">
                <div className="flex-1 glass rounded-3xl flex flex-col items-center justify-center gap-5 min-h-64 p-6">
                  <button
                    onClick={toggleListening}
                    className={`w-24 h-24 rounded-full flex items-center justify-center transition-transform active:scale-95 ${
                      listening ? "bg-destructive glow-purple animate-pulse" : "gradient-primary glow-purple"
                    }`}
                  >
                    {listening ? <MicOff size={36} className="text-white" /> : <Mic size={36} className="text-white" />}
                  </button>
                  <p className="font-semibold text-center">
                    {listening ? "Listening… tap to stop" : "Tap and describe what you see"}
                  </p>
                  {!speechSupported && (
                    <p className="text-xs text-destructive text-center">
                      Voice isn&apos;t supported here — try the Text tab instead.
                    </p>
                  )}
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Your spoken words appear here — you can edit them."
                  rows={3}
                  className="glass rounded-2xl px-4 py-3 text-sm outline-none border border-border focus:border-primary transition-colors resize-none placeholder:text-muted-foreground"
                />
              </motion.div>
            )}

            {/* TEXT */}
            {mode === "text" && (
              <motion.div key="text" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="flex-1 flex flex-col gap-3">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="What did you see? Where are you? Describe anything you'd like a lesson about…"
                  rows={8}
                  autoFocus
                  className="flex-1 glass rounded-3xl px-5 py-4 text-base outline-none border border-border focus:border-primary transition-colors resize-none placeholder:text-muted-foreground min-h-64"
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {state !== "analyzing" && (
          <button
            onClick={analyze}
            disabled={!canSubmit}
            className="w-full py-4 rounded-2xl font-semibold text-white gradient-primary glow-purple transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40 disabled:active:scale-100"
          >
            <Sparkles size={18} />
            Generate {currentLang?.flag} lesson
          </button>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
