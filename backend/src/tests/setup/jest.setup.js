import { jest } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET =
  process.env.JWT_SECRET || "purrfectcare-jwt-test-secret";
process.env.SESSION_SECRET =
  process.env.SESSION_SECRET || "purrfectcare-session-test-secret";
process.env.EMAIL_API_KEY = process.env.EMAIL_API_KEY || "test-email-api-key";
process.env.KHALTI_API_KEY = process.env.KHALTI_API_KEY || "test-khalti-key";
process.env.KHALTI_API_URL =
  process.env.KHALTI_API_URL || "https://khalti.test.local";
process.env.KHALTI_RETURN_URL =
  process.env.KHALTI_RETURN_URL || "http://localhost:3000";
process.env.FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
process.env.APP_URL = process.env.APP_URL || "http://localhost:5000";
process.env.NAME = process.env.NAME || "PurrfectCare Backend";
process.env.PORT = process.env.PORT || "5000";
process.env.VERSION = process.env.VERSION || "test";

jest.mock("../../utils/email.js", () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({ id: "mock-email-id" }),
}));

jest.mock("cloudinary", () => {
  let uploadCounter = 0;

  return {
    __esModule: true,
    v2: {
      config: jest.fn(),
      uploader: {
        upload_stream: jest.fn((options, callback) => ({
          end: () => {
            uploadCounter += 1;
            const url = `https://mock-cloudinary.local/image-${uploadCounter}.jpg`;
            callback(null, {
              secure_url: url,
              url,
              public_id: `mock-image-${uploadCounter}`,
            });
          },
        })),
        destroy: jest.fn().mockResolvedValue({ result: "ok" }),
      },
    },
  };
});

jest.mock("../../services/pushNotificationService.js", () => ({
  __esModule: true,
  default: {
    registerToken: jest
      .fn()
      .mockResolvedValue({ message: "FCM token registered" }),
    removeToken: jest.fn().mockResolvedValue({ message: "FCM token removed" }),
    sendPushNotification: jest.fn().mockResolvedValue(undefined),
  },
}));

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URL = mongoServer.getUri();

  await mongoose.connect(process.env.MONGODB_URL);
});

afterEach(async () => {
  const collections = Object.values(mongoose.connection.collections);

  await Promise.all(collections.map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (mongoServer) {
    await mongoServer.stop();
  }
});
