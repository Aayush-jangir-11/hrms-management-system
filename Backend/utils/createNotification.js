const Notification = require("../models/Notification");
const Employee = require("../models/Employee");
const sendEmail = require("./sendEmail");

const PREF_MAP = {
  leave: "leaveUpdates",
  task: "taskAssigned",
  attendance: "attendanceReminder",
  payroll: "payslipReady",
};

const createNotification = async ({
  recipient,
  sender,
  type = "system",
  title,
  message,
  link = "",
  sendEmailAlert = false,
}) => {
  try {
    if (!recipient) return null;

    // 1. Check recipient employee preferences
    const emp = await Employee.findById(recipient).select("notificationPreferences email name");
    if (emp?.notificationPreferences) {
      const prefKey = PREF_MAP[type];
      if (prefKey && emp.notificationPreferences[prefKey] === false) {
        console.log(`[Notification Engine] Suppressed '${type}' notification for ${emp.email} (Disabled in preferences)`);
        return null;
      }
    }

    // 2. Create in-app notification in MongoDB
    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      link,
    });

    // 3. Send email if user has emailAlerts enabled and alert warrants an email
    if (
      emp &&
      emp.notificationPreferences?.emailAlerts !== false &&
      emp.email &&
      (sendEmailAlert || type === "leave" || type === "payroll")
    ) {
      sendEmail({
        to: emp.email,
        subject: `HRMS Alert: ${title}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="margin-bottom: 16px;">
              <span style="background-color: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: bold; text-transform: uppercase;">
                HRMS Notification
              </span>
            </div>
            <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: bold;">${title}</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">${message}</p>
            ${
              link
                ? `<div style="margin-top: 24px;">
                    <a href="${link}" style="background: linear-gradient(to right, #0284c7, #2563eb); color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px; display: inline-block;">
                      Open HRMS Portal
                    </a>
                  </div>`
                : ""
            }
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
            <p style="font-size: 11px; color: #94a3b8; margin: 0;">
              You are receiving this update based on your notification preferences. You can update these anytime in your Employee/HR Settings.
            </p>
          </div>
        `,
      }).catch((err) => console.warn("[Notification Engine] Email dispatch non-blocking error:", err.message));
    }

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error.message);
    return null;
  }
};

module.exports = createNotification;
