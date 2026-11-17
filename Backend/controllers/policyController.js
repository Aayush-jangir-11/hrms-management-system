const WorkingPolicy = require("../models/WorkingPolicy");
const Employee = require("../models/Employee");

// Create a New Working Policy
// POST /api/policies
const createPolicy = async (req, res) => {
  try {
    const {
      name,
      category,
      targetScope,
      targetDepartments,
      targetTeams,
      targetEmployees,
      shiftType,
      startTime,
      endTime,
      workingHours,
      breakDuration,
      workDays,
      gracePeriod,
      halfDayThreshold,
      overtimeRule,
      paidLeavesPerMonth,
      sandwichRuleEnabled,
      effectiveDate,
      description,
      status,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid policy name.",
      });
    }

    const scope = targetScope || "Company-Wide";
    let computedAssignedCount = 0;

    if (scope === "Company-Wide") {
      computedAssignedCount = await Employee.countDocuments();
    } else if (scope === "Department-Specific") {
      computedAssignedCount = await Employee.countDocuments({
        department: { $in: targetDepartments || [] },
      });
    } else if (scope === "Team-Specific") {
      computedAssignedCount = await Employee.countDocuments({
        team: { $in: targetTeams || [] },
      });
    } else if (scope === "Employee-Specific") {
      computedAssignedCount = (targetEmployees || []).length;
    }

    const newPolicy = await WorkingPolicy.create({
      name: name.trim(),
      category: category || "Work Schedule & Shift",
      targetScope: scope,
      targetDepartments: targetDepartments || [],
      targetTeams: targetTeams || [],
      targetEmployees: targetEmployees || [],
      shiftType: shiftType || "Regular Shift",
      startTime: startTime || "09:00 AM",
      endTime: endTime || "06:00 PM",
      workingHours: workingHours || "9 Hours",
      breakDuration: breakDuration || "60 Mins",
      workDays: workDays || ["Mon", "Tue", "Wed", "Thu", "Fri"],
      gracePeriod: gracePeriod || "15 Minutes",
      halfDayThreshold: halfDayThreshold || "4.5 Hours",
      overtimeRule: overtimeRule || "1.5x Hourly Rate",
      paidLeavesPerMonth: paidLeavesPerMonth || "2 Days",
      sandwichRuleEnabled:
        sandwichRuleEnabled !== undefined ? Boolean(sandwichRuleEnabled) : true,
      effectiveDate: effectiveDate || new Date(),
      description: description?.trim() || "",
      status: status || "Active",
      assignedCount: computedAssignedCount,
      createdBy: req.user ? req.user._id : null,
    });

    const populatedPolicy = await WorkingPolicy.findById(newPolicy._id)
      .populate("targetEmployees", "name employeeId email department position")
      .populate("createdBy", "name email role");

    return res.status(201).json({
      success: true,
      message: "Working policy created successfully.",
      data: populatedPolicy,
    });
  } catch (error) {
    console.error("Error in createPolicy:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error: Unable to create working policy.",
      error: error.message,
    });
  }
};

// Get All Working Policies
// GET /api/policies
const getAllPolicies = async (req, res) => {
  try {
    const { scope, category, status } = req.query;
    const filter = {};

    if (scope && scope !== "All") filter.targetScope = scope;
    if (category && category !== "All") filter.category = category;
    if (status && status !== "All") filter.status = status;

    const policies = await WorkingPolicy.find(filter)
      .populate("targetEmployees", "name employeeId email department position")
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: policies.length,
      data: policies,
    });
  } catch (error) {
    console.error("Error in getAllPolicies:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error: Unable to fetch working policies.",
      error: error.message,
    });
  }
};

// Get Single Working Policy by ID
// GET /api/policies/:id
const getPolicyById = async (req, res) => {
  try {
    const policy = await WorkingPolicy.findById(req.params.id)
      .populate("targetEmployees", "name employeeId email department position")
      .populate("createdBy", "name email role");

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: "Working policy record not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: policy,
    });
  } catch (error) {
    console.error("Error in getPolicyById:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error: Unable to fetch policy details.",
      error: error.message,
    });
  }
};

// Update Working Policy
// PUT /api/policies/:id
const updatePolicy = async (req, res) => {
  try {
    const policy = await WorkingPolicy.findById(req.params.id);

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: "Working policy record not found.",
      });
    }

    const fieldsToUpdate = [
      "name",
      "category",
      "targetScope",
      "targetDepartments",
      "targetTeams",
      "targetEmployees",
      "shiftType",
      "startTime",
      "endTime",
      "workingHours",
      "breakDuration",
      "workDays",
      "gracePeriod",
      "halfDayThreshold",
      "overtimeRule",
      "paidLeavesPerMonth",
      "sandwichRuleEnabled",
      "effectiveDate",
      "description",
      "status",
      "assignedCount",
    ];

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        policy[field] = req.body[field];
      }
    });

    // Recalculate assignedCount
    if (policy.targetScope === "Company-Wide") {
      policy.assignedCount = await Employee.countDocuments();
    } else if (policy.targetScope === "Department-Specific") {
      policy.assignedCount = await Employee.countDocuments({
        department: { $in: policy.targetDepartments || [] },
      });
    } else if (policy.targetScope === "Team-Specific") {
      policy.assignedCount = await Employee.countDocuments({
        team: { $in: policy.targetTeams || [] },
      });
    } else if (policy.targetScope === "Employee-Specific") {
      policy.assignedCount = (policy.targetEmployees || []).length;
    }

    await policy.save();

    const updatedPolicy = await WorkingPolicy.findById(policy._id)
      .populate("targetEmployees", "name employeeId email department position")
      .populate("createdBy", "name email role");

    return res.status(200).json({
      success: true,
      message: "Working policy updated successfully.",
      data: updatedPolicy,
    });
  } catch (error) {
    console.error("Error in updatePolicy:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error: Unable to update policy.",
      error: error.message,
    });
  }
};

// Delete Working Policy
// DELETE /api/policies/:id
const deletePolicy = async (req, res) => {
  try {
    const policy = await WorkingPolicy.findById(req.params.id);
    if (!policy) {
      return res.status(404).json({
        success: false,
        message: "Working policy record not found.",
      });
    }

    await WorkingPolicy.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Working policy deleted successfully.",
    });
  } catch (error) {
    console.error("Error in deletePolicy:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error: Unable to delete policy.",
      error: error.message,
    });
  }
};

// Assign Policy to Employees / Departments
// POST /api/policies/:id/assign
const assignPolicy = async (req, res) => {
  try {
    const { targetScope, targetDepartments, targetTeams, targetEmployees } = req.body;

    const policy = await WorkingPolicy.findById(req.params.id);
    if (!policy) {
      return res.status(404).json({
        success: false,
        message: "Working policy record not found.",
      });
    }

    if (targetScope) policy.targetScope = targetScope;
    if (targetDepartments) policy.targetDepartments = targetDepartments;
    if (targetTeams) policy.targetTeams = targetTeams;
    if (targetEmployees) policy.targetEmployees = targetEmployees;

    if (policy.targetScope === "Company-Wide") {
      policy.assignedCount = await Employee.countDocuments();
    } else if (policy.targetScope === "Department-Specific") {
      policy.assignedCount = await Employee.countDocuments({
        department: { $in: policy.targetDepartments || [] },
      });
    } else if (policy.targetScope === "Team-Specific") {
      policy.assignedCount = await Employee.countDocuments({
        team: { $in: policy.targetTeams || [] },
      });
    } else if (policy.targetScope === "Employee-Specific") {
      policy.assignedCount = (policy.targetEmployees || []).length;
    }

    await policy.save();

    const updatedPolicy = await WorkingPolicy.findById(policy._id)
      .populate("targetEmployees", "name employeeId email department position")
      .populate("createdBy", "name email role");

    return res.status(200).json({
      success: true,
      message: "Working policy assigned successfully.",
      data: updatedPolicy,
    });
  } catch (error) {
    console.error("Error in assignPolicy:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error: Unable to assign policy.",
      error: error.message,
    });
  }
};

module.exports = {
  getAllPolicies,
  getPolicyById,
  createPolicy,
  updatePolicy,
  deletePolicy,
  assignPolicy,
};
