const mongoose = require("mongoose");

// Sub-schema for Teams inside a Department
const TeamSchema = new mongoose.Schema(
  {
    teamName: {
      type: String,
      required: true,
      trim: true,
    },
    teamHead: {
      type: String,
      trim: true,
      default: "",
    },
    assignedEmployeeIds: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { _id: true, timestamps: true }
);

const DepartmentSchema = new mongoose.Schema(
  {
    office: {
      type: String,
      required: true,
      trim: true,
      default: "Headquarters - Mumbai",
    },
    name: {
      type: String,
      required: true,
      trim: true,
      alias: "Deptname",
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      alias: "Deptcode",
    },
    head: {
      type: String,
      required: true,
      trim: true,
      alias: "DeptHead",
    },
    headRole: {
      type: String,
      trim: true,
      default: "Department Head",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    growth: {
      type: String,
      trim: true,
      default: "+0%",
    },
    teams: {
      type: [TeamSchema],
      default: [],
    },
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Department", DepartmentSchema);