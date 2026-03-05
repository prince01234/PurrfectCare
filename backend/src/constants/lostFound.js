// Lost & Found Post Types
export const POST_TYPE = {
  LOST: "lost",
  FOUND: "found",
};

export const POST_TYPE_ARRAY = Object.values(POST_TYPE);

// Lost & Found Post Statuses
export const POST_STATUS = {
  ACTIVE: "active",
  RESOLVED: "resolved",
};

export const POST_STATUS_ARRAY = Object.values(POST_STATUS);

// Species options (consistent with Pet model)
export const LOST_FOUND_SPECIES = [
  "dog",
  "cat",
  "bird",
  "rabbit",
  "hamster",
  "fish",
  "other",
];
