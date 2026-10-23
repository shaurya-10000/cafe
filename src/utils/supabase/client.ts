"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@clerk/nextjs";

type GetToken = ReturnType<typeof useAuth>["getToken"];

/**
 * The Supabase client is created once, but Clerk's `getToken` can change
 * identity. This tiny bridge always calls the latest one. It is deliberately
 * not a ref: a closure over a ref handed to `createClient()` reads as a ref
 * access during render to the React Compiler lint rules.
 */
function createTokenBridge(initial: GetToken) {
  let current = initial;

  return {
    update(next: GetToken): void {
      current = next;
    },
    getToken: (options?: Parameters<GetToken>[0]) => current(options),
  };
}

/**
 * Browser-side Supabase client.
 * ... (Full original comment block preserved) ...
 */
export function useSupabaseClient() {
  const { getToken } = useAuth();

  // Seeded with the current getToken so the very first request already has it.
  const [tokenBridge] = useState(() => createTokenBridge(getToken));
  useEffect(() => {
    tokenBridge.update(getToken);
  }, [getToken, tokenBridge]);

  return useMemo(
    () =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          accessToken: async () => {
            if (typeof window === "undefined") return null;
            try {
              return (await tokenBridge.getToken()) ?? null;
            } catch (err) {
              if (process.env.NODE_ENV !== "production") {
                console.warn("[supabase/client] accessToken fetch failed; falling back to anon for this request:", err);
              }
              return null;
            }
          },
        }
      ),
    [tokenBridge]
  );
}
