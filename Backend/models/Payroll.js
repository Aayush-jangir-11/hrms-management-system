const mongoose = require("mongoose");

// Earnings Sub-Schema
const EarningsSchema = new mongoose.Schema(
  {
    basicSalary: {
      type: Number,
      required: true,
      default: 0
    },
    hra: {
      type: Number,
      default: 0
    },
    specialAllowance: {
      type: Number,
      default: 0
    },
    overtimePay: {
      type: Number,
      default: 0
    },
    bonus: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      required: true,
      default: 0
    },
  },
  { _id: false }
);

// Deductions Sub-Schema
const DeductionsSchema = new mongoose.Schema(
  {
    providentFund: {
      type: Number,
      default: 0
    },
    professionalTax: {
      type: Number,
      default: 0
    },
    lwp: {
      type: Number,
      default: 0
    },
    tds: {
      type: Number,
      default: 0
    },
    advanceRecovery: {
      type: Number,
      default: 0
    },
    otherDeductions: {
      type: Number,
      default: 0
    },
    totalDeductions: {
      type: Number,
      required: true,
      default: 0
    },
  },
  { _id: false }
);

// Attendance Summary Sub-Schema
const AttendanceSummarySchema = new mongoose.Schema(
  {
    totalWorkingDays: {
      type: Number,
      default: 0
    },
    presentDays: {
      type: Number,
      default: 0
    },
    halfDays: {
      type: Number,
      default: 0
    },
    absentDays: {
      type: Number,
      default: 0
    },
    leaveDays: {
      type: Number,
      default: 0
    },
    paidLeaveDays: {
      type: Number,
      default: 0
    },
    unpaidLeaveDays: {
      type: Number,
      default: 0
    },
    paidDays: {
      type: Number,
      default: 0
    },
    lateDays: {
      type: Number,
      default: 0
    },
    overtimeHours: {
      type: Number,
      default: 0
    },
  },
  { _id: false }
);

// Salary Structure Config Sub-Schema
const SalaryStructureSchema = new mongoose.Schema(
  {
    annualCtc: {
      type: Number,
      default: 0
    },
    monthlyGross: {
      type: Number,
      default: 0
    },
    basicPercent: {
      type: Number,
      default: 50
    },
    hraPercent: {
      type: Number,
      default: 20
    },
    pfRate: {
      type: Number,
      default: 12
    },
    pfCap: {
      type: Number,
      default: 1800
    },
    professionalTaxAmount: {
      type: Number,
      default: 200
    },
    overtimeMultiplier: {
      type: Number,
      default: 1.5
    },
  },
  { _id: false }
);

// Main Payroll Root Schema
const PayrollSchema = new mongoose.Schema(
  {
    // References & Period
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee reference is required"],
      index: true
    },
    month: {
      type: String,
      required: [true, "Month is required"],
      enum: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    },
    year: {
      type: Number,
      required: [true, "Year is required"]
    },

    // Embedded Breakdowns
    earnings: {
      type: EarningsSchema,
      default: () => ({})
    },
    deductions: {
      type: DeductionsSchema,
      default: () => ({})
    },
    attendanceSummary: {
      type: AttendanceSummarySchema,
      default: () => ({})
    },
    salaryStructure: {
      type: SalaryStructureSchema,
      default: () => ({})
    },

    // Computed Net & Payment Status
    netSalary: {
      type: Number,
      required: [true, "Net salary is required"],
      default: 0
    },
    status: {
      type: String,
      enum: ["Pending", "Processing", "Paid", "On Hold"],
      default: "Pending"
    },
    paymentDate: {
      type: Date,
      default: null
    },
    paymentMode: {
      type: String,
      enum: ["Bank Transfer", "Cheque", "Cash", "UPI"],
      default: "Bank Transfer"
    },

    // Audit Trail & Metadata
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee", default: null
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee", default: null
    },
    remarks: {
      type: String,
      trim: true,
      default: ""
    },
  },
  { timestamps: true }
);

// Compound & Query Indexes
PayrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true, name: "unique_payroll_per_employee_per_month" });
PayrollSchema.index({ month: 1, year: 1, status: 1 });

module.exports = mongoose.model("Payroll", PayrollSchema);
