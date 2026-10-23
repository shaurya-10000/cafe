import { AdminReservationsTab } from "./AdminReservationsTab";

export { AdminReservationsTab };

/**
 * Compat alias: the previous export was named `AdminBookingsTab`. The
 * canonical name now matches the folder (AdminReservationsTab); this alias
 * can be removed once no caller references the old name.
 */
export const AdminBookingsTab = AdminReservationsTab;

export { ACTION_LABELS } from "./constants";

export { formatBookingTime, formatGuestEmail, formatGuestName } from "./lib/format";
export { mapAdminUpdateError } from "./lib/errors";
export { normalizeAdminBooking } from "./lib/normalize";
export {
  countByStatus,
  getActionTargetStatus,
  getAvailableActions,
  getStatusBadgeStyle,
  isValidTransition,
  normalizeAdminStatus,
} from "./lib/status";

export type {
  AdminBookingStatus,
  AdminDisplayBooking,
  AdminReservationsTabProps,
  BookingAction,
  RawAdminBooking,
  SupabaseLikeError,
} from "./types";
