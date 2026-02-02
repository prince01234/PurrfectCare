// Reminder Type Enum
export const REMINDER_TYPE = {
  FEEDING_SCHEDULE: "feeding_schedule",
  VACCINATION_DUE: "vaccination_due",
  MEDICATION: "medication",
  VET_CHECKUP: "vet_checkup",
  PREVENTIVE_CARE: "preventive_care",
  GROOMING: "grooming",
  HYGIENE_DENTAL: "hygiene_dental",
  CUSTOM: "custom",
};

export const REMINDER_TYPE_ARRAY = Object.values(REMINDER_TYPE);

// Reminder Status Enum
export const REMINDER_STATUS = {
  ACTIVE: "active",
  COMPLETED: "completed",
  SNOOZED: "snoozed",
  DISMISSED: "dismissed",
};

export const REMINDER_STATUS_ARRAY = Object.values(REMINDER_STATUS);

// Reminder Frequency Enum
export const REMINDER_FREQUENCY = {
  ONCE: "once",
  DAILY: "daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
  YEARLY: "yearly",
};

export const REMINDER_FREQUENCY_ARRAY = Object.values(REMINDER_FREQUENCY);

// Reminder Priority Enum (determines email notification)
export const REMINDER_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
};

export const REMINDER_PRIORITY_ARRAY = Object.values(REMINDER_PRIORITY);

// Critical reminder types that should send email notifications
export const EMAIL_NOTIFICATION_TYPES = [
  REMINDER_TYPE.VACCINATION_DUE,
  REMINDER_TYPE.MEDICATION,
];

// Default reminder settings per type
export const REMINDER_DEFAULTS = {
  [REMINDER_TYPE.FEEDING_SCHEDULE]: {
    priority: REMINDER_PRIORITY.LOW,
    frequency: REMINDER_FREQUENCY.DAILY,
    sendEmail: false,
  },
  [REMINDER_TYPE.VACCINATION_DUE]: {
    priority: REMINDER_PRIORITY.CRITICAL,
    frequency: REMINDER_FREQUENCY.ONCE,
    sendEmail: true,
    reminderDaysBefore: [14, 7, 3, 1, 0], // Days before due date to send reminders
  },
  [REMINDER_TYPE.MEDICATION]: {
    priority: REMINDER_PRIORITY.CRITICAL,
    frequency: REMINDER_FREQUENCY.DAILY,
    sendEmail: true,
  },
  [REMINDER_TYPE.VET_CHECKUP]: {
    priority: REMINDER_PRIORITY.MEDIUM,
    frequency: REMINDER_FREQUENCY.YEARLY,
    sendEmail: false,
  },
  [REMINDER_TYPE.PREVENTIVE_CARE]: {
    priority: REMINDER_PRIORITY.MEDIUM,
    frequency: REMINDER_FREQUENCY.MONTHLY,
    sendEmail: false,
  },
  [REMINDER_TYPE.GROOMING]: {
    priority: REMINDER_PRIORITY.LOW,
    frequency: REMINDER_FREQUENCY.WEEKLY,
    sendEmail: false,
  },
  [REMINDER_TYPE.HYGIENE_DENTAL]: {
    priority: REMINDER_PRIORITY.LOW,
    frequency: REMINDER_FREQUENCY.WEEKLY,
    sendEmail: false,
  },
  [REMINDER_TYPE.CUSTOM]: {
    priority: REMINDER_PRIORITY.MEDIUM,
    frequency: REMINDER_FREQUENCY.ONCE,
    sendEmail: false,
  },
};
