import adminAnalyticsService from "../services/adminAnalyticsService.js";

const adminAnalyticsController = {
  /**
   * Get platform-wide analytics (Super Admin only)
   * GET /api/admin/analytics
   */
  async getPlatformAnalytics(req, res) {
    try {
      const analytics = await adminAnalyticsService.getPlatformAnalytics();

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      console.error("Error fetching platform analytics:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch platform analytics",
        error: error.message,
      });
    }
  },
};

export default adminAnalyticsController;
