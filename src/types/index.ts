export type LanguageLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type Language = {
  code: string;
  name: string;
  flag: string;
};

export type LanguagePair = {
  language: string;
  level: LanguageLevel;
};

export type LessonWord = {
  word: string;
  translation: string;
  pronunciation?: string;
};

export type LessonConstruction = {
  pattern: string;
  example: string;
  translation: string;
};

export type Lesson = {
  id: string;
  user_id: string;
  created_at: string;
  image_url: string;
  object_detected: string;
  target_language: string;
  native_language: string;
  level: LanguageLevel;
  words: LessonWord[];
  constructions: LessonConstruction[];
  cultural_note?: string;
  xp_earned: number;
};

export type UserProfile = {
  id: string;
  username: string;
  avatar_url?: string;
  target_language: string;
  native_language: string;
  level: LanguageLevel;
  language_pairs: LanguagePair[];
  xp: number;
  streak: number;
  last_lesson_at: string | null;
  streak_updated_at: string | null;
  badges: string[];
  lessons_count: number;
};

export type LeaderboardEntry = {
  username: string;
  xp: number;
  streak: number;
  avatar_url?: string;
  rank: number;
};

export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (profile: UserProfile) => boolean;
};
