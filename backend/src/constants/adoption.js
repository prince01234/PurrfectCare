// Adoption Listing Status
export const LISTING_STATUS = {
  AVAILABLE: "available",
  ADOPTED: "adopted",
};

export const LISTING_STATUS_ARRAY = Object.values(LISTING_STATUS);

// Adoption Application Status
export const APPLICATION_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

export const APPLICATION_STATUS_ARRAY = Object.values(APPLICATION_STATUS);

// Species options (same as Pet model for consistency)
export const ADOPTION_SPECIES = [
  "dog",
  "cat",
  "bird",
  "rabbit",
  "hamster",
  "fish",
  "other",
];

// Living situation options
export const LIVING_SITUATIONS = [
  "house_with_yard",
  "house_without_yard",
  "apartment",
  "farm",
  "other",
];
