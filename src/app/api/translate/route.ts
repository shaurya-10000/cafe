import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { z } from "zod";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-3.6-flash";
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

const LANGUAGE_NAMES: Record<string, string> = {
  hi: "Hindi",
  es: "Spanish",
  fr: "French",
};

const requestSchema = z.object({
  targetLanguage: z.enum(["hi", "es", "fr"]),
  texts: z.array(z.string().min(1).max(500)).min(1).max(150),
});

// In-memory cache so repeated strings across unsigned visitors don't re-hit Gemini
const serverTranslationCache = new Map<string, string>();
const MAX_CACHE_ENTRIES = 5000;

function stripCodeFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { targetLanguage, texts } = parsed.data;

    if (!ai) {
      return NextResponse.json({ translations: texts });
    }

    const results = new Array<string>(texts.length);
    const missingIndices: number[] = [];
    const missingTexts: string[] = [];

    texts.forEach((text, idx) => {
      const cacheKey = `${targetLanguage}:${text}`;
      const cached = serverTranslationCache.get(cacheKey);
      if (cached !== undefined) {
        results[idx] = cached;
      } else {
        missingIndices.push(idx);
        missingTexts.push(text);
      }
    });

    if (missingTexts.length === 0) {
      return NextResponse.json({ translations: results });
    }

    const langName = LANGUAGE_NAMES[targetLanguage] ?? "English";
    const prompt = `Translate each string in the following JSON array into ${langName}.
Rules:
- Return ONLY a valid JSON array of strings with the exact same length (${missingTexts.length}) and order.
- Preserve numbers, currency symbols, brand names ("Cafe"), coupon codes, and placeholders.
- Keep translations natural and concise so they fit UI buttons and labels.

Input JSON array:
${JSON.stringify(missingTexts)}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    const raw = stripCodeFences(response.text?.trim() ?? "");
    const parsedJson = JSON.parse(raw) as unknown;

    if (
      !Array.isArray(parsedJson) ||
      parsedJson.length !== missingTexts.length ||
      !parsedJson.every((item) => typeof item === "string")
    ) {
      return NextResponse.json({ translations: texts });
    }

    missingIndices.forEach((origIdx, i) => {
      const translated = parsedJson[i] as string;
      results[origIdx] = translated;
      if (serverTranslationCache.size < MAX_CACHE_ENTRIES) {
        serverTranslationCache.set(
          `${targetLanguage}:${missingTexts[i]}`,
          translated,
        );
      }
    });

    return NextResponse.json({ translations: results });
  } catch (err) {
    console.error("[translate] failed", err);
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 500 },
    );
  }
}