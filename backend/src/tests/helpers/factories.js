import bcrypt from "bcryptjs";

import User from "../../models/User.js";
import Pet from "../../models/Pet.js";
import AdoptionListing from "../../models/AdoptionListing.js";
import AdoptionApplication from "../../models/AdoptionApplication.js";
import Product from "../../models/Product.js";
import Cart from "../../models/Cart.js";
import Order from "../../models/Order.js";
import Payment from "../../models/Payment.js";
import ServiceProvider from "../../models/ServiceProvider.js";
import Booking from "../../models/Booking.js";
import Notification from "../../models/Notification.js";
import AccountVerification from "../../models/AccountVerification.js";
import ResetPassword from "../../models/ResetPassword.js";
import { USER } from "../../constants/roles.js";
import { BOOKING_TYPE, BOOKING_STATUS } from "../../constants/booking.js";
import {
  LISTING_STATUS,
  APPLICATION_STATUS,
} from "../../constants/adoption.js";

let uniqueCounter = 0;

const createUniqueEmail = (prefix = "user") => {
  uniqueCounter += 1;
  return `${prefix}.${Date.now()}.${uniqueCounter}@example.com`;
};

const createUser = async (overrides = {}) => {
  const password = overrides.password || "Password123!";

  const user = await User.create({
    name: overrides.name || "Test User",
    email: overrides.email || createUniqueEmail("user"),
    password: bcrypt.hashSync(password, 10),
    roles: USER,
    isVerified: true,
    isActive: true,
    ...overrides,
  });

  return { user, password };
};

const createPet = async (userId, overrides = {}) =>
  Pet.create({
    userId,
    name: "Buddy",
    species: "dog",
    gender: "male",
    breed: "Mixed",
    age: 2,
    photos: [],
    ...overrides,
  });

const createAdoptionListing = async (postedBy, overrides = {}) =>
  AdoptionListing.create({
    postedBy,
    name: "Misty",
    species: "cat",
    gender: "female",
    age: 12,
    description: "Calm and friendly pet looking for a caring family.",
    status: LISTING_STATUS.AVAILABLE,
    isDeleted: false,
    ...overrides,
  });

const createAdoptionApplication = async (
  listingId,
  applicantId,
  overrides = {},
) =>
  AdoptionApplication.create({
    listingId,
    applicantId,
    message:
      "I have experience with rescued animals and can provide a safe environment.",
    contactPhone: "9800000010",
    contactEmail: "adopter@example.com",
    livingSituation: "house_with_yard",
    status: APPLICATION_STATUS.PENDING,
    ...overrides,
  });

const createProduct = async (createdBy, overrides = {}) =>
  Product.create({
    createdBy,
    name: "Test Product",
    price: 500,
    category: "food",
    petType: "all",
    stockQty: 20,
    isActive: true,
    images: [],
    ...overrides,
  });

const createCart = async (userId, items = []) =>
  Cart.create({
    userId,
    items,
  });

const createPayment = async (overrides = {}) =>
  Payment.create({
    amount: 1000,
    method: "khalti",
    status: "pending",
    transactionId: `txn-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ...overrides,
  });

const createOrder = async (userId, item, overrides = {}) =>
  Order.create({
    userId,
    items: [
      {
        productId: item.productId,
        quantity: item.quantity || 1,
        priceSnapshot: item.priceSnapshot,
        nameSnapshot: item.nameSnapshot,
        imageSnapshot: item.imageSnapshot || null,
      },
    ],
    totalAmount: (item.priceSnapshot || 0) * (item.quantity || 1),
    paymentMethod: "cod",
    status: "pending",
    ...overrides,
  });

const createServiceProvider = async (userId, overrides = {}) =>
  ServiceProvider.create({
    userId,
    serviceType: "veterinary",
    name: "Test Provider",
    description: "Reliable pet care services",
    isActive: true,
    serviceOptions: [
      {
        name: "General Checkup",
        price: 800,
        duration: 30,
      },
    ],
    availability: [
      {
        day: "monday",
        startTime: "09:00",
        endTime: "17:00",
        isAvailable: true,
      },
    ],
    ...overrides,
  });

const getFutureDate = (daysAhead = 1) => {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  date.setHours(0, 0, 0, 0);
  return date;
};

const createBooking = async (userId, providerId, overrides = {}) =>
  Booking.create({
    userId,
    providerId,
    bookingType: BOOKING_TYPE.TIME_SLOT,
    date: getFutureDate(1),
    startTime: "10:00",
    endTime: "10:30",
    serviceOption: {
      name: "General Checkup",
      price: 800,
      duration: 30,
    },
    status: BOOKING_STATUS.PENDING,
    paymentMethod: "cod",
    ...overrides,
  });

const createNotification = async (userId, overrides = {}) =>
  Notification.create({
    userId,
    type: "booking",
    title: "Test Notification",
    body: "Notification body",
    isRead: false,
    ...overrides,
  });

const createAccountVerification = async (userId, otp) => {
  const otpHash = bcrypt.hashSync(String(otp), 10);

  return AccountVerification.create({
    userId,
    token: `verify-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    otpHash,
    isUsed: false,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });
};

const createResetPasswordRecord = async (userId, otp) => {
  const otpHash = bcrypt.hashSync(String(otp), 10);

  return ResetPassword.create({
    userId,
    token: `reset-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    otpHash,
    isUsed: false,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });
};

export {
  createUniqueEmail,
  createUser,
  createPet,
  createAdoptionListing,
  createAdoptionApplication,
  createProduct,
  createCart,
  createOrder,
  createPayment,
  createServiceProvider,
  createBooking,
  createNotification,
  createAccountVerification,
  createResetPasswordRecord,
  getFutureDate,
};
