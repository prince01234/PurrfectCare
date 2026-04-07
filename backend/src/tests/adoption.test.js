import request from "supertest";

import { ADMIN, USER } from "../constants/roles.js";
import { bearerToken } from "./helpers/auth.js";
import { getTestApp } from "./helpers/testApp.js";
import { adoptionFixtures } from "./fixtures/adoption.js";
import {
  createAdoptionApplication,
  createAdoptionListing,
  createUniqueEmail,
  createUser,
} from "./helpers/factories.js";

describe("Module 3: Adoption System", () => {
  let app;

  beforeAll(async () => {
    app = await getTestApp();
  });

  test("26. Get all adoption listings returns success", async () => {
    const { user: adminUser } = await createUser({
      name: "Adoption Admin",
      email: createUniqueEmail("adoption-admin"),
      roles: ADMIN,
      serviceType: "pet_adoption",
      isVerified: true,
      isActive: true,
    });

    await createAdoptionListing(adminUser._id, adoptionFixtures.listingPayload);

    const response = await request(app).get("/api/adoption/listings");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.listings)).toBe(true);
    expect(response.body.listings.length).toBe(1);
  });

  test("27. Get single adoption listing returns success", async () => {
    const { user: adminUser } = await createUser({
      name: "Single Listing Admin",
      email: createUniqueEmail("single-listing-admin"),
      roles: ADMIN,
      serviceType: "pet_adoption",
      isVerified: true,
      isActive: true,
    });

    const listing = await createAdoptionListing(
      adminUser._id,
      adoptionFixtures.listingPayload,
    );

    const response = await request(app).get(
      `/api/adoption/listings/${listing._id}`,
    );

    expect(response.status).toBe(200);
    expect(response.body._id.toString()).toBe(listing._id.toString());
  });

  test("28. Admin creates adoption listing returns success", async () => {
    const { user: adminUser } = await createUser({
      name: "Create Listing Admin",
      email: createUniqueEmail("create-listing-admin"),
      roles: ADMIN,
      serviceType: "pet_adoption",
      isVerified: true,
      isActive: true,
    });

    const response = await request(app)
      .post("/api/adoption/listings/admin")
      .set("Authorization", bearerToken(adminUser))
      .send({
        ...adoptionFixtures.listingPayload,
        name: "Admin Created Listing",
      });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe("Admin Created Listing");
  });

  test("29. Non-admin creates listing returns forbidden", async () => {
    const { user } = await createUser({
      name: "Normal Listing User",
      email: createUniqueEmail("normal-listing-user"),
      roles: USER,
      isVerified: true,
      isActive: true,
    });

    const response = await request(app)
      .post("/api/adoption/listings/admin")
      .set("Authorization", bearerToken(user))
      .send({
        ...adoptionFixtures.listingPayload,
        name: "Forbidden Listing",
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toMatch(/access denied/i);
  });

  test("30. Apply for adoption as verified user returns success", async () => {
    const { user: adminUser } = await createUser({
      name: "Apply Listing Admin",
      email: createUniqueEmail("apply-listing-admin"),
      roles: ADMIN,
      serviceType: "pet_adoption",
      isVerified: true,
      isActive: true,
    });

    const { user: adopter } = await createUser({
      name: "Verified Adopter",
      email: createUniqueEmail("verified-adopter"),
      roles: USER,
      isVerified: true,
      isActive: true,
    });

    const listing = await createAdoptionListing(
      adminUser._id,
      adoptionFixtures.listingPayload,
    );

    const response = await request(app)
      .post(`/api/adoption/applications/listing/${listing._id}`)
      .set("Authorization", bearerToken(adopter))
      .send(adoptionFixtures.applicationPayload);

    expect(response.status).toBe(201);
    expect(response.body.listingId.toString()).toBe(listing._id.toString());
    expect(response.body.applicantId.toString()).toBe(adopter._id.toString());
  });

  test("31. Apply for adoption as unverified user is blocked", async () => {
    const { user: adminUser } = await createUser({
      name: "Unverified Listing Admin",
      email: createUniqueEmail("unverified-listing-admin"),
      roles: ADMIN,
      serviceType: "pet_adoption",
      isVerified: true,
      isActive: true,
    });

    const { user: unverifiedAdopter } = await createUser({
      name: "Unverified Adopter",
      email: createUniqueEmail("unverified-adopter"),
      roles: USER,
      isVerified: false,
      isActive: true,
    });

    const listing = await createAdoptionListing(
      adminUser._id,
      adoptionFixtures.listingPayload,
    );

    const response = await request(app)
      .post(`/api/adoption/applications/listing/${listing._id}`)
      .set("Authorization", bearerToken(unverifiedAdopter))
      .send(adoptionFixtures.applicationPayload);

    expect(response.status).toBe(403);
    expect(response.body.error).toMatch(/verification required/i);
  });

  test("32. Admin views applications returns success", async () => {
    const { user: adminUser } = await createUser({
      name: "View Applications Admin",
      email: createUniqueEmail("view-applications-admin"),
      roles: ADMIN,
      serviceType: "pet_adoption",
      isVerified: true,
      isActive: true,
    });

    const { user: adopter } = await createUser({
      name: "Application Adopter",
      email: createUniqueEmail("application-adopter"),
      roles: USER,
      isVerified: true,
      isActive: true,
    });

    const listing = await createAdoptionListing(
      adminUser._id,
      adoptionFixtures.listingPayload,
    );

    await createAdoptionApplication(
      listing._id,
      adopter._id,
      adoptionFixtures.applicationPayload,
    );

    const response = await request(app)
      .get("/api/adoption/applications/admin/all")
      .set("Authorization", bearerToken(adminUser));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.applications)).toBe(true);
    expect(response.body.applications.length).toBe(1);
  });

  test("33. Approve adoption application returns success", async () => {
    const { user: adminUser } = await createUser({
      name: "Approve Admin",
      email: createUniqueEmail("approve-admin"),
      roles: ADMIN,
      serviceType: "pet_adoption",
      isVerified: true,
      isActive: true,
    });

    const { user: adopter } = await createUser({
      name: "Approve Adopter",
      email: createUniqueEmail("approve-adopter"),
      roles: USER,
      isVerified: true,
      isActive: true,
    });

    const listing = await createAdoptionListing(
      adminUser._id,
      adoptionFixtures.listingPayload,
    );

    const application = await createAdoptionApplication(
      listing._id,
      adopter._id,
      adoptionFixtures.applicationPayload,
    );

    const response = await request(app)
      .patch(`/api/adoption/applications/${application._id}/approve`)
      .set("Authorization", bearerToken(adminUser))
      .send({ reviewNotes: "Application approved after review" });

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/approved successfully/i);
    expect(response.body.application.status).toBe("approved");
  });

  test("34. Reject adoption application returns success", async () => {
    const { user: adminUser } = await createUser({
      name: "Reject Admin",
      email: createUniqueEmail("reject-admin"),
      roles: ADMIN,
      serviceType: "pet_adoption",
      isVerified: true,
      isActive: true,
    });

    const { user: adopter } = await createUser({
      name: "Reject Adopter",
      email: createUniqueEmail("reject-adopter"),
      roles: USER,
      isVerified: true,
      isActive: true,
    });

    const listing = await createAdoptionListing(
      adminUser._id,
      adoptionFixtures.secondListingPayload,
    );

    const application = await createAdoptionApplication(
      listing._id,
      adopter._id,
      adoptionFixtures.applicationPayload,
    );

    const response = await request(app)
      .patch(`/api/adoption/applications/${application._id}/reject`)
      .set("Authorization", bearerToken(adminUser))
      .send({ reviewNotes: "Application rejected due to mismatch" });

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/rejected successfully/i);
    expect(response.body.application.status).toBe("rejected");
  });
});
