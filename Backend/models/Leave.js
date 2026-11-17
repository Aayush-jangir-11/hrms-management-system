const mongoose = require("mongoose");

const DateBreakdownSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    leaveType: { type: String },
    payType: {
      type: String,
      enum: ["Paid", "Unpaid"],
      default: "Paid",
    },
    dayType: {
      type: String,
      enum: ["Full Day", "Half Day"],
      default: "Full Day",
    },
    halfDaySession: {
      type: String,
      enum: ["First Half", "Second Half", null],
      default: null,
    },
    isSandwiched: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const LeaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    leaveType: {
      type: String,
      required: true,
      trim: true,
    },

    fromDate: {
      type: Date,
      required: true,
    },

    toDate: {
      type: Date,
      required: true,
    },

    days: {
      type: Number,
      required: true,
    },

    dateBreakdown: [DateBreakdownSchema],

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    rejectionReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Leave", LeaveSchema);
