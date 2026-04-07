import request from "supertest";

import { bearerToken } from "./helpers/auth.js";
import { getTestApp } from "./helpers/testApp.js";
import { notificationFixtures } from "./fixtures/notifications.js";
import {
  createNotification,
  createUniqueEmail,
  createUser,
} from "./helpers/factories.js";

describe("Module 6: Notifications", () => {
  let app;

  beforeAll(async () => {
    app = await getTestApp();
  });

  test("56. Get notifications returns success", async () => {
    const { user } = await createUser({
      name: "Get Notifications User",
      email: createUniqueEmail("get-notifications-user"),
      isVerified: true,
      isActive: true,
    });

    await createNotification(user._id, notificationFixtures.unreadNotification);

    const response = await request(app)
      .get("/api/notifications")
      .set("Authorization", bearerToken(user));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.notifications)).toBe(true);
    expect(response.body.notifications.length).toBe(1);
  });

  test("57. Get unread count returns success", async () => {
    const { user } = await createUser({
      name: "Unread Count User",
      email: createUniqueEmail("unread-count-user"),
      isVerified: true,
      isActive: true,
    });

    await createNotification(user._id, notificationFixtures.unreadNotification);
    await createNotification(
      user._id,
      notificationFixtures.secondUnreadNotification,
    );

    const response = await request(app)
      .get("/api/notifications/unread-count")
      .set("Authorization", bearerToken(user));

    expect(response.status).toBe(200);
    expect(response.body.unreadCount).toBe(2);
  });

  test("58. Mark one notification as read returns success", async () => {
    const { user } = await createUser({
      name: "Mark One Notification User",
      email: createUniqueEmail("mark-one-notification-user"),
      isVerified: true,
      isActive: true,
    });

    const notification = await createNotification(
      user._id,
      notificationFixtures.unreadNotification,
    );

    const response = await request(app)
      .put(`/api/notifications/${notification._id}/read`)
      .set("Authorization", bearerToken(user));

    expect(response.status).toBe(200);
    expect(response.body.isRead).toBe(true);
  });

  test("59. Mark all notifications as read returns success", async () => {
    const { user } = await createUser({
      name: "Mark All Notification User",
      email: createUniqueEmail("mark-all-notification-user"),
      isVerified: true,
      isActive: true,
    });

    await createNotification(user._id, notificationFixtures.unreadNotification);
    await createNotification(
      user._id,
      notificationFixtures.secondUnreadNotification,
    );

    const response = await request(app)
      .put("/api/notifications/read-all")
      .set("Authorization", bearerToken(user));

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/marked as read/i);
  });
});
