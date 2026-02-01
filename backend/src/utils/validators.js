import mongoose from "mongoose";

/**
 * Validate if a string is a valid MongoDB ObjectId
 */
export const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Validate pet creation data
 */
export const validatePetData = (data) => {
  const errors = [];

  // Required fields
  if (!data.name || data.name.trim() === "") {
    errors.push("Pet name is required");
  }

  if (!data.species) {
    errors.push("Species is required");
  }

  if (!data.gender) {
    errors.push("Gender is required");
  }

  // Enum validations
  const validSpecies = [
    "dog",
    "cat",
    "bird",
    "rabbit",
    "hamster",
    "fish",
    "other",
  ];
  if (data.species && !validSpecies.includes(data.species.toLowerCase())) {
    errors.push(`Invalid species. Must be one of: ${validSpecies.join(", ")}`);
  }

  const validGenders = ["male", "female", "unknown"];
  if (data.gender && !validGenders.includes(data.gender.toLowerCase())) {
    errors.push(`Invalid gender. Must be one of: ${validGenders.join(", ")}`);
  }

  // Age validation
  if (data.age !== undefined && data.age !== null) {
    const age = parseInt(data.age);
    if (isNaN(age) || age < 0 || age > 100) {
      errors.push("Age must be a number between 0 and 100");
    }
  }

  // Date of birth validation
  if (data.dateOfBirth) {
    const dob = new Date(data.dateOfBirth);
    if (isNaN(dob.getTime())) {
      errors.push("Invalid date of birth format");
    } else if (dob > new Date()) {
      errors.push("Date of birth cannot be in the future");
    }
  }

  // Photos validation
  if (data.photos && Array.isArray(data.photos)) {
    if (data.photos.length > 10) {
      errors.push("Maximum 10 photos allowed per pet");
    }
    data.photos.forEach((photo, index) => {
      if (typeof photo !== "string" || photo.trim() === "") {
        errors.push(`Invalid photo URL at index ${index}`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Sanitize pet data before saving
 */
export const sanitizePetData = (data) => {
  const sanitized = { ...data };

  // Trim string fields
  if (sanitized.name) sanitized.name = sanitized.name.trim();
  if (sanitized.breed) sanitized.breed = sanitized.breed.trim();
  if (sanitized.medicalNotes)
    sanitized.medicalNotes = sanitized.medicalNotes.trim();

  // Lowercase enums
  if (sanitized.species) sanitized.species = sanitized.species.toLowerCase();
  if (sanitized.gender) sanitized.gender = sanitized.gender.toLowerCase();

  // Remove empty strings and convert to null
  Object.keys(sanitized).forEach((key) => {
    if (sanitized[key] === "") {
      sanitized[key] = null;
    }
  });

  return sanitized;
};
