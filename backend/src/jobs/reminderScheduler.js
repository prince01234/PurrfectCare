import cron from "node-cron";
import reminderService from "../services/reminderService.js";
import notificationService from "../services/notificationService.js";
import inAppNotificationService from "../services/inAppNotificationService.js";
import Reminder from "../models/Reminder.js";
import { REMINDER_STATUS } from "../constants/reminder.js";

const buildReminderNotificationPayload = (reminder) => {
  const userId =
    reminder.userId?._id?.toString?.() || reminder.userId?.toString?.();
  const petId =
    reminder.petId?._id?.toString?.() || reminder.petId?.toString?.();
  const petName = reminder.petId?.name || "your pet";

  if (!userId) {
    return null;
  }

  return {
    userId,
    type: "reminder",
    title: `Reminder: ${reminder.title}`,
    body: `${petName} has a due reminder${reminder.dueTime ? ` at ${reminder.dueTime}` : ""}.`,
    entityId: reminder._id.toString(),
    entityType: "reminder",
    data: {
      reminderId: reminder._id.toString(),
      petId: petId || null,
      reminderType: reminder.reminderType,
      dueDate: reminder.dueDate,
      dueTime: reminder.dueTime || null,
      link: petId ? `/pets/${petId}` : "/dashboard",
    },
  };
};

// Process in-app + push notifications for due reminders
const processReminderNotifications = async () => {
  try {
    const reminders = await reminderService.getRemindersForInAppNotification();

    if (reminders.length === 0) {
      return;
    }

    for (const reminder of reminders) {
      try {
        const payload = buildReminderNotificationPayload(reminder);
        if (!payload) {
          continue;
        }

        await inAppNotificationService.createNotification(payload);
        await reminderService.markReminderNotificationSent(reminder._id);
      } catch (error) {
        console.error(
          `[Scheduler] Failed to dispatch reminder notification ${reminder._id}:`,
          error,
        );
      }
    }
  } catch (error) {
    console.error("[Scheduler] Error in processReminderNotifications:", error);
  }
};

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
  // Run every minute to dispatch due reminder alerts (in-app/push + email)
  cron.schedule("* * * * *", async () => {
    await processReminderNotifications();
    await processReminderEmails();
  });

  // Run every 15 minutes to reactivate snoozed reminders
  cron.schedule("*/15 * * * *", async () => {
    await reactivateSnoozedReminders();
  });
};

export default {
  startScheduler,
  processReminderNotifications,
  processReminderEmails,
  reactivateSnoozedReminders,
};
