const petFixtures = {
  createPayload: {
    name: "Milo",
    species: "dog",
    breed: "Labrador",
    gender: "male",
    age: 3,
    medicalNotes: "Vaccinated and healthy",
  },
  secondPetPayload: {
    name: "Luna",
    species: "cat",
    breed: "Persian",
    gender: "female",
    age: 2,
    medicalNotes: "Needs regular grooming",
  },
  updatePayload: {
    name: "Milo Updated",
    breed: "Golden Retriever",
    age: 4,
  },
  existingPhotoUrl: "https://mock-cloudinary.local/existing-pet-photo.jpg",
};

export { petFixtures };
