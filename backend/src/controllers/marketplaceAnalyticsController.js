import marketplaceAnalyticsService from "../services/marketplaceAnalyticsService.js";

const marketplaceAnalyticsController = {
  /**
   * Get marketplace analytics for the authenticated admin
   * GET /api/service-providers/me/marketplace-analytics
   */
  async getMarketplaceAnalytics(req, res) {
    try {
      const userId = req.user._id;

      const analytics =
        await marketplaceAnalyticsService.getMarketplaceAnalytics(userId);

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      console.error("Error fetching marketplace analytics:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch marketplace analytics",
        error: error.message,
      });
    }
  },
};

export default marketplaceAnalyticsController;
