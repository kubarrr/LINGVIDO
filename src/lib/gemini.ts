import type { LanguageLevel, LessonWord, LessonConstruction, LessonHistory } from "@/types";
import { LANGUAGES } from "./constants";

type GeneratedLesson = {
  object_detected: string;
  words: LessonWord[];
  constructions: LessonConstruction[];
  cultural_note: string;
};

// Free models on OpenRouter — tries each in order until one succeeds
const MODELS = [
  "nex-agi/nex-n2-pro:free",
  "google/gemma-3-27b-it:free",
  "google/gemma-3-12b-it:free",
  "google/gemma-3n-e4b-it:free",
];

// Shared OpenRouter caller — returns the first model's parsed JSON object
async function callOpenRouter<T>(content: Array<Record<string, unknown>>): Promise<T> {
  const errors: string[] = [];
  for (const model of MODELS) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://lingvido.vercel.app",
          "X-Title": "Lingvido",
        },
        body: JSON.stringify({ model, messages: [{ role: "user", content }] }),
      });

      if (!res.ok) {
        const errText = await res.text();
        const msg = `[${model}] ${res.status}: ${errText}`;
        errors.push(msg);
        console.warn(msg);
        continue;
      }

      const data = await res.json();
      const text: string = data.choices?.[0]?.message?.content ?? "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) { errors.push(`[${model}] No JSON in response`); continue; }
      return JSON.parse(jsonMatch[0]) as T;
    } catch (err) {
      const msg = `[${model}] ${err instanceof Error ? err.message : String(err)}`;
      errors.push(msg);
      console.warn(msg);
    }
  }
  throw new Error("All models failed:\n" + errors.join("\n"));
}

export type LessonInput = {
  imageBase64?: string;
  mimeType?: string;
  userText?: string;
  targetLanguage: string;
  nativeLanguage: string;
  level: LanguageLevel;
  /** Topics already covered for this user+language — avoid repeating them. */
  avoidTopics?: string[];
};

export async function generateLesson(input: LessonInput): Promise<GeneratedLesson> {
  const { imageBase64, mimeType, userText, targetLanguage, nativeLanguage, level, avoidTopics = [] } = input;
  const targetLang = LANGUAGES.find((l) => l.code === targetLanguage)?.name ?? targetLanguage;
  const nativeLang = LANGUAGES.find((l) => l.code === nativeLanguage)?.name ?? nativeLanguage;

  const hasImage = !!imageBase64;
  const hasText = !!userText?.trim();

  const sourceDescription = hasImage && hasText
    ? "the photo AND the note the learner wrote below"
    : hasImage
    ? "the photo"
    : "the note the learner wrote below";

  const avoidBlock = avoidTopics.length > 0
    ? `\nThe learner has RECENTLY had lessons about these topics — do NOT pick any of them again, choose something fresh:\n${avoidTopics.map((t) => `- ${t}`).join("\n")}\n`
    : "";

  const userTextBlock = hasText ? `\nThe learner's note: "${userText!.trim()}"\n` : "";

  const LEVEL_GUIDE: Record<string, string> = {
    A1: "Use only the most basic, high-frequency vocabulary and very simple present-tense sentences.",
    A2: "Use common everyday vocabulary and simple tenses; keep sentences short and clear.",
    B1: "Use intermediate vocabulary including some collocations and phrasal verbs; mix tenses and use natural sentences.",
    B2: "Use upper-intermediate vocabulary, less common words, idiomatic collocations, and complex grammar (passive, conditionals, reported speech).",
    C1: "Use advanced, sophisticated and lower-frequency vocabulary, nuanced register, and complex/native-like structures (subjunctive, inversion, ellipsis).",
    C2: "Use rare, precise, formal or richly idiomatic vocabulary and the most complex literary structures; assume near-native mastery.",
  };
  const levelLine = LEVEL_GUIDE[level] ?? LEVEL_GUIDE.B1;

  const prompt = `You are an engaging, creative language teacher. Based on ${sourceDescription}, create a rich, interesting micro-lesson in ${targetLang} for a ${level} level student whose native language is ${nativeLang}.
${userTextBlock}${avoidBlock}
DIFFICULTY — this is a ${level} learner: ${levelLine} The words and grammar MUST genuinely match ${level}; do not default to easy beginner content for higher levels.

CHOOSING THE TOPIC (very important):
- Pick a SPECIFIC, vivid, non-obvious focal point — a particular object, detail, action, material, or scene.
- NEVER choose generic catch-all words like "person", "man", "woman", "people", "human", "thing", "object", "background". If a person is present, focus instead on what they are doing, wearing, holding, or their surroundings (e.g. "street musician", "knitted scarf", "morning commute").
- Prefer something that yields interesting vocabulary and a good cultural note.

Respond ONLY with a valid JSON object in this exact format:
{
  "object_detected": "the chosen specific topic in English (1-3 words, NOT a generic word)",
  "words": [
    {"word": "word in ${targetLang}", "translation": "translation in ${nativeLang}", "pronunciation": "phonetic pronunciation if useful", "pos": "noun|verb|adjective|adverb|phrase|other"},
    {"word": "...", "translation": "...", "pronunciation": "...", "pos": "..."}
  ],
  "constructions": [
    {"pattern": "grammar pattern in ${targetLang}", "example": "full example sentence in ${targetLang}", "translation": "translation in ${nativeLang}"},
    {"pattern": "...", "example": "...", "translation": "..."}
  ],
  "cultural_note": "A rich cultural insight about the topic in ${nativeLang} — 4 to 5 sentences."
}

Rules:
- Choose exactly 6 words most relevant to the chosen topic, at genuine ${level} difficulty, with an accurate "pos" (part of speech) for each
- Provide exactly 6 grammar constructions at ${level} difficulty; they should use vocabulary from the words list
- Cultural note must be genuinely insightful, 4-5 sentences minimum
- All content must be accurate`;

  const content: Array<Record<string, unknown>> = [];
  if (hasImage) content.push({ type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } });
  content.push({ type: "text", text: prompt });

  return callOpenRouter<GeneratedLesson>(content);
}

// --- Daily country almanac (the "calendar page") ---------------------------

export async function generateAlmanac(opts: {
  targetLanguage: string;
  nativeLanguage: string;
  today: string; // e.g. "17 June"
}): Promise<LessonHistory> {
  const targetLang = LANGUAGES.find((l) => l.code === opts.targetLanguage)?.name ?? opts.targetLanguage;
  const nativeLang = LANGUAGES.find((l) => l.code === opts.nativeLanguage)?.name ?? opts.nativeLanguage;

  const prompt = `Create a "calendar page" almanac about the culture and country/countries where ${targetLang} is spoken, for the date ${opts.today}. Everything must be real and accurate, and tie to this date where natural.

Respond ONLY with a valid JSON object in this exact format. Every field has BOTH "native" (${nativeLang}) and "target" (${targetLang}) versions of the SAME content. Each entry should be a SMALL PARAGRAPH of 3-4 sentences — informative and engaging, with concrete details (names, years, places):
{
  "date_label": "${opts.today}",
  "on_this_day": {"native": "an interesting historical event that happened on or around ${opts.today} in that culture, with context and why it mattered", "target": "..."},
  "figure": {"native": "a notable historical figure from that culture, ideally with a birthday/anniversary near ${opts.today}; who they were, what they achieved, and their legacy", "target": "..."},
  "geo_fact": {"native": "a vivid description of a region/place in that country (e.g. Bavaria, Andalusia, Hokkaido) — landscape, character and a surprising detail", "target": "..."},
  "holiday": {"native": "a holiday or tradition celebrated around ${opts.today} — its origin, how people celebrate, and what it means (omit this field entirely if none fits)", "target": "..."}
}

Make each paragraph accurate, specific and genuinely interesting — not generic.`;

  return callOpenRouter<LessonHistory>([{ type: "text", text: prompt }]);
}
