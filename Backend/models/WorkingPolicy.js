const mongoose = require("mongoose");

const WorkingPolicySchema = new mongoose.Schema(
  {

    name: {
      type: String,
      required: [true, "Policy name is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "Work Schedule & Shift",
        "Remote & Hybrid",
        "Overtime & Compensation",
        "Attendance & Punctuality",
        "General HR Policy",
      ],
      default: "Work Schedule & Shift",
    },
    targetScope: {
      type: String,
      enum: [
        "Company-Wide",
        "Department-Specific",
        "Team-Specific",
        "Employee-Specific",
      ],
      default: "Company-Wide",
    },
    targetDepartments: [
      {
        type: String,
        trim: true,
      },
    ],
    targetTeams: [
      {
        type: String,
        trim: true,
      },
    ],
    targetEmployees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
    ],
    shiftType: {
      type: String,
      enum: [
        "Regular Shift",
        "Night Shift",
        "Flexi-Hours",
        "Hybrid Shift",
        "Rotational Shift",
      ],
      default: "Regular Shift",
    },
    startTime: {
      type: String,
      default: "09:00 AM",
    },
    endTime: {
      type: String,
      default: "06:00 PM",
    },
    workingHours: {
      type: String,
      default: "9 Hours",
    },
    breakDuration: {
      type: String,
      default: "60 Mins",
    },
    workDays: {
      type: [String],
      default: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    },
    gracePeriod: {
      type: String,
      default: "15 Minutes",
    },
    halfDayThreshold: {
      type: String,
      default: "4.5 Hours",
    },
    overtimeRule: {
      type: String,
      default: "1.5x Hourly Rate",
    },
    paidLeavesPerMonth: {
      type: String,
      default: "2 Days",
    },
    sandwichRuleEnabled: {
      type: Boolean,
      default: true,
    },
    effectiveDate: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Draft", "Archived"],
      default: "Active",
    },
    assignedCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
  },
  {
    timestamps: true,
  }
);


module.exports = mongoose.model("WorkingPolicy", WorkingPolicySchema);
