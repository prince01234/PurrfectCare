import express from "express";
import reminderController from "../controllers/reminderController.js";
import { auth, requireVerified } from "../middlewares/auth.js";

const router = express.Router({ mergeParams: true }); // Enable access to parent route params (petId)

// URL: /api/pets/:petId/reminders - Get all reminders for a pet
router.get("/", auth, reminderController.getRemindersByPet);

// URL: /api/pets/:petId/reminders/:reminderId - Get a single reminder
router.get("/:reminderId", auth, reminderController.getReminderById);

// Requires authentication and verified user

// URL: /api/pets/:petId/reminders - Create a new reminder
router.post("/", auth, requireVerified, reminderController.createReminder);

// URL: /api/pets/:petId/reminders/:reminderId - Update a reminder
router.put(
  "/:reminderId",
  auth,
  requireVerified,
  reminderController.updateReminder,
);

// URL: /api/pets/:petId/reminders/:reminderId - Delete a reminder
router.delete(
  "/:reminderId",
  auth,
  requireVerified,
  reminderController.deleteReminder,
);

// URL: /api/pets/:petId/reminders/:reminderId/complete - Mark reminder as complete
router.patch(
  "/:reminderId/complete",
  auth,
  requireVerified,
  reminderController.completeReminder,
);

// URL: /api/pets/:petId/reminders/:reminderId/snooze - Snooze a reminder
router.patch(
  "/:reminderId/snooze",
  auth,
  requireVerified,
  reminderController.snoozeReminder,
);

// URL: /api/pets/:petId/reminders/:reminderId/dismiss - Dismiss a reminder
router.patch(
  "/:reminderId/dismiss",
  auth,
  requireVerified,
  reminderController.dismissReminder,
);

// User-level reminder routes (mounted at /api/reminders)
export const userReminderRouter = express.Router();

// URL: /api/reminders - Get all reminders for the logged-in user
userReminderRouter.get("/", auth, reminderController.getRemindersByUser);

// URL: /api/reminders/stats - Get reminder statistics
userReminderRouter.get("/stats", auth, reminderController.getReminderStats);

export default router;
