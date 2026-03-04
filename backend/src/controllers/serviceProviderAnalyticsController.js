import serviceProviderAnalyticsService from "../services/serviceProviderAnalyticsService.js";
import ServiceProvider from "../models/ServiceProvider.js";

const serviceProviderAnalyticsController = {
  /**
   * Get analytics for the authenticated service provider
   * GET /api/service-providers/me/analytics
   */
  async getMyAnalytics(req, res) {
    try {
      const userId = req.user._id;

      // Find the provider profile for this user
      const provider = await ServiceProvider.findOne({ userId });

      if (!provider) {
        return res.status(404).json({
          success: false,
          message: "Service provider profile not found",
        });
      }

      const analytics =
        await serviceProviderAnalyticsService.getProviderAnalytics(
          provider._id,
        );

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      console.error("Error fetching provider analytics:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch analytics",
        error: error.message,
      });
    }
  },
};

export default serviceProviderAnalyticsController;
