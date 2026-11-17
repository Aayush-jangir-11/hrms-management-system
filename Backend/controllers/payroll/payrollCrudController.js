const Payroll = require("../../models/Payroll");
const Employee = require("../../models/Employee");
const { getPagination, formatPagination } = require("../../utils/paginate");

// Get all payrolls with filtering & pagination
// GET /api/payroll
// Private (Admin, HR)
const getAllPayrolls = async (req, res) => {
  try {
    const { month, year, status, department, search } = req.query;
    const { isPaginated, page, limit, skip } = getPagination(req.query);

    const filter = {};
    if (month) filter.month = month;
    if (year) filter.year = Number(year);
    if (status) filter.status = status;

    // Efficient DB-level search/department filtering via Employee IDs
    if (department || (search && search.trim())) {
      const empFilter = {};
      if (department && department !== "All") empFilter.department = department;
      if (search && search.trim()) {
        const searchRegex = new RegExp(search.trim(), "i");
        empFilter.$or = [
          { name: searchRegex },
          { employeeId: searchRegex },
          { email: searchRegex },
        ];
      }
      const matchedEmpIds = await Employee.find(empFilter).distinct("_id");
      filter.employee = { $in: matchedEmpIds };
    }

    const totalRecords = await Payroll.countDocuments(filter);

    let query = Payroll.find(filter)
      .populate("employee", "name employeeId email department position salary")
      .populate("generatedBy", "name email")
      .populate("approvedBy", "name email")
      .sort({ createdAt: -1 });

    if (isPaginated) {
      query = query.skip(skip).limit(limit);
    }

    const payrolls = await query;

    return res.status(200).json({
      success: true,
      count: payrolls.length,
      data: payrolls,
      pagination: formatPagination({
        totalRecords,
        page,
        limit,
        isPaginated,
      }),
    });
  } catch (error) {
    console.error("Error fetching payrolls:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payroll records",
      error: error.message,
    });
  }
};

// Get current employee's payroll history
// GET /api/payroll/my-payrolls
// Private (Employee, HR, Admin)
const getMyPayrolls = async (req, res) => {
  try {
    const { isPaginated, page, limit, skip } = getPagination(req.query);
    const filter = { employee: req.user._id };

    const totalRecords = await Payroll.countDocuments(filter);

    let query = Payroll.find(filter)
      .populate("employee", "name employeeId department position")
      .sort({ year: -1, createdAt: -1 });

    if (isPaginated) {
      query = query.skip(skip).limit(limit);
    }

    const payrolls = await query;

    return res.status(200).json({
      success: true,
      count: payrolls.length,
      data: payrolls,
      pagination: formatPagination({
        totalRecords,
        page,
        limit,
        isPaginated,
      }),
    });
  } catch (error) {
    console.error("Error fetching my payrolls:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch your payroll history",
      error: error.message,
    });
  }
};

// Get single payroll details by ID
// GET /api/payroll/:id
// Private (Admin, HR, or Owner Employee)
const getPayrollById = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate("employee", "name employeeId email department position phone address")
      .populate("generatedBy", "name email")
      .populate("approvedBy", "name email");

    if (!payroll) {
      return res.status(404).json({ success: false, message: "Payroll record not found" });
    }

    const userRole = (req.user.role || "").toLowerCase();
    const isOwner = payroll.employee && payroll.employee._id.toString() === req.user._id.toString();
    const isHrOrAdmin = userRole.includes("admin") || userRole.includes("hr");

    if (!isOwner && !isHrOrAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized to view this payroll record" });
    }

    return res.status(200).json({
      success: true,
      data: payroll,
    });
  } catch (error) {
    console.error("Error fetching payroll details:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payroll details",
      error: error.message,
    });
  }
};

// Update payroll status & payment details
// PUT /api/payroll/:id/status
// Private (Admin, HR)
const updatePayrollStatus = async (req, res) => {
  try {
    const { status, paymentMode, remarks, paymentDate } = req.body;

    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({ success: false, message: "Payroll record not found" });
    }

    if (status) payroll.status = status;
    if (paymentMode) payroll.paymentMode = paymentMode;
    if (remarks !== undefined) payroll.remarks = remarks;

    if (status === "Paid") {
      payroll.paymentDate = paymentDate || new Date();
      payroll.approvedBy = req.user._id;
    }

    await payroll.save();

    const updatedPayroll = await Payroll.findById(payroll._id)
      .populate("employee", "name employeeId department position")
      .populate("approvedBy", "name email");

    return res.status(200).json({
      success: true,
      message: `Payroll status updated to ${payroll.status}`,
      data: updatedPayroll,
    });
  } catch (error) {
    console.error("Error updating payroll status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update payroll status",
      error: error.message,
    });
  }
};

// Manual update of single payroll calculations/allowances
// PUT /api/payroll/:id
// Private (Admin, HR)
const updatePayroll = async (req, res) => {
  try {
    const {
      basicSalary,
      hra,
      specialAllowance,
      bonus,
      overtimePay,
      providentFund,
      professionalTax,
      lwp,
      tds,
      advanceRecovery,
      otherDeductions,
      remarks,
    } = req.body;

    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({ success: false, message: "Payroll record not found" });
    }

    if (basicSalary !== undefined) payroll.earnings.basicSalary = Math.max(0, Number(basicSalary));
    if (hra !== undefined) payroll.earnings.hra = Math.max(0, Number(hra));
    if (specialAllowance !== undefined) payroll.earnings.specialAllowance = Math.max(0, Number(specialAllowance));
    if (bonus !== undefined) payroll.earnings.bonus = Math.max(0, Number(bonus));
    if (overtimePay !== undefined) payroll.earnings.overtimePay = Math.max(0, Number(overtimePay));

    payroll.earnings.totalEarnings =
      payroll.earnings.basicSalary +
      payroll.earnings.hra +
      payroll.earnings.specialAllowance +
      payroll.earnings.overtimePay +
      payroll.earnings.bonus;

    if (providentFund !== undefined) payroll.deductions.providentFund = Math.max(0, Number(providentFund));
    if (professionalTax !== undefined) payroll.deductions.professionalTax = Math.max(0, Number(professionalTax));
    if (lwp !== undefined) payroll.deductions.lwp = Math.max(0, Number(lwp));
    if (tds !== undefined) payroll.deductions.tds = Math.max(0, Number(tds));
    if (advanceRecovery !== undefined) payroll.deductions.advanceRecovery = Math.max(0, Number(advanceRecovery));
    if (otherDeductions !== undefined) payroll.deductions.otherDeductions = Math.max(0, Number(otherDeductions));

    payroll.deductions.totalDeductions =
      payroll.deductions.providentFund +
      payroll.deductions.professionalTax +
      payroll.deductions.lwp +
      payroll.deductions.tds +
      payroll.deductions.advanceRecovery +
      payroll.deductions.otherDeductions;

    payroll.netSalary = Math.max(0, payroll.earnings.totalEarnings - payroll.deductions.totalDeductions);
    if (remarks !== undefined) payroll.remarks = remarks;

    await payroll.save();

    return res.status(200).json({
      success: true,
      message: "Payroll updated successfully",
      data: payroll,
    });
  } catch (error) {
    console.error("Error updating payroll:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update payroll record",
      error: error.message,
    });
  }
};

// Delete a payroll record
// DELETE /api/payroll/:id
// Private (Admin)
const deletePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findByIdAndDelete(req.params.id);
    if (!payroll) {
      return res.status(404).json({ success: false, message: "Payroll record not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Payroll record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting payroll:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete payroll record",
      error: error.message,
    });
  }
};

module.exports = {
  getAllPayrolls,
  getMyPayrolls,
  getPayrollById,
  updatePayrollStatus,
  updatePayroll,
  deletePayroll,
};
