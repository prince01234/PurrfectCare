import merchantOrderService from "../services/merchantOrderService.js";

const merchantOrderController = {
  /**
   * Get merchant's orders (orders containing their products)
   * GET /api/service-providers/me/orders
   */
  async getMerchantOrders(req, res) {
    try {
      const result = await merchantOrderService.getMerchantOrders(
        req.user._id,
        req.query,
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error fetching merchant orders:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to fetch orders",
      });
    }
  },

  /**
   * Update order status
   * PUT /api/service-providers/me/orders/:orderId/status
   */
  async updateOrderStatus(req, res) {
    try {
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Status is required",
        });
      }

      const order = await merchantOrderService.updateOrderStatus(
        req.params.orderId,
        status,
        req.user._id,
      );

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to update order status",
      });
    }
  },
};

export default merchantOrderController;
