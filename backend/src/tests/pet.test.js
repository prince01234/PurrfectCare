import request from "supertest";

import { bearerToken } from "./helpers/auth.js";
import { getTestApp } from "./helpers/testApp.js";
import { petFixtures } from "./fixtures/pets.js";
import { createPet, createUser } from "./helpers/factories.js";

describe("Module 2: Pet Management", () => {
  let app;

  beforeAll(async () => {
    app = await getTestApp();
  });

  test("16. Get pet statistics returns success", async () => {
    const { user } = await createUser({
      name: "Pet Stats User",
      isVerified: true,
      isActive: true,
    });

    await createPet(user._id, petFixtures.createPayload);
    await createPet(user._id, petFixtures.secondPetPayload);

    const response = await request(app)
      .get("/api/pets/stats")
      .set("Authorization", bearerToken(user));

    expect(response.status).toBe(200);
    expect(response.body.totalPets).toBe(2);
  });

  test("17. Get all pets returns success", async () => {
    const { user } = await createUser({
      name: "Get Pets User",
      isVerified: true,
      isActive: true,
    });

    await createPet(user._id, petFixtures.createPayload);

    const response = await request(app)
      .get("/api/pets")
      .set("Authorization", bearerToken(user));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.pets)).toBe(true);
    expect(response.body.pets.length).toBe(1);
  });

  test("18. Get single pet by ID returns success", async () => {
    const { user } = await createUser({
      name: "Get Pet By ID User",
      isVerified: true,
      isActive: true,
    });

    const pet = await createPet(user._id, petFixtures.createPayload);

    const response = await request(app)
      .get(`/api/pets/${pet._id}`)
      .set("Authorization", bearerToken(user));

    expect(response.status).toBe(200);
    expect(response.body._id.toString()).toBe(pet._id.toString());
  });

  test("19. Create pet with verified user returns success", async () => {
    const { user } = await createUser({
      name: "Verified Pet Creator",
      isVerified: true,
      isActive: true,
    });

    const response = await request(app)
      .post("/api/pets")
      .set("Authorization", bearerToken(user))
      .send({
        ...petFixtures.createPayload,
        name: "Verified Pet Creation",
      });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe("Verified Pet Creation");
  });

  test("20. Create pet with unverified user is blocked", async () => {
    const { user } = await createUser({
      name: "Unverified Pet Creator",
      isVerified: false,
      isActive: true,
    });

    const response = await request(app)
      .post("/api/pets")
      .set("Authorization", bearerToken(user))
      .send({
        ...petFixtures.createPayload,
        name: "Blocked Pet Creation",
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toMatch(/verification required/i);
  });

  test("21. Update pet details returns success", async () => {
    const { user } = await createUser({
      name: "Update Pet User",
      isVerified: true,
      isActive: true,
    });

    const pet = await createPet(user._id, petFixtures.createPayload);

    const response = await request(app)
      .put(`/api/pets/${pet._id}`)
      .set("Authorization", bearerToken(user))
      .send(petFixtures.updatePayload);

    expect(response.status).toBe(200);
    expect(response.body.name).toBe(petFixtures.updatePayload.name);
  });

  test("22. Add pet photo returns success", async () => {
    const { user } = await createUser({
      name: "Add Photo User",
      isVerified: true,
      isActive: true,
    });

    const pet = await createPet(user._id, {
      ...petFixtures.createPayload,
      name: "Photo Pet",
      photos: [],
    });

    const response = await request(app)
      .post(`/api/pets/${pet._id}/photos`)
      .set("Authorization", bearerToken(user))
      .attach("photos", Buffer.from("image-bytes"), "pet-photo.jpg");

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/photos added successfully/i);
    expect(response.body.pet.photos.length).toBeGreaterThan(0);
  });

  test("23. Delete pet photo returns success", async () => {
    const { user } = await createUser({
      name: "Delete Photo User",
      isVerified: true,
      isActive: true,
    });

    const pet = await createPet(user._id, {
      ...petFixtures.createPayload,
      name: "Delete Photo Pet",
      photos: [petFixtures.existingPhotoUrl],
    });

    const response = await request(app)
      .delete(`/api/pets/${pet._id}/photos`)
      .set("Authorization", bearerToken(user))
      .send({ photoUrl: petFixtures.existingPhotoUrl });

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/photo deleted successfully/i);
    expect(response.body.pet.photos).toHaveLength(0);
  });

  test("24. Soft delete pet returns success", async () => {
    const { user } = await createUser({
      name: "Soft Delete User",
      isVerified: true,
      isActive: true,
    });

    const pet = await createPet(user._id, {
      ...petFixtures.createPayload,
      name: "Soft Delete Pet",
    });

    const response = await request(app)
      .delete(`/api/pets/${pet._id}`)
      .set("Authorization", bearerToken(user));

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/soft deleted successfully/i);
  });

  test("25. Restore pet returns success", async () => {
    const { user } = await createUser({
      name: "Restore Pet User",
      isVerified: true,
      isActive: true,
    });

    const pet = await createPet(user._id, {
      ...petFixtures.createPayload,
      name: "Restore Pet",
    });

    await request(app)
      .delete(`/api/pets/${pet._id}`)
      .set("Authorization", bearerToken(user));

    const response = await request(app)
      .patch(`/api/pets/${pet._id}/restore`)
      .set("Authorization", bearerToken(user));

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/restored successfully/i);
    expect(response.body.pet.isDeleted).toBe(false);
  });
});
