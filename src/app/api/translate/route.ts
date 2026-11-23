import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { checkRateLimit } from "@/lib/core/rateLimit";

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
  texts: z.array(z.string().min(1).max(500)).min(1).max(50),
});

export async function POST(req: Request) {
  try {
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";

    const rl = checkRateLimit(`translate:${ip}`);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limited" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
      );
    }

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

    const langName = LANGUAGE_NAMES[targetLanguage] ?? "English";
    const prompt = `Translate each string in the following JSON array into ${langName}.
Rules:
- Return ONLY a valid JSON array of strings with the exact same length (${texts.length}) and order.
- Preserve numbers, currency symbols, brand names ("Cafe"), coupon codes, and placeholders.
- Keep translations natural and concise so they fit UI buttons and labels.

Input JSON array:
${JSON.stringify(texts)}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    const raw = response.text?.trim() ?? "";
    const parsedJson = JSON.parse(raw) as unknown;

    if (
      !Array.isArray(parsedJson) ||
      parsedJson.length !== texts.length ||
      !parsedJson.every((item) => typeof item === "string")
    ) {
      return NextResponse.json({ translations: texts });
    }

    return NextResponse.json({ translations: parsedJson });
  } catch (err) {
    console.error("[translate] failed", err);
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 500 },
    );
  }
}