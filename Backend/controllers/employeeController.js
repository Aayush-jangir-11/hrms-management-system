const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const Employee = require("../models/Employee");
const WorkingPolicy = require("../models/WorkingPolicy");
const { getPagination, formatPagination } = require("../utils/paginate");

// Create a New Employee (Admin & HR Operation)
// POST /api/hr/employees or POST /api/admin/employees
const createEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      department,
      position,
      shift,
      assignedHr,
      address,
      emergencyContact,
      employeeId,
      joinDate,
      role,
    } = req.body;

    // 1. Required fields
    if (!name || !email || !department || !position) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Check email already exists
    const existingEmployee = await Employee.findOne({
      email: normalizedEmail,
    });

    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: "Employee with this email already exists",
      });
    }

    // 3. Generate Employee ID
    let finalEmployeeId = employeeId?.trim();
    if (!finalEmployeeId) {
      finalEmployeeId = `EMP${Date.now()}`;
    }
    finalEmployeeId = finalEmployeeId.toUpperCase();

    // Check Employee ID
    const existingEmployeeId = await Employee.findOne({
      employeeId: finalEmployeeId,
    });

    if (existingEmployeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID already exists",
      });
    }

    // 4. User Role Validation & Protection
    const userRole = role ? role.toString().trim() : "Employee";

    // Protection: Non-Admin users (like HR) cannot assign Admin role
    if (userRole === "Admin" && req.user?.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: HR users are not authorized to create or assign the Admin role.",
      });
    }

    const allowedRoles =
      req.user?.role === "Admin"
        ? ["Admin", "HR", "Employee"]
        : ["HR", "Employee"];
    if (!allowedRoles.includes(userRole)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed roles for your access level are: ${allowedRoles.join(", ")}`,
      });
    }

    // 5. Password Complexity Validation & Hashing
    const rawPassword = password || "Employee@123";

    if (password) {
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          success: false,
          message:
            "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // 6. Resolve Shift as WorkingPolicy ObjectId
    let resolvedShiftId = null;
    if (shift) {
      if (mongoose.Types.ObjectId.isValid(shift)) {
        resolvedShiftId = shift;
      } else {
        const polDoc = await WorkingPolicy.findOne({
          name: { $regex: new RegExp(`^${shift.split(" (")[0]}`, "i") },
        });
        if (polDoc) resolvedShiftId = polDoc._id;
      }
    }

    // 7. Create Employee profile
    const newEmployee = await Employee.create({
      employeeId: finalEmployeeId,
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || "",
      password: hashedPassword,
      role: userRole,
      department: department.trim(),
      position: position.trim(),
      shift: resolvedShiftId,
      assignedHr: assignedHr?.trim() || "Admin Self Managed",
      address: address?.trim() || "",
      emergencyContact: emergencyContact?.trim() || "",
      joinDate: joinDate || new Date(),
      status: "Active",
    });

    const populatedEmployee = await Employee.findById(newEmployee._id)
      .select("-password")
      .populate("shift", "name policyId category shiftType startTime endTime workingHours paidLeavesPerMonth");

    return res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: {
        employee: populatedEmployee,
        user: {
          id: newEmployee._id,
          employeeId: newEmployee.employeeId,
          userName: newEmployee.name,
          email: newEmployee.email,
          role: newEmployee.role,
          status: newEmployee.status,
        },
        temporaryPassword: rawPassword,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Employee creation failed",
      error: error.message,
    });
  }
};

// Get All Employees
// GET /api/hr/employees or GET /api/admin/employees
const getAllEmployees = async (req, res) => {
  try {
    const { department, status, role, search } = req.query;
    const { isPaginated, page, limit, skip } = getPagination(req.query);

    const filter = {};
    if (department && department !== "All") filter.department = department;
    if (status && status !== "All") filter.status = status;
    if (role && role !== "All") filter.role = role;
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [
        { name: regex },
        { employeeId: regex },
        { email: regex },
        { position: regex },
      ];
    }

    const totalRecords = await Employee.countDocuments(filter);

    let query = Employee.find(filter)
      .select("-password")
      .populate("shift", "name policyId category shiftType startTime endTime workingHours paidLeavesPerMonth")
      .sort({ createdAt: -1 });

    if (isPaginated) {
      query = query.skip(skip).limit(limit);
    }

    const employees = await query;

    const formattedData = employees.map((emp) => ({
      ...emp.toObject(),
      user: {
        id: emp._id,
        employeeId: emp.employeeId,
        userName: emp.name,
        role: emp.role,
        status: emp.status,
      },
    }));

    return res.status(200).json({
      success: true,
      count: formattedData.length,
      data: formattedData,
      pagination: formatPagination({
        totalRecords,
        page,
        limit,
        isPaginated,
      }),
    });
  } catch (error) {
    console.error("Error in getAllEmployees:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error: Unable to fetch employees.",
      error: error.message,
    });
  }
};

// Get Single Employee by ID
// GET /api/hr/employees/:id or GET /api/admin/employees/:id
const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .select("-password")
      .populate("shift", "name policyId category shiftType startTime endTime workingHours paidLeavesPerMonth");

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee record not found." });
    }
    return res.status(200).json({
      success: true,
      data: {
        ...employee.toObject(),
        user: {
          id: employee._id,
          employeeId: employee.employeeId,
          userName: employee.name,
          email: employee.email,
          role: employee.role,
          status: employee.status,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching employee record.",
      error: error.message,
    });
  }
};

// Update Employee Details
// PUT /api/hr/employees/:id or PUT /api/admin/employees/:id
const updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee record not found." });
    }

    if (req.body.email !== undefined) {
      const normalizedEmail = req.body.email.trim().toLowerCase();

      const emailExists = await Employee.findOne({
        email: normalizedEmail,
        _id: { $ne: req.params.id },
      });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Another employee already uses this email.",
        });
      }

      employee.email = normalizedEmail;
    }

    if (req.body.name !== undefined) employee.name = req.body.name.trim();
    if (req.body.phone !== undefined) employee.phone = req.body.phone.trim();
    if (req.body.department !== undefined) employee.department = req.body.department.trim();
    if (req.body.position !== undefined) employee.position = req.body.position.trim();

    // Resolve shift WorkingPolicy ref
    if (req.body.shift !== undefined) {
      const shiftVal = req.body.shift;
      if (mongoose.Types.ObjectId.isValid(shiftVal)) {
        employee.shift = shiftVal;
      } else if (shiftVal) {
        const polDoc = await WorkingPolicy.findOne({
          name: { $regex: new RegExp(`^${shiftVal.split(" (")[0]}`, "i") },
        });
        employee.shift = polDoc ? polDoc._id : null;
      } else {
        employee.shift = null;
      }
    }

    if (req.body.assignedHr !== undefined) employee.assignedHr = req.body.assignedHr.trim();
    if (req.body.address !== undefined) employee.address = req.body.address.trim();
    if (req.body.emergencyContact !== undefined) employee.emergencyContact = req.body.emergencyContact.trim();
    if (req.body.joinDate !== undefined) employee.joinDate = req.body.joinDate;

    if (req.body.status !== undefined) {
      const allowedStatuses = ["Active", "Inactive", "On Leave", "Terminated"];
      if (!allowedStatuses.includes(req.body.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid employee status.",
        });
      }
      employee.status = req.body.status;
    }

    // Role protection against non-Admins elevating role to Admin
    if (req.body.role !== undefined) {
      const newRole = req.body.role.toString().trim();

      if (newRole === "Admin" && req.user?.role !== "Admin") {
        return res.status(403).json({
          success: false,
          message: "Forbidden: HR users are not authorized to assign the Admin role.",
        });
      }

      const allowedRoles = req.user?.role === "Admin" ? ["Admin", "HR", "Employee"] : ["HR", "Employee"];
      if (!allowedRoles.includes(newRole)) {
        return res.status(400).json({
          success: false,
          message: `Invalid role. Allowed roles for your access level are: ${allowedRoles.join(", ")}`,
        });
      }

      employee.role = newRole;
    }

    if (req.body.password && req.body.password.trim() !== "") {
      employee.password = await bcrypt.hash(req.body.password.trim(), 10);
    }

    await employee.save();

    const updatedEmployee = await Employee.findById(employee._id)
      .select("-password")
      .populate("shift", "name policyId category shiftType startTime endTime workingHours paidLeavesPerMonth");

    return res.status(200).json({
      success: true,
      message: "Employee profile updated successfully.",
      data: updatedEmployee,
    });
  } catch (error) {
    console.error("Error in updateEmployee:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error: Unable to update employee profile.",
      error: error.message,
    });
  }
};

// Delete Employee Record
// DELETE /api/hr/employees/:id or DELETE /api/admin/employees/:id
const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee record not found." });
    }

    return res.status(200).json({
      success: true,
      message: `Employee (${employee.name}) deleted successfully.`,
    });
  } catch (error) {
    console.error("Error in deleteEmployee:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error: Unable to delete employee record.",
      error: error.message,
    });
  }
};

module.exports = {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
};
