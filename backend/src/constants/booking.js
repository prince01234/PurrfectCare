// Booking status lifecycle
export const BOOKING_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
};

export const BOOKING_STATUSES = [
  BOOKING_STATUS.PENDING,
  BOOKING_STATUS.CONFIRMED,
  BOOKING_STATUS.REJECTED,
  BOOKING_STATUS.CANCELLED,
  BOOKING_STATUS.COMPLETED,
];

// Booking types
export const BOOKING_TYPE = {
  TIME_SLOT: "time_slot",
  DATE_RANGE: "date_range",
};

export const BOOKING_TYPES = [BOOKING_TYPE.TIME_SLOT, BOOKING_TYPE.DATE_RANGE];

// Service types that use date-range bookings
export const DATE_RANGE_SERVICES = ["pet_sitting"];

// Service types that use time-slot bookings
export const TIME_SLOT_SERVICES = [
  "veterinary",
  "grooming",
  "training",
  "other",
];

// All bookable service types (excludes pet_adoption and marketplace)
export const BOOKABLE_SERVICE_TYPES = [
  "veterinary",
  "grooming",
  "training",
  "pet_sitting",
  "other",
];
