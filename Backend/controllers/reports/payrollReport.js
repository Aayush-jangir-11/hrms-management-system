const Payroll = require("../../models/Payroll");

// Get Payroll Expense & Summary Report
// GET /api/reports/payroll
// Private (Admin / HR)
const getPayrollReport = async (req, res) => {
  console.log("[reportController] -> getPayrollReport called with query:", req.query);
  try {
    const { range = "month", startDate: qStart, endDate: qEnd, department, year: qYear } = req.query;
    const year = qYear ? Number(qYear) : new Date().getFullYear();

    const matchStage = { year };

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "employees",
          localField: "employee",
          foreignField: "_id",
          as: "employeeData",
        },
      },
      { $unwind: { path: "$employeeData", preserveNullAndEmptyArrays: true } },
    ];

    if (department && department !== "All Departments" && department !== "All") {
      pipeline.push({
        $match: { "employeeData.department": department },
      });
    }

    pipeline.push(
      {
        $group: {
          _id: "$month",
          totalSalary: { $sum: "$earnings.totalEarnings" },
          totalBasic: { $sum: "$earnings.basicSalary" },
          totalDeductions: { $sum: "$deductions.totalDeductions" },
          totalNetPay: { $sum: "$netSalary" },
          employees: { $sum: 1 },
          paidCount: {
            $sum: { $cond: [{ $eq: ["$status", "Paid"] }, 1, 0] },
          },
          pendingCount: {
            $sum: { $cond: [{ $ne: ["$status", "Paid"] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          month: "$_id",
          _id: 0,
          totalSalary: "$totalSalary",
          totalBasic: "$totalBasic",
          totalDeductions: "$totalDeductions",
          totalNetPay: "$totalNetPay",
          employees: "$employees",
          paidCount: "$paidCount",
          pendingCount: "$pendingCount",
        },
      }
    );

    const payrollSummary = await Payroll.aggregate(pipeline);

    return res.status(200).json({
      success: true,
      name: "Payroll Report",
      type: "Payroll",
      coverage: `Year ${year}`,
      lastGenerated: new Date().toISOString().split("T")[0],
      data: payrollSummary,
    });
  } catch (error) {
    console.error("Error generating payroll report:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate payroll report",
      error: error.message,
    });
  }
};

module.exports = {
  getPayrollReport,
};
