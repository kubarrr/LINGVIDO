import type { LanguageLevel, LessonWord, LessonConstruction } from "@/types";
import { LANGUAGES } from "./constants";

type Bilingual = { native: string; target: string };

type GeneratedLesson = {
  object_detected: string;
  words: LessonWord[];
  constructions: LessonConstruction[];
  cultural_note: string;
  cultural_note_target: string;
  history: {
    date_label: string;
    on_this_day: Bilingual;
    figure: Bilingual;
    geo_fact: Bilingual;
    holiday?: Bilingual;
  };
};

// Free vision models on OpenRouter — tries each in order until one succeeds
const MODELS = [
  "nex-agi/nex-n2-pro:free",
  "google/gemma-3-27b-it:free",
  "google/gemma-3-12b-it:free",
  "google/gemma-3n-e4b-it:free",
];

export type LessonInput = {
  imageBase64?: string;
  mimeType?: string;
  userText?: string;
  targetLanguage: string;
  nativeLanguage: string;
  level: LanguageLevel;
  /** Topics already covered for this user+language — avoid repeating them. */
  avoidTopics?: string[];
  /** Today's date, e.g. "17 June" — for the calendar/almanac section. */
  today?: string;
};

export async function generateLesson(input: LessonInput): Promise<GeneratedLesson> {
  const { imageBase64, mimeType, userText, targetLanguage, nativeLanguage, level, avoidTopics = [], today = "" } = input;
  const targetLang = LANGUAGES.find((l) => l.code === targetLanguage)?.name ?? targetLanguage;
  const nativeLang = LANGUAGES.find((l) => l.code === nativeLanguage)?.name ?? nativeLanguage;

  const hasImage = !!imageBase64;
  const hasText = !!userText?.trim();

  // What is the lesson based on?
  const sourceDescription = hasImage && hasText
    ? "the photo AND the note the learner wrote below"
    : hasImage
    ? "the photo"
    : "the note the learner wrote below";

  const avoidBlock = avoidTopics.length > 0
    ? `\nThe learner has RECENTLY had lessons about these topics — do NOT pick any of them again, choose something fresh:\n${avoidTopics.map((t) => `- ${t}`).join("\n")}\n`
    : "";

  const userTextBlock = hasText
    ? `\nThe learner's note: "${userText!.trim()}"\n`
    : "";

  const prompt = `You are an engaging, creative language teacher. Based on ${sourceDescription}, create a rich, interesting micro-lesson in ${targetLang} for a ${level} level student whose native language is ${nativeLang}.
${userTextBlock}${avoidBlock}
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
  "cultural_note": "A rich cultural insight about the topic in ${nativeLang} — 4 to 5 sentences.",
  "cultural_note_target": "The SAME cultural note, written in ${targetLang} (a faithful translation, natural for the level).",
  "history": {
    "date_label": "${today || "today"}",
    "on_this_day": {"native": "in ${nativeLang}: an interesting event that happened in a country where ${targetLang} is spoken, ideally around this date", "target": "the same in ${targetLang}"},
    "figure": {"native": "in ${nativeLang}: a notable historical figure from that culture (ideally with a birthday/anniversary near this date) and why they matter", "target": "the same in ${targetLang}"},
    "geo_fact": {"native": "in ${nativeLang}: a vivid geographical fact about a region/place in that country (e.g. a description of Bavaria, Andalusia, etc.)", "target": "the same in ${targetLang}"},
    "holiday": {"native": "in ${nativeLang}: a holiday or tradition celebrated around this date (or another notable one) — omit this whole field if none fits", "target": "the same in ${targetLang}"}
  }
}

Rules:
- Choose exactly 6 words most relevant to the chosen topic, appropriate for ${level} level, with an accurate "pos" (part of speech) for each
- Provide exactly 4 grammar constructions; they should use vocabulary from the words list
- cultural_note and cultural_note_target must be the same content in the two languages, 4-5 sentences, genuinely insightful
- The "history" section is a daily "calendar page" about the country/culture of ${targetLang}; make each item concrete and real, 1-2 sentences, accurate, and tie to the date "${today}" where natural
- Every bilingual field MUST contain both "native" (${nativeLang}) and "target" (${targetLang})
- All content must be accurate`;

  // Build the multimodal message content (OpenRouter / OpenAI-compatible)
  const content: Array<Record<string, unknown>> = [];
  if (hasImage) {
    content.push({ type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } });
  }
  content.push({ type: "text", text: prompt });

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
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content }],
        }),
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
      if (!jsonMatch) {
        errors.push(`[${model}] No JSON in response`);
        continue;
      }

      return JSON.parse(jsonMatch[0]) as GeneratedLesson;
    } catch (err) {
      const msg = `[${model}] ${err instanceof Error ? err.message : String(err)}`;
      errors.push(msg);
      console.warn(msg);
    }
  }

  throw new Error("All models failed:\n" + errors.join("\n"));
}
