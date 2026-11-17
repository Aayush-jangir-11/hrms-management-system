const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Role name is required"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: "Custom HRMS access role",
      trim: true,
    },
    // System roles (Super Admin, Employee, Admin) cannot be deleted
    protected: {
      type: Boolean,
      default: false,
    },

    // 100% DYNAMIC: Module name and its allowed actions array
    permissions: [
      {
        module: { type: String, required: true, trim: true }, // e.g. "employees", "payroll", "recruitment", "assets"
        enabled: { type: Boolean, default: true },             // Controls sidebar & page access
        actions: [{ type: String, trim: true }],              // e.g. ["view", "create", "edit", "delete", "export", "approve"]
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Role", roleSchema);
