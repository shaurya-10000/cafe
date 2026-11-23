import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({
        isOpen: true,
        currency: "USD",
        defaultLanguage: "en",
      });
    }

    const supabase = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase
      .from("business_public_settings")
      .select("*")
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({
        isOpen: true,
        currency: "USD",
        defaultLanguage: "en",
      });
    }

    const row = data as Record<string, unknown>;
    return NextResponse.json({
      isOpen: row.is_open !== false,
      currency:
        typeof row.currency === "string" ? row.currency.toUpperCase() : "USD",
      defaultLanguage:
        typeof row.default_language === "string"
          ? row.default_language.toLowerCase()
          : "en",
    });
  } catch {
    return NextResponse.json({
      isOpen: true,
      currency: "USD",
      defaultLanguage: "en",
    });
  }
}