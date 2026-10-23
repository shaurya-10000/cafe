import type { useSupabaseClient } from "@/utils/supabase/client";

export type SupabaseClientLike = ReturnType<typeof useSupabaseClient>;

export type AdminBookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled";

export type BookingAction = "confirm" | "reject" | "complete";

export interface RawAdminBooking {
  id: string;
  user_name?: string | null;
  user_email?: string | null;
  booking_date?: string | null;
  booking_time?: string | null;
  party_size?: number | null;
  status?: string | null;
  special_requests?: string | null;
  business_locations?: { name?: string | null } | null;
}

export interface AdminDisplayBooking {
  id: string;
  guestName: string;
  guestEmail: string;
  dateLabel: string;
  timeLabel: string;
  partySize: number;
  status: AdminBookingStatus;
  specialRequests: string | null;
  locationName: string | null;
}

export interface AdminReservationsTabProps {
  bookings: RawAdminBooking[];
  onRefresh: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export interface SupabaseLikeError {
  code?: string;
  message?: string;
}
