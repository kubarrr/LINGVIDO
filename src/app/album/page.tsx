"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Trash2, BookOpen, Mic, Type } from "lucide-react";
import type { Lesson } from "@/types";
import { LANGUAGES } from "@/lib/constants";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import { useProfile } from "@/context/ProfileContext";
import { useLanguageTheme } from "@/hooks/useLanguageTheme";

export default function AlbumPage() {
  const router = useRouter();
  const { profile } = useProfile();
  useLanguageTheme(profile?.target_language);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const activeLanguage = profile?.target_language;
  const activeLevel = profile?.level;

  const load = useCallback(async (p = 1) => {
    if (!activeLanguage || !activeLevel) return;
    setLoading(true);
    const res = await fetch(`/api/lessons?page=${p}&language=${activeLanguage}&level=${activeLevel}`);
    const data = await res.json();
    if (p === 1) setLessons(data.lessons ?? []);
    else setLessons((prev) => [...prev, ...(data.lessons ?? [])]);
    setTotal(data.total ?? 0);
    setPage(p);
    setLoading(false);
  }, [activeLanguage, activeLevel]);

  // Reload whenever the active language or level changes
  useEffect(() => { load(1); }, [load]);

  async function deleteLesson(id: string) {
    if (!confirm("Delete this lesson?")) return;
    await fetch("/api/lessons", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    toast.success("Lesson deleted");
    load(1);
  }

  const filtered = lessons.filter((l) =>
    l.object_detected.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-dvh pt-safe">
      <div className="px-5 pt-4 pb-3">
        <h1 className="text-2xl font-bold">My Album</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {LANGUAGES.find((l) => l.code === activeLanguage)?.flag} {total} {activeLanguage ? LANGUAGES.find((l) => l.code === activeLanguage)?.name : ""}
          {activeLevel ? ` · ${activeLevel}` : ""} lesson{total === 1 ? "" : "s"}
        </p>
      </div>

      <div className="px-5 pb-4">
        <div className="glass rounded-2xl flex items-center gap-3 px-4 py-3">
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search lessons..."
            className="bg-transparent flex-1 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex-1 px-5 pb-24">
        {loading && lessons.length === 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-card animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <BookOpen size={40} className="text-muted-foreground" />
            <p className="text-muted-foreground">
              {search ? "No lessons match your search" : "No lessons yet. Snap a photo to start!"}
            </p>
            {!search && (
              <button
                onClick={() => router.push("/")}
                className="gradient-primary text-white px-5 py-2.5 rounded-xl font-medium"
              >
                Take first photo
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {filtered.map((lesson, i) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  index={i}
                  onClick={() => router.push(`/lesson/${lesson.id}`)}
                  onDelete={() => deleteLesson(lesson.id)}
                />
              ))}
            </div>
            {lessons.length < total && (
              <button
                onClick={() => load(page + 1)}
                disabled={loading}
                className="w-full mt-4 py-3 rounded-2xl border border-border text-muted-foreground text-sm hover:border-primary/50 transition-colors disabled:opacity-50"
              >
                {loading ? "Loading..." : "Load more"}
              </button>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function LessonCard({
  lesson, index, onClick, onDelete,
}: {
  lesson: Lesson;
  index: number;
  onClick: () => void;
  onDelete: () => void;
}) {
  const lang = LANGUAGES.find((l) => l.code === lesson.target_language);
  const date = new Date(lesson.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const hasImage = !!lesson.image_url;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04 }}
      className="relative group rounded-2xl overflow-hidden aspect-[3/4] cursor-pointer"
      onClick={onClick}
    >
      {hasImage ? (
        <>
          <img
            src={lesson.image_url!}
            alt={lesson.object_detected}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {/* Light gradient confined to the bottom so the photo stays visible */}
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-background/95 to-transparent" />
        </>
      ) : (
        // Text / voice lesson — no photo, show a tinted card with the note
        <div className="w-full h-full gradient-primary flex flex-col p-3">
          <div className="flex items-center gap-1.5 text-white/90">
            {lesson.input_type === "voice" ? <Mic size={14} /> : <Type size={14} />}
            <span className="text-[10px] uppercase tracking-wider font-semibold">
              {lesson.input_type === "voice" ? "Voice" : "Text"}
            </span>
          </div>
          {lesson.user_input && (
            <p className="text-white/85 text-xs leading-snug mt-2 line-clamp-4 italic">
              “{lesson.user_input}”
            </p>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-transparent to-transparent" />
        </div>
      )}

      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-border z-10"
      >
        <Trash2 size={12} className="text-destructive" />
      </button>

      <div className="absolute bottom-0 left-0 right-0 p-2.5">
        <p className="text-sm font-bold capitalize leading-tight truncate drop-shadow">{lesson.object_detected}</p>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-[11px] text-foreground/70">{date}</span>
          <span className="text-xs">{lang?.flag}</span>
        </div>
      </div>
    </motion.div>
  );
}
