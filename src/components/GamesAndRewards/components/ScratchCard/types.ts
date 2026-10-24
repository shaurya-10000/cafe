/**
 * - `ready`:    the card can be scratched.
 * - `locked`:   the user must sign in first; touching the card triggers `onLockedPress`.
 * - `disabled`: temporarily inert (loading, unavailable, or a claim in flight).
 */
export type ScratchMode = "ready" | "locked" | "disabled";

export interface Point {
  readonly x: number;
  readonly y: number;
}