import { OPEN_NOTIFICATIONS } from "@/lib/core/events";

export interface MinimalUser {
  id?: string;
  fullName?: string | null;
  username?: string | null;
  imageUrl?: string | null;
  primaryEmailAddress?: {
    emailAddress?: string | null;
  } | null;
}

export type AuthorizationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "authorized" }
  | { status: "unauthorized" }
  | { status: "error"; reason?: string };

/** Derived, render-friendly view of the authorization state. */
export interface AccessState {
  isAdmin: boolean;
  isLoading: boolean;
  isError: boolean;
}

export interface OpenNotificationsEventDetail {
  source?: string;
}

export type OpenNotificationsEvent = CustomEvent<OpenNotificationsEventDetail>;

declare global {
  interface WindowEventMap {
    [OPEN_NOTIFICATIONS]: OpenNotificationsEvent;
  }

  interface Window {
    __reportError?: (
      event: string,
      context?: Record<string, unknown>,
    ) => void;
  }
}
