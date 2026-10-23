import type { SupabaseClient } from "../types";

/** Returns `null` when the lookup fails; callers keep their current state. */
export async function fetchFavoriteIds(
  supabase: SupabaseClient,
  userId: string,
): Promise<string[] | null> {
  const { data, error } = await supabase
    .from("favorites")
    .select("item_id")
    .eq("user_id", userId);

  if (error || !data) return null;

  return data.map((row: { item_id: string }) => row.item_id);
}

export async function addFavorite(
  supabase: SupabaseClient,
  userId: string,
  itemId: string,
): Promise<void> {
  const { error } = await supabase
    .from("favorites")
    .upsert(
      { user_id: userId, item_id: itemId },
      { onConflict: "user_id,item_id" },
    );

  if (error) throw error;
}

export async function removeFavorite(
  supabase: SupabaseClient,
  userId: string,
  itemId: string,
): Promise<void> {
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("item_id", itemId);

  if (error) throw error;
}
