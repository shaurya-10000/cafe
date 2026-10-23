import type { BookingAction, ReservationData } from "../booking";
import type { CartAction, CartData, CheckoutData } from "../cart";
import type { CatalogAction } from "../catalog";
import type { AccountAction, FavoriteData } from "../account";
import type { AdminAction } from "../admin";
import type { ActionType } from "./schemas";

export interface SigninGateData {
  resumeAction?: ActionType;
  resumeData?: ReservationData & CartData & CheckoutData & FavoriteData;
}

export type ActionPayload =
  | { type: "REQUIRE_SIGNIN"; label: string; data?: SigninGateData }
  | BookingAction
  | CartAction
  | CatalogAction
  | AccountAction
  | AdminAction;

export interface PartialActionState {
  readonly type: ActionType;
  readonly collected: Readonly<Record<string, unknown>>;
  readonly missingField: string;
  readonly label: string;
  readonly startedAt: number;
}
