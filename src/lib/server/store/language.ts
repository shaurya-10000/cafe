import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const ALLOWED_LANGUAGES = new Set(["en", "hi", "es", "fr"]);

export interface SetStoreLanguageResult {
  ok: boolean;
  language?: string;
  error?: string;
}

export async function updateStoreLanguageState(
  rawLanguage: string,
): Promise<SetStoreLanguageResult> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, error: "Authentication required." };
  }

  const normalized = rawLanguage.trim().toLowerCase();
  if (!ALLOWED_LANGUAGES.has(normalized)) {
    return { ok: false, error: "Unsupported language code." };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return { ok: false, error: "Server configuration missing." };
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || profile?.role !== "admin") {
    return { ok: false, error: "Admin access required." };
  }

  const { error } = await supabaseAdmin
    .from("business_settings")
    .update({ default_language: normalized })
    .eq("id", true);

  if (error) {
    console.error("[store] failed to update default_language", error);
    return { ok: false, error: "Could not update default language." };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/customer");
  revalidatePath("/settings");

  return { ok: true, language: normalized };
}