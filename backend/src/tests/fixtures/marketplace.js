const marketplaceFixtures = {
  productPayload: {
    name: "Premium Cat Food",
    description: "Nutritious dry food for adult cats",
    price: 1200,
    category: "food",
    petType: "cat",
    brand: "Purrfect Nutrition",
    stockQty: 25,
  },
  secondProductPayload: {
    name: "Dog Chew Toy",
    description: "Durable chew toy for medium dogs",
    price: 450,
    category: "toys",
    petType: "dog",
    brand: "HappyPaws",
    stockQty: 40,
  },
  cartItemPayload: {
    quantity: 2,
  },
  orderPayload: {
    paymentMethod: "cod",
    deliveryAddress: "Kathmandu, Nepal",
    notes: "Please call before delivery",
  },
};

export { marketplaceFixtures };
