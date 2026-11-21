import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";

import { checkRateLimit } from "@/lib/core/rateLimit";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const subscribeSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address.").max(320),
});

export async function POST(req: Request) {
  try {
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";

    const rl = checkRateLimit(`newsletter:${ip}`);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a moment." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const parsed = subscribeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid email address." },
        { status: 400 },
      );
    }

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Newsletter service is not configured." },
        { status: 503 },
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const email = parsed.data.email.toLowerCase();

    const { error } = await supabase
      .from("newsletter_subscribers")
      .upsert(
        { email, subscribed_at: new Date().toISOString() },
        { onConflict: "email", ignoreDuplicates: true },
      );

    if (error) {
      console.error("[newsletter] subscribe failed", { code: error.code }, error);
      return NextResponse.json(
        { error: "Could not subscribe right now. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "You're subscribed! Thanks for joining.",
    });
  } catch (err) {
    console.error("[newsletter] unexpected error", err);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}