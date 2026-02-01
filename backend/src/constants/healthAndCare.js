// Vaccination Status Enum
export const VACCINATION_STATUS = {
  COMPLETED: "completed",
  UPCOMING: "upcoming",
  OVERDUE: "overdue",
};

export const VACCINATION_STATUS_ARRAY = Object.values(VACCINATION_STATUS);

// Care Log Type Enum
export const CARE_TYPE = {
  FEEDING: "feeding",
  GROOMING: "grooming",
  CHECKUP: "checkup",
  EXERCISE: "exercise",
  MEDICATION: "medication",
  BATHING: "bathing",
  NAIL_TRIMMING: "nail_trimming",
  TEETH_CLEANING: "teeth_cleaning",
  OTHER: "other",
};

export const CARE_TYPE_ARRAY = Object.values(CARE_TYPE);
