import Booking from "../models/Booking.js";
import ServiceProvider from "../models/ServiceProvider.js";
import Pet from "../models/Pet.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import payment from "../utils/payment.js";
import crypto from "crypto";
import {
  BOOKING_STATUS,
  BOOKING_TYPE,
  DATE_RANGE_SERVICES,
} from "../constants/booking.js";
import mongoose from "mongoose";
import inAppNotificationService from "./inAppNotificationService.js";

const { isValidObjectId } = mongoose;

const hasSameServiceOption = (
  existingServiceOption = {},
  incomingServiceOption = {},
) => {
  const existingName =
    existingServiceOption?.name?.trim?.().toLowerCase?.() || null;
  const incomingName =
    incomingServiceOption?.name?.trim?.().toLowerCase?.() || null;

  if (!existingName || !incomingName) {
    return true;
  }

  return existingName === incomingName;
};

const getBookingLabel = (booking, provider = null) => {
  const optionName = booking.serviceOption?.name?.trim();
  if (optionName) {
    return optionName;
  }

  return provider?.name || "your booking";
};

// Create a new booking
const createBooking = async (userId, data) => {
  const {
    providerId,
    petId,
    petIds: petIdsRaw,
    date,
    startTime,
    endTime,
    startDate,
    endDate,
    serviceOption,
    notes,
    paymentMethod,
  } = data;

  // Normalize petId/petIds into a single array
  let petIds = [];
  if (petIdsRaw && Array.isArray(petIdsRaw)) {
    petIds = petIdsRaw;
  } else if (petId) {
    petIds = Array.isArray(petId) ? petId : [petId];
  }

  // Verify provider exists and is active
  const provider = await ServiceProvider.findById(providerId);
  if (!provider) {
    throw { statusCode: 404, message: "Service provider not found" };
  }
  if (!provider.isActive) {
    throw {
      statusCode: 400,
      message: "This service provider is not currently accepting bookings",
    };
  }

  // Cannot book your own service
  if (provider.userId.toString() === userId) {
    throw { statusCode: 400, message: "You cannot book your own service" };
  }

  // Validate pets if provided
  if (petIds.length > 0) {
    const pets = await Pet.find({ _id: { $in: petIds } });
    if (pets.length !== petIds.length) {
      throw { statusCode: 404, message: "One or more pets not found" };
    }
    const allOwned = pets.every((p) => p.userId.toString() === userId);
    if (!allOwned) {
      throw {
        statusCode: 403,
        message: "One or more pets do not belong to you",
      };
    }
  }

  // Determine booking type based on service type
  const isDateRange = DATE_RANGE_SERVICES.includes(provider.serviceType);
  const bookingType = isDateRange
    ? BOOKING_TYPE.DATE_RANGE
    : BOOKING_TYPE.TIME_SLOT;

  const bookingData = {
    userId,
    providerId,
    petIds: petIds,
    bookingType,
    notes: notes || null,
    serviceOption: serviceOption || {},
    paymentMethod: paymentMethod || "cod",
    status: BOOKING_STATUS.PENDING,
  };

  if (isDateRange) {
    // Validate date range
    if (!startDate || !endDate) {
      throw {
        statusCode: 400,
        message:
          "Start date and end date are required for pet sitting bookings",
      };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (start < now) {
      throw { statusCode: 400, message: "Start date cannot be in the past" };
    }
    if (end <= start) {
      throw {
        statusCode: 400,
        message: "End date must be after start date",
      };
    }

    // Check for overlapping approved date ranges
    const overlap = await Booking.findOne({
      providerId,
      bookingType: BOOKING_TYPE.DATE_RANGE,
      status: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED] },
      $or: [{ startDate: { $lte: end }, endDate: { $gte: start } }],
    });

    if (overlap) {
      throw {
        statusCode: 409,
        message:
          "This provider already has a booking during the selected date range",
      };
    }

    bookingData.startDate = start;
    bookingData.endDate = end;
  } else {
    // Validate time slot
    if (!date || !startTime || !endTime) {
      throw {
        statusCode: 400,
        message: "Date, start time, and end time are required",
      };
    }

    const bookingDate = new Date(date);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (bookingDate < now) {
      throw { statusCode: 400, message: "Booking date cannot be in the past" };
    }

    // Check for double-booking of same slot (only conflicting for same service option)
    const potentialConflicts = await Booking.find({
      providerId,
      bookingType: BOOKING_TYPE.TIME_SLOT,
      date: bookingDate,
      startTime,
      status: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED] },
    }).select("serviceOption");

    const conflict = potentialConflicts.find((existingBooking) =>
      hasSameServiceOption(existingBooking.serviceOption, serviceOption),
    );

    if (conflict) {
      throw {
        statusCode: 409,
        message: "This time slot is already booked for the selected service",
      };
    }

    bookingData.date = bookingDate;
    bookingData.startTime = startTime;
    bookingData.endTime = endTime;
  }

  const booking = await Booking.create(bookingData);

  const populatedBooking = await booking.populate([
    { path: "providerId", select: "name serviceType image" },
    { path: "petIds", select: "name species photos" },
    { path: "userId", select: "name email profileImage" },
  ]);

  await inAppNotificationService.createNotification({
    userId: provider.userId,
    type: "booking",
    title: "New booking request",
    body: `${populatedBooking.userId?.name || "A customer"} requested ${getBookingLabel(populatedBooking, provider)}.`,
    entityId: populatedBooking._id.toString(),
    entityType: "booking",
    data: {
      bookingId: populatedBooking._id.toString(),
      providerId: provider._id.toString(),
      providerName: provider.name,
      customerId: populatedBooking.userId?._id?.toString() || userId,
      customerName: populatedBooking.userId?.name || "Customer",
    },
  });

  return populatedBooking;
};

// Get bookings for a user
const getUserBookings = async (userId, queryParams = {}) => {
  const { page = 1, limit = 20, status } = queryParams;

  const filter = {
    userId,
    $or: [{ paymentMethod: { $ne: "khalti" } }, { paymentStatus: "completed" }],
  };
  if (status) {
    filter.status = status;
  }

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const skip = (pageNum - 1) * limitNum;

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate("providerId", "name serviceType image phone address")
      .populate("petIds", "name species photos")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Booking.countDocuments(filter),
  ]);

  return {
    bookings,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

// Get bookings for a provider
const getProviderBookings = async (userId, queryParams = {}) => {
  const { page = 1, limit = 20, status } = queryParams;

  // Find provider by userId
  const provider = await ServiceProvider.findOne({ userId });
  if (!provider) {
    throw { statusCode: 404, message: "Service provider profile not found" };
  }

  const filter = {
    providerId: provider._id,
    $or: [{ paymentMethod: { $ne: "khalti" } }, { paymentStatus: "completed" }],
  };
  if (status) {
    filter.status = status;
  }

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const skip = (pageNum - 1) * limitNum;

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate("userId", "name email profileImage phoneNumber")
      .populate("petIds", "name species photos")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Booking.countDocuments(filter),
  ]);

  return {
    bookings,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

// Get single booking by ID
const getBookingById = async (bookingId, userId) => {
  const booking = await Booking.findById(bookingId)
    .populate("providerId", "name serviceType image phone address userId")
    .populate("petIds", "name species photos")
    .populate("userId", "name email profileImage");

  if (!booking) {
    throw { statusCode: 404, message: "Booking not found" };
  }

  // Check access: must be the booking user or the provider
  const isBookingUser = booking.userId._id.toString() === userId;
  const isProvider = booking.providerId.userId?.toString() === userId;

  if (!isBookingUser && !isProvider) {
    throw { statusCode: 403, message: "Access denied" };
  }

  return booking;
};

// Confirm a booking (provider only)
const confirmBooking = async (bookingId, userId, providerNotes) => {
  const booking = await Booking.findById(bookingId).populate("providerId");

  if (!booking) {
    throw { statusCode: 404, message: "Booking not found" };
  }

  // Verify the user is the provider
  if (booking.providerId.userId.toString() !== userId) {
    throw {
      statusCode: 403,
      message: "Only the service provider can confirm bookings",
    };
  }

  if (booking.status !== BOOKING_STATUS.PENDING) {
    throw {
      statusCode: 400,
      message: `Cannot confirm a booking that is ${booking.status}`,
    };
  }

  booking.status = BOOKING_STATUS.CONFIRMED;
  if (providerNotes) booking.providerNotes = providerNotes;
  await booking.save();

  const populatedBooking = await booking.populate([
    { path: "userId", select: "name email profileImage" },
    { path: "petIds", select: "name species photos" },
  ]);

  await inAppNotificationService.createNotification({
    userId: populatedBooking.userId?._id?.toString() || booking.userId.toString(),
    type: "booking",
    title: "Booking confirmed",
    body: `${booking.providerId.name || "Your provider"} confirmed ${getBookingLabel(booking, booking.providerId)}.`,
    entityId: booking._id.toString(),
    entityType: "booking",
    data: {
      bookingId: booking._id.toString(),
      providerId: booking.providerId._id.toString(),
      providerName: booking.providerId.name,
    },
  });

  return populatedBooking;
};

// Reject a booking (provider only)
const rejectBooking = async (bookingId, userId, providerNotes) => {
  const booking = await Booking.findById(bookingId).populate("providerId");

  if (!booking) {
    throw { statusCode: 404, message: "Booking not found" };
  }

  if (booking.providerId.userId.toString() !== userId) {
    throw {
      statusCode: 403,
      message: "Only the service provider can reject bookings",
    };
  }

  if (booking.status !== BOOKING_STATUS.PENDING) {
    throw {
      statusCode: 400,
      message: `Cannot reject a booking that is ${booking.status}`,
    };
  }

  booking.status = BOOKING_STATUS.REJECTED;
  if (providerNotes) booking.providerNotes = providerNotes;
  await booking.save();

  const populatedBooking = await booking.populate([
    { path: "userId", select: "name email profileImage" },
    { path: "petIds", select: "name species photos" },
  ]);

  await inAppNotificationService.createNotification({
    userId: populatedBooking.userId?._id?.toString() || booking.userId.toString(),
    type: "booking",
    title: "Booking rejected",
    body:
      providerNotes?.trim() ||
      `${booking.providerId.name || "Your provider"} rejected ${getBookingLabel(booking, booking.providerId)}.`,
    entityId: booking._id.toString(),
    entityType: "booking",
    data: {
      bookingId: booking._id.toString(),
      providerId: booking.providerId._id.toString(),
      providerName: booking.providerId.name,
    },
  });

  return populatedBooking;
};

// Cancel a booking (user only, before confirmation)
const cancelBooking = async (bookingId, userId) => {
  const booking = await Booking.findById(bookingId).populate(
    "providerId",
    "name userId",
  );

  if (!booking) {
    throw { statusCode: 404, message: "Booking not found" };
  }

  if (booking.userId.toString() !== userId) {
    throw {
      statusCode: 403,
      message: "You can only cancel your own bookings",
    };
  }

  if (
    booking.status !== BOOKING_STATUS.PENDING &&
    booking.status !== BOOKING_STATUS.CONFIRMED
  ) {
    throw {
      statusCode: 400,
      message: `Cannot cancel a booking that is ${booking.status}`,
    };
  }

  booking.status = BOOKING_STATUS.CANCELLED;
  await booking.save();

  await inAppNotificationService.createNotification({
    userId: booking.providerId.userId.toString(),
    type: "booking",
    title: "Booking cancelled",
    body: "A customer cancelled one of your bookings.",
    entityId: booking._id.toString(),
    entityType: "booking",
    data: {
      bookingId: booking._id.toString(),
      providerId: booking.providerId._id.toString(),
      providerName: booking.providerId.name,
      customerId: booking.userId.toString(),
    },
  });

  return booking;
};

// Complete a booking (provider only)
const completeBooking = async (bookingId, userId) => {
  const booking = await Booking.findById(bookingId).populate("providerId");

  if (!booking) {
    throw { statusCode: 404, message: "Booking not found" };
  }

  if (booking.providerId.userId.toString() !== userId) {
    throw {
      statusCode: 403,
      message: "Only the service provider can mark bookings as completed",
    };
  }

  if (booking.status !== BOOKING_STATUS.CONFIRMED) {
    throw {
      statusCode: 400,
      message: "Only confirmed bookings can be marked as completed",
    };
  }

  booking.status = BOOKING_STATUS.COMPLETED;
  await booking.save();

  const populatedBooking = await booking.populate([
    { path: "userId", select: "name email profileImage" },
    { path: "petIds", select: "name species photos" },
  ]);

  await inAppNotificationService.createNotification({
    userId: populatedBooking.userId?._id?.toString() || booking.userId.toString(),
    type: "booking",
    title: "Booking completed",
    body: `${booking.providerId.name || "Your provider"} marked ${getBookingLabel(booking, booking.providerId)} as completed.`,
    entityId: booking._id.toString(),
    entityType: "booking",
    data: {
      bookingId: booking._id.toString(),
      providerId: booking.providerId._id.toString(),
      providerName: booking.providerId.name,
    },
  });

  return populatedBooking;
};

// Get booked slots for a provider on a specific date (public — for availability checking)
const getBookedSlots = async (providerId, date, serviceOptionName) => {
  const provider = await ServiceProvider.findById(providerId);
  if (!provider) {
    throw { statusCode: 404, message: "Service provider not found" };
  }

  const bookingDate = new Date(date);

  if (DATE_RANGE_SERVICES.includes(provider.serviceType)) {
    // For date-range services, return booked date ranges
    const bookings = await Booking.find({
      providerId,
      bookingType: BOOKING_TYPE.DATE_RANGE,
      status: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED] },
      startDate: { $lte: new Date(date) },
      endDate: { $gte: new Date(date) },
    }).select("startDate endDate status");

    return { bookedRanges: bookings };
  }

  // For time-slot services, return booked slots for the specific date
  const bookings = await Booking.find({
    providerId,
    bookingType: BOOKING_TYPE.TIME_SLOT,
    date: bookingDate,
    status: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED] },
  }).select("startTime endTime status serviceOption");

  const filteredBookings = bookings.filter((booking) => {
    if (!serviceOptionName) return true;
    return hasSameServiceOption(booking.serviceOption, {
      name: serviceOptionName,
    });
  });

  return { bookedSlots: filteredBookings };
};

// Initiate Khalti payment for a booking
const bookingPaymentViaKhalti = async (id, user) => {
  if (!isValidObjectId(id)) {
    throw { statusCode: 400, message: "Invalid booking ID" };
  }

  const booking = await Booking.findById(id)
    .populate("payment")
    .populate("providerId", "name userId serviceType");

  if (!booking) {
    throw { statusCode: 404, message: "Booking not found" };
  }

  if (booking.userId.toString() !== user._id.toString()) {
    throw { statusCode: 403, message: "Access denied." };
  }

  // Calculate total amount
  const numPets = booking.petIds.length || 1;
  const basePrice = booking.serviceOption?.price || 0;
  const totalAmount = basePrice * numPets;

  if (!totalAmount || totalAmount <= 0) {
    throw { statusCode: 400, message: "Invalid booking amount" };
  }

  // Create or reuse payment record
  let bookingPayment = booking.payment;
  if (!bookingPayment || bookingPayment.status === "failed") {
    const transactionId = crypto.randomUUID();
    bookingPayment = await Payment.create({
      amount: totalAmount,
      method: "khalti",
      transactionId,
    });
    await Booking.findByIdAndUpdate(id, {
      payment: bookingPayment._id,
      paymentMethod: "khalti",
    });
  }

  // Fetch full user for customer info
  const fullUser = await User.findById(user._id);

  return await payment.payViaKhalti({
    amount: Math.round(totalAmount * 100), // Khalti expects paisa
    purchaseOrderId: id,
    purchaseOrderName: `PurrfectCare Booking #${booking._id}`,
    customer: fullUser,
    returnPath: `/bookings/${id}/payment/khalti`,
  });
};

// Confirm payment after Khalti callback
const confirmBookingPayment = async (id, status, user) => {
  if (!isValidObjectId(id)) {
    throw { statusCode: 400, message: "Invalid booking ID" };
  }

  const booking = await Booking.findById(id).populate("payment");

  if (!booking) {
    throw { statusCode: 404, message: "Booking not found" };
  }

  if (booking.userId.toString() !== user._id.toString()) {
    throw { statusCode: 403, message: "Access denied." };
  }

  if (!booking.payment) {
    throw {
      statusCode: 400,
      message: "No payment record found for this booking",
    };
  }

  if (status !== "Completed") {
    await Payment.findByIdAndUpdate(booking.payment._id, {
      status: "failed",
    });
    await Booking.findByIdAndUpdate(id, {
      paymentStatus: "failed",
    });

    throw { statusCode: 400, message: "Payment failed." };
  }

  await Payment.findByIdAndUpdate(booking.payment._id, {
    status: "completed",
  });

  const provider =
    booking.providerId?.serviceType && booking.providerId?.userId
      ? booking.providerId
      : await ServiceProvider.findById(booking.providerId).select(
          "serviceType name userId",
        );

  const shouldAutoConfirm = provider && provider.serviceType !== "pet_adoption";

  const updatedBooking = await Booking.findByIdAndUpdate(
    id,
    {
      paymentStatus: "completed",
      ...(shouldAutoConfirm ? { status: BOOKING_STATUS.CONFIRMED } : {}),
    },
    { new: true },
  );

  await inAppNotificationService.createNotification({
    userId: user._id.toString(),
    type: "booking",
    title: "Booking payment confirmed",
    body: shouldAutoConfirm
      ? "Your booking payment was confirmed and the booking is now confirmed."
      : "Your booking payment was confirmed successfully.",
    entityId: updatedBooking._id.toString(),
    entityType: "booking",
    data: {
      bookingId: updatedBooking._id.toString(),
      paymentStatus: "completed",
    },
  });

  if (provider?.userId) {
    await inAppNotificationService.createNotification({
      userId: provider.userId.toString(),
      type: "booking",
      title: "Booking payment received",
      body: shouldAutoConfirm
        ? "A customer paid for a booking and it has been auto-confirmed."
        : "A customer paid for a booking that is awaiting your review.",
      entityId: updatedBooking._id.toString(),
      entityType: "booking",
      data: {
        bookingId: updatedBooking._id.toString(),
        providerId: provider._id?.toString?.() || booking.providerId._id?.toString?.(),
        providerName: provider.name || null,
        paymentStatus: "completed",
      },
    });
  }

  return updatedBooking;
};

export default {
  createBooking,
  getUserBookings,
  getProviderBookings,
  getBookingById,
  confirmBooking,
  rejectBooking,
  cancelBooking,
  completeBooking,
  getBookedSlots,
  bookingPaymentViaKhalti,
  confirmBookingPayment,
};
