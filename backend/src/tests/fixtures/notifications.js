const notificationFixtures = {
  unreadNotification: {
    type: "booking",
    title: "Booking Confirmed",
    body: "Your booking has been confirmed.",
    entityType: "booking",
    entityId: "booking-1",
    data: { bookingId: "booking-1" },
    isRead: false,
  },
  secondUnreadNotification: {
    type: "order",
    title: "Order Placed",
    body: "Your marketplace order was placed successfully.",
    entityType: "order",
    entityId: "order-1",
    data: { orderId: "order-1" },
    isRead: false,
  },
};

export { notificationFixtures };
