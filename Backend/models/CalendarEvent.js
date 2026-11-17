const mongoose = require("mongoose");

const CalendarEventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      maxlength: 150,
    },
    date: {
      type: String, // Format: YYYY-MM-DD (e.g., "2026-09-15")
      required: [true, "Event date (YYYY-MM-DD) is required"],
      index: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, "Please provide date in YYYY-MM-DD format"],
    },
    time: {
      type: String,
      default: "All Day",
      trim: true,
    },
    category: {
      type: String,
      enum: ["Meeting", "Task", "Reminder", "Holiday", "Shift Note"],
      default: "Task",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },
    completed: {
      type: Boolean,
      default: false,
    },
    note: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    portalType: {
      type: String,
      enum: ["admin", "hr", "employee"],
      required: [true, "portalType is required ('admin', 'hr', or 'employee')"],
      index: true,
    },
    rrule: {
      type: String,
      default: null,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    // Optional reference to user/employee who created or owns this event
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CalendarEvent", CalendarEventSchema);