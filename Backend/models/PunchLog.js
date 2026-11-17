const mongoose = require("mongoose");

const PunchLogSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },

    // IN or OUT
    punchType: {
      type: String,
      enum: ["IN", "OUT"],
      required: true,
    },

    // Exact date and time of punch
    punchTime: {
      type: Date,
      default: Date.now,
      required: true,
    },

    // Optional location information
    location: {
      type: String,
      default: "Office Headquarters",
    },

    // Device used for punching
    device: {
      type: String,
      default: "Unknown Device",
    },
  },
  {
    timestamps: true,
  },
);

// Helpful for finding an employee's latest punch records
PunchLogSchema.index({
  employee: 1,
  punchTime: -1,
});

module.exports = mongoose.model("PunchLog", PunchLogSchema);