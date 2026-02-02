import sendEmail from "../utils/email.js";
import config from "../config/config.js";
import { REMINDER_TYPE } from "../constants/reminder.js";

// Email templates for different reminder types
const getEmailTemplate = (reminder, pet, user) => {
  const petName = pet?.name || "your pet";
  const dueDate = new Date(reminder.dueDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const templates = {
    [REMINDER_TYPE.VACCINATION_DUE]: {
      subject: `🐾 Vaccination Reminder: ${reminder.details?.vaccineName || "Vaccination"} for ${petName}`,
      body: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🐾 PurrfectCare</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Vaccination Reminder</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Hi ${user?.name || "there"}! 👋</h2>
            
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #856404; font-weight: 500;">
                <strong>⚠️ Important:</strong> ${petName}'s vaccination is ${reminder.isOverdue ? "overdue" : "coming up"}!
              </p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #667eea; margin-top: 0;">📋 Vaccination Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666;">Pet Name:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: 500;">${petName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Vaccine:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: 500;">${reminder.details?.vaccineName || "Not specified"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Due Date:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: 500;">${dueDate}</td>
                </tr>
                ${
                  reminder.details?.vetName
                    ? `
                <tr>
                  <td style="padding: 8px 0; color: #666;">Veterinarian:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: 500;">${reminder.details.vetName}</td>
                </tr>
                `
                    : ""
                }
                ${
                  reminder.details?.clinic
                    ? `
                <tr>
                  <td style="padding: 8px 0; color: #666;">Clinic:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: 500;">${reminder.details.clinic}</td>
                </tr>
                `
                    : ""
                }
              </table>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              Please schedule an appointment with your veterinarian to ensure ${petName} stays healthy and protected.
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${config.appUrl}/dashboard" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: 500; display: inline-block;">
                View in Dashboard
              </a>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>This email was sent by PurrfectCare because you have email notifications enabled for vaccination reminders.</p>
            <p>© ${new Date().getFullYear()} PurrfectCare. All rights reserved.</p>
          </div>
        </div>
      `,
    },

    [REMINDER_TYPE.MEDICATION]: {
      subject: `💊 Medication Reminder: ${reminder.details?.medicationName || "Medication"} for ${petName}`,
      body: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🐾 PurrfectCare</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Medication Reminder</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Hi ${user?.name || "there"}! 👋</h2>
            
            <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #155724; font-weight: 500;">
                <strong>💊 Reminder:</strong> It's time for ${petName}'s medication!
              </p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #11998e; margin-top: 0;">📋 Medication Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666;">Pet Name:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: 500;">${petName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Medication:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: 500;">${reminder.details?.medicationName || "Not specified"}</td>
                </tr>
                ${
                  reminder.details?.dosage
                    ? `
                <tr>
                  <td style="padding: 8px 0; color: #666;">Dosage:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: 500;">${reminder.details.dosage}</td>
                </tr>
                `
                    : ""
                }
                <tr>
                  <td style="padding: 8px 0; color: #666;">Scheduled Time:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: 500;">${reminder.dueTime || "09:00"}</td>
                </tr>
              </table>
            </div>
            
            ${
              reminder.description
                ? `
            <p style="color: #666; line-height: 1.6;">
              <strong>Notes:</strong> ${reminder.description}
            </p>
            `
                : ""
            }
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${config.appUrl}/dashboard" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: 500; display: inline-block;">
                Mark as Complete
              </a>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>This email was sent by PurrfectCare because you have email notifications enabled for medication reminders.</p>
            <p>© ${new Date().getFullYear()} PurrfectCare. All rights reserved.</p>
          </div>
        </div>
      `,
    },
  };

  // Default template for other types
  const defaultTemplate = {
    subject: `🐾 Reminder: ${reminder.title} for ${petName}`,
    body: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🐾 PurrfectCare</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Pet Care Reminder</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Hi ${user?.name || "there"}! 👋</h2>
          
          <div style="background: #e7f3ff; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #004085; font-weight: 500;">
              <strong>📅 Reminder:</strong> ${reminder.title}
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Pet Name:</td>
                <td style="padding: 8px 0; color: #333; font-weight: 500;">${petName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Due Date:</td>
                <td style="padding: 8px 0; color: #333; font-weight: 500;">${dueDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Time:</td>
                <td style="padding: 8px 0; color: #333; font-weight: 500;">${reminder.dueTime || "09:00"}</td>
              </tr>
            </table>
          </div>
          
          ${
            reminder.description
              ? `
          <p style="color: #666; line-height: 1.6;">
            <strong>Details:</strong> ${reminder.description}
          </p>
          `
              : ""
          }
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${config.appUrl}/dashboard" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: 500; display: inline-block;">
              View in Dashboard
            </a>
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
          <p>This email was sent by PurrfectCare for your pet care reminders.</p>
          <p>© ${new Date().getFullYear()} PurrfectCare. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  return templates[reminder.reminderType] || defaultTemplate;
};

// Send reminder email notification
const sendReminderEmail = async (reminder) => {
  try {
    const pet = reminder.petId;
    const user = reminder.userId;

    if (!user?.email) {
      console.error("Cannot send reminder email: User email not found");
      return false;
    }

    const template = getEmailTemplate(reminder, pet, user);

    await sendEmail(user.email, {
      subject: template.subject,
      body: template.body,
    });

    console.log(
      `Reminder email sent to ${user.email} for reminder: ${reminder.title}`,
    );
    return true;
  } catch (error) {
    console.error("Error sending reminder email:", error);
    return false;
  }
};

export default {
  sendReminderEmail,
  getEmailTemplate,
};
