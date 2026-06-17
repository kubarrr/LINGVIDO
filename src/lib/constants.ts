import type { Language, Badge, UserProfile } from "@/types";

// Per-language app theme — colors drawn from each country's flag.
// `primary` drives accents/text; `from`→`to` is the button gradient; `glow` the shadow.
export type LanguageTheme = { from: string; to: string; primary: string; glow: string };

export const LANGUAGE_THEMES: Record<string, LanguageTheme> = {
  // English — brand purple
  en: { from: "oklch(0.62 0.22 280)", to: "oklch(0.72 0.18 310)", primary: "oklch(0.66 0.20 285)", glow: "oklch(0.62 0.22 280 / 0.45)" },
  // Spanish — red → gold
  es: { from: "oklch(0.58 0.24 25)",  to: "oklch(0.82 0.17 85)",  primary: "oklch(0.66 0.21 40)",  glow: "oklch(0.62 0.22 35 / 0.45)" },
  // French — blue → red
  fr: { from: "oklch(0.50 0.20 262)", to: "oklch(0.58 0.24 25)",  primary: "oklch(0.60 0.19 262)", glow: "oklch(0.52 0.20 262 / 0.45)" },
  // German — red → gold
  de: { from: "oklch(0.55 0.23 25)",  to: "oklch(0.82 0.17 90)",  primary: "oklch(0.66 0.21 45)",  glow: "oklch(0.60 0.22 35 / 0.45)" },
  // Italian — green → red
  it: { from: "oklch(0.60 0.17 150)", to: "oklch(0.58 0.24 25)",  primary: "oklch(0.64 0.16 152)", glow: "oklch(0.58 0.17 150 / 0.45)" },
  // Portuguese — green → red
  pt: { from: "oklch(0.52 0.16 150)", to: "oklch(0.58 0.24 25)",  primary: "oklch(0.60 0.16 150)", glow: "oklch(0.52 0.16 150 / 0.45)" },
  // Polish — white/red
  pl: { from: "oklch(0.62 0.23 25)",  to: "oklch(0.72 0.17 20)",  primary: "oklch(0.64 0.22 25)",  glow: "oklch(0.62 0.23 25 / 0.45)" },
  // Japanese — crimson
  ja: { from: "oklch(0.58 0.24 18)",  to: "oklch(0.70 0.18 15)",  primary: "oklch(0.63 0.23 18)",  glow: "oklch(0.58 0.24 18 / 0.45)" },
  // Chinese — red → gold
  zh: { from: "oklch(0.56 0.24 25)",  to: "oklch(0.82 0.17 88)",  primary: "oklch(0.65 0.22 35)",  glow: "oklch(0.58 0.23 30 / 0.45)" },
  // Korean — blue → red
  ko: { from: "oklch(0.52 0.20 255)", to: "oklch(0.58 0.24 22)",  primary: "oklch(0.60 0.18 252)", glow: "oklch(0.52 0.20 255 / 0.45)" },
  // Russian — blue → red
  ru: { from: "oklch(0.50 0.20 262)", to: "oklch(0.58 0.24 25)",  primary: "oklch(0.58 0.20 260)", glow: "oklch(0.52 0.20 262 / 0.45)" },
  // Arabic — green
  ar: { from: "oklch(0.52 0.15 155)", to: "oklch(0.70 0.15 150)", primary: "oklch(0.62 0.15 152)", glow: "oklch(0.55 0.15 153 / 0.45)" },
  // Ukrainian — blue → yellow
  uk: { from: "oklch(0.52 0.18 255)", to: "oklch(0.83 0.17 90)",  primary: "oklch(0.60 0.18 252)", glow: "oklch(0.52 0.18 255 / 0.45)" },
};

export const LANGUAGES: Language[] = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "pl", name: "Polski", flag: "🇵🇱" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "uk", name: "Українська", flag: "🇺🇦" },
];

export const LEVELS = [
  { code: "A1", label: "A1 — Beginner", description: "First words and phrases" },
  { code: "A2", label: "A2 — Elementary", description: "Basic communication" },
  { code: "B1", label: "B1 — Intermediate", description: "Everyday situations" },
  { code: "B2", label: "B2 — Upper-Intermediate", description: "Complex topics" },
  { code: "C1", label: "C1 — Advanced", description: "Fluent expression" },
  { code: "C2", label: "C2 — Mastery", description: "Native-level proficiency" },
] as const;

export const XP_PER_LESSON = 20;
export const XP_PER_WORD = 5;
export const XP_STREAK_BONUS = 10;

export const XP_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 5000];
export const LEVEL_NAMES = ["Seed", "Sprout", "Leaf", "Branch", "Tree", "Forest", "Legend"];

export const BADGES: Badge[] = [
  {
    id: "first_lesson",
    name: "First Step",
    description: "Completed your first lesson",
    icon: "🌱",
    condition: (p: UserProfile) => p.lessons_count >= 1,
  },
  {
    id: "streak_3",
    name: "On a Roll",
    description: "3-day streak",
    icon: "🔥",
    condition: (p: UserProfile) => p.streak >= 3,
  },
  {
    id: "streak_7",
    name: "Week Warrior",
    description: "7-day streak",
    icon: "⚡",
    condition: (p: UserProfile) => p.streak >= 7,
  },
  {
    id: "streak_30",
    name: "Month Master",
    description: "30-day streak",
    icon: "💎",
    condition: (p: UserProfile) => p.streak >= 30,
  },
  {
    id: "lessons_10",
    name: "Explorer",
    description: "Completed 10 lessons",
    icon: "🗺️",
    condition: (p: UserProfile) => p.lessons_count >= 10,
  },
  {
    id: "lessons_50",
    name: "Adventurer",
    description: "Completed 50 lessons",
    icon: "🏆",
    condition: (p: UserProfile) => p.lessons_count >= 50,
  },
  {
    id: "xp_1000",
    name: "XP Hunter",
    description: "Earned 1000 XP",
    icon: "⭐",
    condition: (p: UserProfile) => p.xp >= 1000,
  },
];

export const getUserAppLevel = (xp: number) => {
  let level = 0;
  for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= XP_THRESHOLDS[i]) { level = i; break; }
  }
  const current = XP_THRESHOLDS[level];
  const next = XP_THRESHOLDS[level + 1] ?? XP_THRESHOLDS[XP_THRESHOLDS.length - 1];
  const progress = next > current ? ((xp - current) / (next - current)) * 100 : 100;
  return { level, name: LEVEL_NAMES[level], progress: Math.min(progress, 100), next };
};
