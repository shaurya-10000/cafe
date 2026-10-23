export interface ReservationData {
  date?: string; time?: string; partySize?: number; locationId?: string;
  guests?: number; branchId?: string; branchName?: string;
}
export interface ReservationActionData { bookingId?: string; }

export type BookingAction =
  | { type: "PREFILL_RESERVATION"; label: string; data?: ReservationData }
  | { type: "CANCEL_BOOKING"; label: string; data?: ReservationActionData }
  | { type: "VIEW_RESERVATIONS"; label: string; data?: Record<string, never> };
