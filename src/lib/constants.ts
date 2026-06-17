import type { Language, Badge, UserProfile } from "@/types";

// Per-language app theme — a full palette drawn from each country's flag.
// Every token recolours the whole UI (background, text, cards, borders),
// not just accents. Built with the dark()/light() helpers below.
export type LanguageTheme = {
  mode: "light" | "dark";
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  border: string;
  primary: string;
  primaryForeground: string;
  glassBg: string;
  glassBorder: string;
  from: string;
  to: string;
  glow: string;
};

type Seed = {
  hue: number;
  from: string;
  to: string;
  primary?: string;
  foreground?: string;
  background?: string;
  card?: string;
};

function dark(s: Seed): LanguageTheme {
  const h = s.hue;
  return {
    mode: "dark",
    background: s.background ?? `oklch(0.11 0.025 ${h})`,
    foreground: s.foreground ?? `oklch(0.96 0.012 ${h})`,
    card: s.card ?? `oklch(0.15 0.03 ${h})`,
    cardForeground: s.foreground ?? `oklch(0.96 0.012 ${h})`,
    secondary: `oklch(0.18 0.03 ${h})`,
    secondaryForeground: `oklch(0.74 0.02 ${h})`,
    muted: `oklch(0.18 0.03 ${h})`,
    mutedForeground: `oklch(0.64 0.03 ${h})`,
    accent: `oklch(0.23 0.035 ${h})`,
    border: `oklch(0.26 0.035 ${h})`,
    primary: s.primary ?? s.from,
    primaryForeground: "oklch(0.99 0 0)",
    glassBg: `oklch(0.14 0.025 ${h} / 0.85)`,
    glassBorder: `oklch(0.7 0.2 ${h} / 0.18)`,
    from: s.from,
    to: s.to,
    glow: `oklch(0.62 0.2 ${h} / 0.45)`,
  };
}

function light(s: Seed): LanguageTheme {
  const h = s.hue;
  return {
    mode: "light",
    background: s.background ?? `oklch(0.97 0.025 ${h})`,
    foreground: s.foreground ?? `oklch(0.28 0.08 ${h})`,
    card: s.card ?? `oklch(0.995 0.006 ${h})`,
    cardForeground: s.foreground ?? `oklch(0.28 0.08 ${h})`,
    secondary: `oklch(0.93 0.035 ${h})`,
    secondaryForeground: `oklch(0.40 0.07 ${h})`,
    muted: `oklch(0.93 0.035 ${h})`,
    mutedForeground: `oklch(0.48 0.06 ${h})`,
    accent: `oklch(0.90 0.045 ${h})`,
    border: `oklch(0.85 0.04 ${h})`,
    primary: s.primary ?? s.from,
    primaryForeground: "oklch(0.99 0 0)",
    glassBg: `oklch(1 0 0 / 0.72)`,
    glassBorder: `oklch(0.55 0.15 ${h} / 0.22)`,
    from: s.from,
    to: s.to,
    glow: `oklch(0.6 0.18 ${h} / 0.32)`,
  };
}

export const LANGUAGE_THEMES: Record<string, LanguageTheme> = {
  // English — brand purple (dark)
  en: dark({ hue: 285, from: "oklch(0.62 0.22 280)", to: "oklch(0.72 0.18 310)", primary: "oklch(0.66 0.20 285)" }),
  // Spanish — yellow background, red text & accents (light)
  es: light({
    hue: 40, from: "oklch(0.58 0.23 28)", to: "oklch(0.80 0.17 85)",
    background: "oklch(0.94 0.10 92)", card: "oklch(0.975 0.06 92)",
    foreground: "oklch(0.40 0.19 28)", primary: "oklch(0.55 0.23 28)",
  }),
  // Italian — white background, green text, red accents (light)
  it: light({
    hue: 150, from: "oklch(0.58 0.16 150)", to: "oklch(0.58 0.24 25)",
    background: "oklch(0.985 0.006 150)", card: "oklch(1 0 0)",
    foreground: "oklch(0.32 0.10 152)", primary: "oklch(0.50 0.15 150)",
  }),
  // German — black background, white text, red & gold accents (dark)
  de: dark({
    hue: 30, from: "oklch(0.56 0.23 25)", to: "oklch(0.80 0.17 88)",
    background: "oklch(0.12 0.012 40)", primary: "oklch(0.64 0.22 30)",
  }),
  // French — white background, blue text, red accents (light)
  fr: light({
    hue: 262, from: "oklch(0.50 0.20 262)", to: "oklch(0.58 0.24 25)",
    background: "oklch(0.975 0.012 255)", foreground: "oklch(0.30 0.10 262)",
    primary: "oklch(0.48 0.19 262)",
  }),
  // Portuguese — light green background, green & red accents (light)
  pt: light({
    hue: 150, from: "oklch(0.50 0.16 150)", to: "oklch(0.58 0.24 25)",
    background: "oklch(0.96 0.03 150)", foreground: "oklch(0.30 0.10 150)",
    primary: "oklch(0.48 0.15 150)",
  }),
  // Polish — white background, red accents (light)
  pl: light({
    hue: 25, from: "oklch(0.60 0.23 25)", to: "oklch(0.70 0.18 20)",
    background: "oklch(0.985 0.004 25)", foreground: "oklch(0.30 0.06 25)",
    primary: "oklch(0.57 0.23 25)",
  }),
  // Japanese — white background, crimson accents (light)
  ja: light({
    hue: 18, from: "oklch(0.58 0.24 18)", to: "oklch(0.68 0.18 15)",
    background: "oklch(0.99 0.003 18)", foreground: "oklch(0.26 0.04 18)",
    primary: "oklch(0.56 0.24 18)",
  }),
  // Chinese — deep red background, gold accents (dark)
  zh: dark({
    hue: 30, from: "oklch(0.58 0.24 25)", to: "oklch(0.82 0.17 88)",
    background: "oklch(0.16 0.07 28)", card: "oklch(0.20 0.08 28)",
    primary: "oklch(0.78 0.16 78)",
  }),
  // Korean — white background, blue & red accents (light)
  ko: light({
    hue: 250, from: "oklch(0.52 0.20 255)", to: "oklch(0.58 0.24 22)",
    background: "oklch(0.985 0.006 250)", foreground: "oklch(0.28 0.07 250)",
    primary: "oklch(0.52 0.19 252)",
  }),
  // Russian — white background, blue text, red accents (light)
  ru: light({
    hue: 262, from: "oklch(0.50 0.20 262)", to: "oklch(0.58 0.24 25)",
    background: "oklch(0.98 0.008 262)", foreground: "oklch(0.30 0.09 262)",
    primary: "oklch(0.50 0.19 262)",
  }),
  // Arabic — green background, white text & gold accents (dark)
  ar: dark({
    hue: 155, from: "oklch(0.55 0.15 155)", to: "oklch(0.72 0.15 150)",
    background: "oklch(0.16 0.05 155)", card: "oklch(0.20 0.06 155)",
    primary: "oklch(0.72 0.15 152)",
  }),
  // Ukrainian — blue background, yellow accents (dark)
  uk: dark({
    hue: 250, from: "oklch(0.52 0.18 255)", to: "oklch(0.83 0.17 90)",
    background: "oklch(0.17 0.07 255)", card: "oklch(0.21 0.08 255)",
    primary: "oklch(0.82 0.17 88)",
  }),
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
