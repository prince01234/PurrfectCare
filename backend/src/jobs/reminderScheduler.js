import cron from "node-cron";
import reminderService from "../services/reminderService.js";
import notificationService from "../services/notificationService.js";
import Reminder from "../models/Reminder.js";
import { REMINDER_STATUS } from "../constants/reminder.js";

// Process email notifications for due reminders
const processReminderEmails = async () => {
  try {
    const reminders = await reminderService.getRemindersForEmailNotification();

    if (reminders.length === 0) {
      return;
    }

    for (const reminder of reminders) {
      try {
        const emailSent = await notificationService.sendReminderEmail(reminder);

        if (emailSent) {
          await reminderService.markEmailSent(reminder._id);
        }
      } catch (error) {
        console.error(
          `[Scheduler] Failed to process reminder ${reminder._id}:`,
          error,
        );
      }
    }
  } catch (error) {
    console.error("[Scheduler] Error in processReminderEmails:", error);
  }
};

// Reactivate snoozed reminders that have passed their snooze time
const reactivateSnoozedReminders = async () => {
  try {
    const now = new Date();

    await Reminder.updateMany(
      {
        status: REMINDER_STATUS.SNOOZED,
        snoozedUntil: { $lte: now },
        isDeleted: false,
      },
      {
        $set: {
          status: REMINDER_STATUS.ACTIVE,
          snoozedUntil: null,
        },
      },
    );
  } catch (error) {
    console.error("[Scheduler] Error reactivating snoozed reminders:", error);
  }
};

// Start all scheduled jobs
const startScheduler = () => {
  // Run every hour at minute 0 to check for email notifications
  cron.schedule("0 * * * *", async () => {
    await processReminderEmails();
    await reactivateSnoozedReminders();
  });

  // Run every morning at 8:00 AM for daily reminder digest
  cron.schedule("0 8 * * *", async () => {
    await processReminderEmails();
  });

  // Run every evening at 6:00 PM for evening reminder check
  cron.schedule("0 18 * * *", async () => {
    await processReminderEmails();
  });

  // Run every 15 minutes to reactivate snoozed reminders
  cron.schedule("*/15 * * * *", async () => {
    await reactivateSnoozedReminders();
  });
};

export default {
  startScheduler,
  processReminderEmails,
  reactivateSnoozedReminders,
};
