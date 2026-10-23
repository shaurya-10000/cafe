import type { ActionPayload, PartialActionState } from "@/types/action";

export type {
  ChatWidgetProps,
  Message,
  SuggestedPrompt,
} from "@/components/ai/types";

export interface ConfirmationRequest {
  readonly action: ActionPayload;
  readonly resolve: (ok: boolean) => void;
}

export interface MenuPosition {
  readonly left: number;
  readonly top: number;
}

export type ConsumeReplyResult =
  | { readonly status: "ready"; readonly action: ActionPayload }
  | { readonly status: "ask"; readonly prompt: string }
  | { readonly status: "failed"; readonly prompt: string }
  | null;

export interface UsePendingActionResult {
  readonly pendingState: PartialActionState | null;
  readonly pendingPrompt: string | null;
  readonly beginCollecting: (state: PartialActionState) => void;
  readonly consumeReply: (replyText: string) => ConsumeReplyResult;
  readonly clear: () => void;
}

export type BackpressureStatus = 429 | 503;