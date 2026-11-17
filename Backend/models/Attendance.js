const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },

    // Attendance date
    date: {
      type: Date,
      required: true,
      index: true,
    },

    // First punch-in date and time of the day
    checkIn: {
      type: Date,
      default: null,
    },

    // Latest punch-out date and time of the day
    checkOut: {
      type: Date,
      default: null,
    },

    // All punch sessions/intervals throughout the day
    sessions: [
      {
        punchIn: { type: Date, required: true },
        punchOut: { type: Date, default: null },
        durationHours: { type: Number, default: 0 },
      },
    ],

    // Total working hours (sum of all session durations)
    totalHours: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: [
        "Present",
        "Absent",
        "Late",
        "Half Day",
        "On Leave",
      ],
      default: "Present",
    },

    // Additional note
    remark: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// One employee can have only one attendance record per day
AttendanceSchema.index(
  {
    employee: 1,
    date: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model("Attendance", AttendanceSchema);