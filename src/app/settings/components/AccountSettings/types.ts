import type { useUser } from "@clerk/nextjs";
import type { useSupabaseClient } from "@/utils/supabase/client";

export type AccountTab = "profile" | "security";

export interface AccountSettingsProps {
  activeTab?: AccountTab;
}

/** Denormalized copy of the Clerk identity, kept in sync by the webhook. */
export interface Profile {
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

export interface Banner {
  type: "success" | "error";
  message: string;
}

export type ProfileUpdateResult =
  | { status: "updated"; fullName: string }
  /** Zero rows matched: the webhook-created profile row does not exist yet. */
  | { status: "missing" };

export type ClerkUser = NonNullable<ReturnType<typeof useUser>["user"]>;

export type SupabaseClient = ReturnType<typeof useSupabaseClient>;
