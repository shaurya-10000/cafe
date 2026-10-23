import { useCallback, useEffect, useMemo, useState } from "react";

import { useSupabaseClient } from "@/utils/supabase/client";

import { reportHeaderIssue } from "../lib/observability";
import { resolveIsAdmin } from "../lib/user";
import type { AccessState, AuthorizationState } from "../types";

export interface UseAdminRoleResult {
  state: AuthorizationState;
  access: AccessState;
  retry: () => void;
}

const IDLE: AuthorizationState = { status: "idle" };
const LOADING: AuthorizationState = { status: "loading" };

export function useAdminRole(
  userId: string | null | undefined,
): UseAdminRoleResult {
  const supabase = useSupabaseClient();

  const [attempt, setAttempt] = useState(0);
  // The settled outcome, tagged with the lookup that produced it. A result for
  // another user or an earlier attempt reads as "loading", so neither a user
  // change nor retry() has to set state synchronously inside the effect.
  const [result, setResult] = useState<{
    key: string;
    state: AuthorizationState;
  } | null>(null);

  const key = userId ? `${userId}:${attempt}` : null;

  useEffect(() => {
    if (!userId || key === null) return;

    let cancelled = false;

    const settle = (next: AuthorizationState): void => {
      if (!cancelled) setResult({ key, state: next });
    };

    const resolveAuthorization = async (): Promise<void> => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          reportHeaderIssue("authorization_lookup_error", {
            code: error.code,
          });

          settle({ status: "error", reason: error.code });
          return;
        }

        if (!data) {
          settle({ status: "unauthorized" });
          return;
        }

        settle(
          resolveIsAdmin(data.role)
            ? { status: "authorized" }
            : { status: "unauthorized" },
        );
      } catch (error) {
        if (cancelled) return;

        reportHeaderIssue("authorization_lookup_exception", {
          name: error instanceof Error ? error.name : "unknown",
        });

        settle({ status: "error" });
      }
    };

    void resolveAuthorization();

    return () => {
      cancelled = true;
    };
  }, [key, supabase, userId]);

  const retry = useCallback(() => {
    setAttempt((current) => current + 1);
  }, []);

  const state: AuthorizationState = !userId
    ? IDLE
    : result !== null && result.key === key
      ? result.state
      : LOADING;

  const access = useMemo<AccessState>(
    () => ({
      isAdmin: state.status === "authorized",
      isLoading: state.status === "loading",
      isError: state.status === "error",
    }),
    [state.status],
  );

  return { state, access, retry };
}