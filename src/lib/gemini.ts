import type { LanguageLevel, LessonWord, LessonConstruction } from "@/types";
import { LANGUAGES } from "./constants";

type GeneratedLesson = {
  object_detected: string;
  words: LessonWord[];
  constructions: LessonConstruction[];
  cultural_note: string;
};

// Free vision models on OpenRouter — tries each in order until one succeeds
const MODELS = [
  "nex-agi/nex-n2-pro:free",
  "google/gemma-3-27b-it:free",
  "google/gemma-3-12b-it:free",
  "google/gemma-3n-e4b-it:free",
];

export async function analyzImageAndGenerateLesson(
  imageBase64: string,
  mimeType: string,
  targetLanguage: string,
  nativeLanguage: string,
  level: LanguageLevel
): Promise<GeneratedLesson> {
  const targetLang = LANGUAGES.find((l) => l.code === targetLanguage)?.name ?? targetLanguage;
  const nativeLang = LANGUAGES.find((l) => l.code === nativeLanguage)?.name ?? nativeLanguage;

  const prompt = `You are an engaging language teacher. Analyze this image and create a rich, interesting language lesson in ${targetLang} for a ${level} level student whose native language is ${nativeLang}.

Respond ONLY with a valid JSON object in this exact format:
{
  "object_detected": "main subject of the image in English (1-3 words)",
  "words": [
    {"word": "word in ${targetLang}", "translation": "translation in ${nativeLang}", "pronunciation": "phonetic pronunciation if useful"},
    {"word": "...", "translation": "...", "pronunciation": "..."},
    {"word": "...", "translation": "...", "pronunciation": "..."},
    {"word": "...", "translation": "...", "pronunciation": "..."}
  ],
  "constructions": [
    {"pattern": "grammar pattern in ${targetLang}", "example": "full example sentence in ${targetLang}", "translation": "translation in ${nativeLang}"},
    {"pattern": "...", "example": "...", "translation": "..."}
  ],
  "cultural_note": "A rich cultural insight about the topic — 4 to 5 sentences in ${nativeLang}. Cover: what this thing means to locals, any traditions or customs around it, an interesting historical or regional angle, and something a tourist or learner would not guess."
}

Rules:
- Choose exactly 4 words most relevant to what you see in the image, appropriate for ${level} level
- Constructions should use vocabulary from the words list
- Cultural note must be genuinely insightful, 4-5 sentences minimum
- All content must be accurate`;

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
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: { url: `data:${mimeType};base64,${imageBase64}` },
                },
                { type: "text", text: prompt },
              ],
            },
          ],
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
