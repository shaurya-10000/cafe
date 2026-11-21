import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export interface SetStoreOpenResult {
  ok: boolean;
  isOpen?: boolean;
  error?: string;
}

export async function updateStoreOpenState(
  isOpen: boolean,
): Promise<SetStoreOpenResult> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, error: "Authentication required." };
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
    .update({ is_open: Boolean(isOpen) })
    .eq("id", true);

  if (error) {
    console.error("[store] failed to toggle is_open", error);
    return { ok: false, error: "Could not update store status." };
  }

  revalidatePath("/");
  revalidatePath("/admin");

  return { ok: true, isOpen: Boolean(isOpen) };
}