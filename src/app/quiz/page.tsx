"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Trophy, Check, X, Clock, Zap } from "lucide-react";
import { useProfile } from "@/context/ProfileContext";
import { useLanguageTheme } from "@/hooks/useLanguageTheme";
import { LANGUAGES, XP_PER_QUIZ_CORRECT } from "@/lib/constants";
import type { Quiz } from "@/types";
import BottomNav from "@/components/BottomNav";

const PER_QUESTION_SECONDS = 10;
type Phase = "loading" | "intro" | "playing" | "reveal" | "done" | "already";

export default function QuizPage() {
  const router = useRouter();
  const { profile, refresh } = useProfile();
  const target = profile?.target_language;
  const native = profile?.native_language;
  useLanguageTheme(target);
  const lang = LANGUAGES.find((l) => l.code === target);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(PER_QUESTION_SECONDS);
  const [result, setResult] = useState<{ correct: number; total: number; xp: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load today's quiz
  useEffect(() => {
    if (!target || !native) return;
    setPhase("loading");
    fetch(`/api/quiz?language=${target}&native=${native}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.quiz) setQuiz(d.quiz);
        if (d.done && d.score) { setResult(d.score); setPhase("already"); }
        else if (d.quiz) setPhase("intro");
        else setPhase("intro");
      })
      .catch(() => setPhase("intro"));
  }, [target, native]);

  const question = quiz?.questions[qIndex];

  const goNext = useCallback((picked: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSelected(picked);
    setAnswers((prev) => { const next = [...prev]; next[qIndex] = picked; return next; });
    setPhase("reveal");
    setTimeout(() => {
      if (!quiz) return;
      if (qIndex + 1 < quiz.questions.length) {
        setQIndex((i) => i + 1);
        setSelected(null);
        setTimeLeft(PER_QUESTION_SECONDS);
        setPhase("playing");
      } else {
        submit([...answers.slice(0, qIndex), picked]);
      }
    }, 1300);
  }, [qIndex, quiz, answers]); // eslint-disable-line react-hooks/exhaustive-deps

  // Per-question countdown
  useEffect(() => {
    if (phase !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          goNext(-1); // timeout = no answer
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, qIndex, goNext]);

  async function submit(finalAnswers: number[]) {
    setPhase("loading");
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: target, native, answers: finalAnswers }),
      });
      const d = await res.json();
      if (res.ok) {
        setResult({ correct: d.correct, total: d.total, xp: d.xp });
        await refresh();
        setPhase("done");
      } else {
        setResult({ correct: 0, total: quiz?.questions.length ?? 6, xp: 0 });
        setPhase("already");
      }
    } catch {
      setPhase("done");
    }
  }

  function start() {
    setQIndex(0);
    setAnswers([]);
    setSelected(null);
    setTimeLeft(PER_QUESTION_SECONDS);
    setPhase("playing");
  }

  return (
    <div className="flex flex-col min-h-dvh pt-safe page-enter">
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Daily Quiz</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{lang?.flag} {lang?.name} · {XP_PER_QUIZ_CORRECT} XP per answer</p>
        </div>
        <button onClick={() => router.push("/profile")} className="glass rounded-xl px-3 py-2 flex items-center gap-1.5 border border-border text-sm">
          <Trophy size={15} className="text-yellow-400" /> Ranking
        </button>
      </div>

      <div className="flex-1 px-5 pb-24 flex flex-col">
        {phase === "loading" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-primary animate-spin glow-purple" />
            <p className="text-sm text-muted-foreground">Loading today&apos;s quiz…</p>
          </div>
        )}

        {phase === "intro" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
            <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center glow-purple">
              <Brain size={44} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">6 questions · 10s each</h2>
              <p className="text-muted-foreground text-sm mt-2 max-w-xs">
                Today&apos;s calendar page, a notable figure, vocabulary and {lang?.name} trivia.
                Answer fast — {XP_PER_QUIZ_CORRECT} XP per correct answer!
              </p>
            </div>
            <button onClick={start} className="px-8 py-4 rounded-2xl font-semibold text-white gradient-primary glow-purple transition-transform active:scale-95">
              Start quiz
            </button>
          </div>
        )}

        {(phase === "playing" || phase === "reveal") && question && (
          <div className="flex-1 flex flex-col gap-4">
            {/* progress + timer */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full gradient-primary rounded-full transition-all" style={{ width: `${((qIndex + 1) / (quiz?.questions.length ?? 6)) * 100}%` }} />
              </div>
              <div className={`flex items-center gap-1 text-sm font-mono font-bold ${timeLeft <= 3 && phase === "playing" ? "text-destructive" : "text-muted-foreground"}`}>
                <Clock size={14} /> {timeLeft}s
              </div>
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Question {qIndex + 1} / {quiz?.questions.length}
            </p>

            <AnimatePresence mode="wait">
              <motion.div
                key={qIndex}
                initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                className="flex flex-col gap-4"
              >
                <h2 className="text-xl font-bold leading-snug">{question.question}</h2>
                <div className="flex flex-col gap-3">
                  {question.options.map((opt, i) => {
                    const isCorrect = i === question.correct;
                    const isPicked = selected === i;
                    let cls = "glass border border-border";
                    if (phase === "reveal") {
                      if (isCorrect) cls = "bg-emerald-500/20 border border-emerald-500/60";
                      else if (isPicked) cls = "bg-destructive/20 border border-destructive/60";
                      else cls = "glass border border-border opacity-60";
                    }
                    return (
                      <button
                        key={i}
                        disabled={phase === "reveal"}
                        onClick={() => goNext(i)}
                        className={`w-full text-left px-4 py-4 rounded-2xl flex items-center gap-3 transition-all active:scale-[0.98] ${cls}`}
                      >
                        <span className="w-7 h-7 rounded-full bg-primary/15 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="flex-1 font-medium">{opt}</span>
                        {phase === "reveal" && isCorrect && <Check size={18} className="text-emerald-500" />}
                        {phase === "reveal" && isPicked && !isCorrect && <X size={18} className="text-destructive" />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {(phase === "done" || phase === "already") && result && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
            <motion.div
              initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200 }}
              className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center glow-purple"
            >
              <Trophy size={44} className="text-white" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold">
                {result.correct} / {result.total} correct
              </h2>
              <div className="flex items-center justify-center gap-1 text-yellow-400 font-semibold mt-1">
                <Zap size={16} /> +{result.xp} XP
              </div>
              <p className="text-muted-foreground text-sm mt-3">
                {phase === "already" ? "You already played today — come back tomorrow for a new quiz!" : "Nice! A fresh quiz arrives tomorrow."}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => router.push("/profile")} className="px-6 py-3 rounded-2xl font-semibold text-white gradient-primary glow-purple active:scale-95 transition-transform">
                See ranking
              </button>
              <button onClick={() => router.push("/")} className="px-6 py-3 rounded-2xl border border-border text-muted-foreground">
                Home
              </button>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
