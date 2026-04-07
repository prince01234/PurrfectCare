import request from "supertest";

import { ADMIN, USER } from "../constants/roles.js";
import { bearerToken } from "./helpers/auth.js";
import { getTestApp } from "./helpers/testApp.js";
import { serviceBookingFixtures } from "./fixtures/serviceBooking.js";
import {
  createBooking,
  createServiceProvider,
  createUniqueEmail,
  createUser,
  getFutureDate,
} from "./helpers/factories.js";

const buildTimeSlotPayload = (providerId) => ({
  providerId: providerId.toString(),
  date: getFutureDate(2).toISOString(),
  startTime: "10:00",
  endTime: "10:30",
  serviceOption: serviceBookingFixtures.bookingPayload.serviceOption,
  notes: serviceBookingFixtures.bookingPayload.notes,
  paymentMethod: "cod",
});

describe("Module 5: Service and Booking", () => {
  let app;

  beforeAll(async () => {
    app = await getTestApp();
  });

  test("46. Get providers returns success", async () => {
    const { user: providerUser } = await createUser({
      name: "Providers Public User",
      email: createUniqueEmail("providers-public"),
      roles: ADMIN,
      serviceType: "veterinary",
      isVerified: true,
      isActive: true,
    });

    await createServiceProvider(providerUser._id, {
      ...serviceBookingFixtures.providerProfilePayload,
    });

    const response = await request(app).get("/api/service-providers");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.providers)).toBe(true);
    expect(response.body.providers.length).toBe(1);
  });

  test("47. Admin or provider profile access returns success", async () => {
    const { user: providerUser } = await createUser({
      name: "Provider Profile User",
      email: createUniqueEmail("provider-profile"),
      roles: ADMIN,
      serviceType: "veterinary",
      isVerified: true,
      isActive: true,
    });

    await createServiceProvider(providerUser._id, {
      ...serviceBookingFixtures.providerProfilePayload,
      name: "Provider Profile Access",
    });

    const response = await request(app)
      .get("/api/service-providers/me")
      .set("Authorization", bearerToken(providerUser));

    expect(response.status).toBe(200);
    expect(response.body.userId._id.toString()).toBe(
      providerUser._id.toString(),
    );
  });

  test("48. Non-admin analytics access returns forbidden", async () => {
    const { user } = await createUser({
      name: "Non Admin Analytics User",
      email: createUniqueEmail("non-admin-analytics"),
      roles: USER,
      isVerified: true,
      isActive: true,
    });

    const response = await request(app)
      .get("/api/service-providers/me/analytics")
      .set("Authorization", bearerToken(user));

    expect(response.status).toBe(403);
    expect(response.body.error).toMatch(/access denied/i);
  });

  test("49. Create booking returns success", async () => {
    const { user: providerUser } = await createUser({
      name: "Create Booking Provider",
      email: createUniqueEmail("create-booking-provider"),
      roles: ADMIN,
      serviceType: "veterinary",
      isVerified: true,
      isActive: true,
    });

    const provider = await createServiceProvider(providerUser._id, {
      ...serviceBookingFixtures.providerProfilePayload,
      name: "Create Booking Provider Profile",
    });

    const { user } = await createUser({
      name: "Create Booking User",
      email: createUniqueEmail("create-booking-user"),
      roles: USER,
      isVerified: true,
      isActive: true,
    });

    const response = await request(app)
      .post("/api/bookings")
      .set("Authorization", bearerToken(user))
      .send(buildTimeSlotPayload(provider._id));

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("pending");
  });

  test("50. Get user bookings returns success", async () => {
    const { user: providerUser } = await createUser({
      name: "User Bookings Provider",
      email: createUniqueEmail("user-bookings-provider"),
      roles: ADMIN,
      serviceType: "veterinary",
      isVerified: true,
      isActive: true,
    });

    const provider = await createServiceProvider(providerUser._id, {
      ...serviceBookingFixtures.providerProfilePayload,
      name: "User Bookings Provider Profile",
    });

    const { user } = await createUser({
      name: "User Bookings User",
      email: createUniqueEmail("user-bookings-user"),
      roles: USER,
      isVerified: true,
      isActive: true,
    });

    await createBooking(user._id, provider._id, {
      date: getFutureDate(3),
      startTime: "11:00",
      endTime: "11:30",
      serviceOption: serviceBookingFixtures.bookingPayload.serviceOption,
      status: "pending",
    });

    const response = await request(app)
      .get("/api/bookings/my")
      .set("Authorization", bearerToken(user));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.bookings)).toBe(true);
    expect(response.body.bookings.length).toBe(1);
  });

  test("51. Provider bookings returns success", async () => {
    const { user: providerUser } = await createUser({
      name: "Provider Bookings Provider",
      email: createUniqueEmail("provider-bookings-provider"),
      roles: ADMIN,
      serviceType: "veterinary",
      isVerified: true,
      isActive: true,
    });

    const provider = await createServiceProvider(providerUser._id, {
      ...serviceBookingFixtures.providerProfilePayload,
      name: "Provider Bookings Profile",
    });

    const { user } = await createUser({
      name: "Provider Bookings User",
      email: createUniqueEmail("provider-bookings-user"),
      roles: USER,
      isVerified: true,
      isActive: true,
    });

    await createBooking(user._id, provider._id, {
      date: getFutureDate(4),
      startTime: "09:30",
      endTime: "10:00",
      serviceOption: serviceBookingFixtures.bookingPayload.serviceOption,
      status: "pending",
    });

    const response = await request(app)
      .get("/api/bookings/provider")
      .set("Authorization", bearerToken(providerUser));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.bookings)).toBe(true);
    expect(response.body.bookings.length).toBe(1);
  });

  test("52. Confirm booking returns success", async () => {
    const { user: providerUser } = await createUser({
      name: "Confirm Booking Provider",
      email: createUniqueEmail("confirm-booking-provider"),
      roles: ADMIN,
      serviceType: "veterinary",
      isVerified: true,
      isActive: true,
    });

    const provider = await createServiceProvider(providerUser._id, {
      ...serviceBookingFixtures.providerProfilePayload,
      name: "Confirm Booking Profile",
    });

    const { user } = await createUser({
      name: "Confirm Booking User",
      email: createUniqueEmail("confirm-booking-user"),
      roles: USER,
      isVerified: true,
      isActive: true,
    });

    const booking = await createBooking(user._id, provider._id, {
      date: getFutureDate(5),
      startTime: "13:00",
      endTime: "13:30",
      serviceOption: serviceBookingFixtures.bookingPayload.serviceOption,
      status: "pending",
    });

    const response = await request(app)
      .put(`/api/bookings/${booking._id}/confirm`)
      .set("Authorization", bearerToken(providerUser))
      .send({ providerNotes: "See you at the clinic." });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("confirmed");
  });

  test("53. Reject booking returns success", async () => {
    const { user: providerUser } = await createUser({
      name: "Reject Booking Provider",
      email: createUniqueEmail("reject-booking-provider"),
      roles: ADMIN,
      serviceType: "veterinary",
      isVerified: true,
      isActive: true,
    });

    const provider = await createServiceProvider(providerUser._id, {
      ...serviceBookingFixtures.providerProfilePayload,
      name: "Reject Booking Profile",
    });

    const { user } = await createUser({
      name: "Reject Booking User",
      email: createUniqueEmail("reject-booking-user"),
      roles: USER,
      isVerified: true,
      isActive: true,
    });

    const booking = await createBooking(user._id, provider._id, {
      date: getFutureDate(6),
      startTime: "14:00",
      endTime: "14:30",
      serviceOption: serviceBookingFixtures.bookingPayload.serviceOption,
      status: "pending",
    });

    const response = await request(app)
      .put(`/api/bookings/${booking._id}/reject`)
      .set("Authorization", bearerToken(providerUser))
      .send({ providerNotes: "No available slot for this time." });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("rejected");
  });

  test("54. Cancel booking returns success", async () => {
    const { user: providerUser } = await createUser({
      name: "Cancel Booking Provider",
      email: createUniqueEmail("cancel-booking-provider"),
      roles: ADMIN,
      serviceType: "veterinary",
      isVerified: true,
      isActive: true,
    });

    const provider = await createServiceProvider(providerUser._id, {
      ...serviceBookingFixtures.providerProfilePayload,
      name: "Cancel Booking Profile",
    });

    const { user } = await createUser({
      name: "Cancel Booking User",
      email: createUniqueEmail("cancel-booking-user"),
      roles: USER,
      isVerified: true,
      isActive: true,
    });

    const booking = await createBooking(user._id, provider._id, {
      date: getFutureDate(7),
      startTime: "15:00",
      endTime: "15:30",
      serviceOption: serviceBookingFixtures.bookingPayload.serviceOption,
      status: "pending",
    });

    const response = await request(app)
      .put(`/api/bookings/${booking._id}/cancel`)
      .set("Authorization", bearerToken(user));

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("cancelled");
  });

  test("55. Complete booking returns success", async () => {
    const { user: providerUser } = await createUser({
      name: "Complete Booking Provider",
      email: createUniqueEmail("complete-booking-provider"),
      roles: ADMIN,
      serviceType: "veterinary",
      isVerified: true,
      isActive: true,
    });

    const provider = await createServiceProvider(providerUser._id, {
      ...serviceBookingFixtures.providerProfilePayload,
      name: "Complete Booking Profile",
    });

    const { user } = await createUser({
      name: "Complete Booking User",
      email: createUniqueEmail("complete-booking-user"),
      roles: USER,
      isVerified: true,
      isActive: true,
    });

    const booking = await createBooking(user._id, provider._id, {
      date: getFutureDate(8),
      startTime: "16:00",
      endTime: "16:30",
      serviceOption: serviceBookingFixtures.bookingPayload.serviceOption,
      status: "confirmed",
    });

    const response = await request(app)
      .put(`/api/bookings/${booking._id}/complete`)
      .set("Authorization", bearerToken(providerUser));

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("completed");
  });
});
