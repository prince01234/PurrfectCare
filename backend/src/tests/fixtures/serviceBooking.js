const serviceBookingFixtures = {
  providerProfilePayload: {
    name: "Healthy Paws Vet Clinic",
    description: "Experienced veterinary service for pets",
    address: "Baneshwor, Kathmandu",
    latitude: 27.705,
    longitude: 85.334,
    phone: "9800000002",
    email: "clinic@example.com",
    availability: [
      {
        day: "monday",
        startTime: "09:00",
        endTime: "17:00",
        isAvailable: true,
      },
    ],
    serviceOptions: [
      {
        name: "General Checkup",
        description: "Standard veterinary checkup",
        price: 800,
        duration: 30,
      },
    ],
    slotDuration: 30,
  },
  bookingPayload: {
    serviceOption: {
      name: "General Checkup",
      price: 800,
      duration: 30,
    },
    notes: "Pet has mild skin allergy",
    paymentMethod: "cod",
  },
};

export { serviceBookingFixtures };
