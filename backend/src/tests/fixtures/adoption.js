const adoptionFixtures = {
  listingPayload: {
    name: "Snow",
    species: "cat",
    breed: "Siamese",
    gender: "female",
    age: 18,
    description: "Friendly and affectionate cat looking for a loving home.",
    healthInfo: "Vaccinated and dewormed",
    temperament: "Calm and playful",
    location: "Kathmandu",
  },
  secondListingPayload: {
    name: "Rocky",
    species: "dog",
    breed: "Mixed",
    gender: "male",
    age: 24,
    description: "Energetic dog that enjoys long walks and outdoor activities.",
    healthInfo: "Neutered and vaccinated",
    temperament: "Active and social",
    location: "Lalitpur",
  },
  applicationPayload: {
    message:
      "I have experience caring for rescued pets and a safe home environment for this pet.",
    contactPhone: "9800000001",
    contactEmail: "adopter@example.com",
    livingSituation: "house_with_yard",
    hasOtherPets: true,
    otherPetsDetails: "One vaccinated dog",
    hasChildren: false,
  },
};

export { adoptionFixtures };
