import bookingService from "../services/bookingService.js";

// Create a new booking
const createBooking = async (req, res) => {
  try {
    const userId = req.user._id;
    const booking = await bookingService.createBooking(userId, req.body);
    res.status(201).send(booking);
  } catch (error) {
    console.error("Error creating booking:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).send({ error: messages.join(", ") });
    }
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to create booking";
    res.status(statusCode).send({ error: message });
  }
};

// Get user's bookings
const getUserBookings = async (req, res) => {
  try {
    const result = await bookingService.getUserBookings(
      req.user._id,
      req.query,
    );
    res.status(200).send(result);
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Failed to fetch bookings";
    res.status(statusCode).send({ error: message });
  }
};

// Get provider's bookings
const getProviderBookings = async (req, res) => {
  try {
    const result = await bookingService.getProviderBookings(
      req.user._id,
      req.query,
    );
    res.status(200).send(result);
  } catch (error) {
    console.error("Error fetching provider bookings:", error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Failed to fetch bookings";
    res.status(statusCode).send({ error: message });
  }
};

// Get single booking
const getBookingById = async (req, res) => {
  try {
    const booking = await bookingService.getBookingById(
      req.params.id,
      req.user._id,
    );
    res.status(200).send(booking);
  } catch (error) {
    console.error("Error fetching booking:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to fetch booking";
    res.status(statusCode).send({ error: message });
  }
};

// Confirm booking (provider)
const confirmBooking = async (req, res) => {
  try {
    const booking = await bookingService.confirmBooking(
      req.params.id,
      req.user._id,
      req.body.providerNotes,
    );
    res.status(200).send(booking);
  } catch (error) {
    console.error("Error confirming booking:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to confirm booking";
    res.status(statusCode).send({ error: message });
  }
};

// Reject booking (provider)
const rejectBooking = async (req, res) => {
  try {
    const booking = await bookingService.rejectBooking(
      req.params.id,
      req.user._id,
      req.body.providerNotes,
    );
    res.status(200).send(booking);
  } catch (error) {
    console.error("Error rejecting booking:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to reject booking";
    res.status(statusCode).send({ error: message });
  }
};

// Cancel booking (user)
const cancelBooking = async (req, res) => {
  try {
    const booking = await bookingService.cancelBooking(
      req.params.id,
      req.user._id,
    );
    res.status(200).send(booking);
  } catch (error) {
    console.error("Error cancelling booking:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to cancel booking";
    res.status(statusCode).send({ error: message });
  }
};

// Complete booking (provider)
const completeBooking = async (req, res) => {
  try {
    const booking = await bookingService.completeBooking(
      req.params.id,
      req.user._id,
    );
    res.status(200).send(booking);
  } catch (error) {
    console.error("Error completing booking:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to complete booking";
    res.status(statusCode).send({ error: message });
  }
};

// Get booked slots for availability check
const getBookedSlots = async (req, res) => {
  try {
    const result = await bookingService.getBookedSlots(
      req.params.providerId,
      req.query.date,
      req.query.serviceOptionName,
    );
    res.status(200).send(result);
  } catch (error) {
    console.error("Error fetching booked slots:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to fetch booked slots";
    res.status(statusCode).send({ error: message });
  }
};

// Initiate Khalti payment for a booking
const bookingPaymentViaKhalti = async (req, res) => {
  try {
    const data = await bookingService.bookingPaymentViaKhalti(
      req.params.id,
      req.user,
    );

    res.json(data);
  } catch (error) {
    console.error("Error initiating Khalti payment:", error);
    res
      .status(error.statusCode || 500)
      .send({ error: error.message || "Payment initiation failed" });
  }
};

// Confirm payment after Khalti callback
const confirmBookingPayment = async (req, res) => {
  try {
    const data = await bookingService.confirmBookingPayment(
      req.params.id,
      req.body.status,
      req.user,
    );

    res.json(data);
  } catch (error) {
    console.error("Error confirming payment:", error);
    res
      .status(error.statusCode || 500)
      .send({ error: error.message || "Payment confirmation failed" });
  }
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
