const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    position: {
      type: String,
      required: true,
      trim: true,
    },
    shift: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkingPolicy",
      default: null,
    },
    assignedHr: {
      type: String,
      default: "Admin Self Managed",
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["Admin", "HR", "Employee"],
      default: "Employee",
    },
    lastLogin: Date,
    joinDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "On Leave", "Terminated"],
      default: "Active",
    },
    salary: {
      type: Number,
      default: 0,
    },
    address: {
      type: String,
      trim: true,
    },
    emergencyContact: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    notificationPreferences: {
      leaveUpdates: { type: Boolean, default: true },
      payslipReady: { type: Boolean, default: true },
      taskAssigned: { type: Boolean, default: true },
      attendanceReminder: { type: Boolean, default: true },
      emailAlerts: { type: Boolean, default: true },
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpire: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", EmployeeSchema);
