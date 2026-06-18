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

export type PartOfSpeech = "noun" | "verb" | "adjective" | "adverb" | "phrase" | "other";

export type LessonWord = {
  word: string;
  translation: string;
  pronunciation?: string;
  pos?: PartOfSpeech;
};

export type LessonConstruction = {
  pattern: string;
  example: string;
  translation: string;
};

/** A short text the model provides in both languages, for the display toggle. */
export type Bilingual = {
  native: string;
  target: string;
};

/** "Calendar page" almanac about the country, tied to today's date. */
export type LessonHistory = {
  date_label: string;
  on_this_day: Bilingual;
  figure: Bilingual;
  geo_fact: Bilingual;
  holiday?: Bilingual;
};

/** Extra structured content stored as a single jsonb column. */
export type LessonExtra = {
  cultural_note_target?: string;
  history?: LessonHistory;
};

export type LessonInputType = "photo" | "voice" | "text";

export type Lesson = {
  id: string;
  user_id: string;
  created_at: string;
  image_url: string | null;
  user_input?: string | null;
  input_type: LessonInputType;
  object_detected: string;
  target_language: string;
  native_language: string;
  level: LanguageLevel;
  words: LessonWord[];
  constructions: LessonConstruction[];
  cultural_note?: string;
  lesson_extra?: LessonExtra | null;
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

export type QuizQuestion = {
  question: string;
  options: string[];
  correct: number; // 0-based index
  category: "history" | "figure" | "vocab" | "general" | string;
};

export type Quiz = { questions: QuizQuestion[] };

export type QuizLeaderboardEntry = {
  username: string;
  avatar_url?: string;
  xp: number;
  rank: number;
};

export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (profile: UserProfile) => boolean;
};
