const Attendance = require("../../models/Attendance");
const Leave = require("../../models/Leave");
const Payroll = require("../../models/Payroll");
const Employee = require("../../models/Employee");
const { getDateRange } = require("./reportUtils");

// Get Overall Report Statistics
// GET /api/reports/stats
// Private (Admin / HR)
const getReportStats = async (req, res) => {
  console.log("[reportController] -> getReportStats called with query:", req.query);
  try {
    const { range = "month", startDate: qStart, endDate: qEnd } = req.query;
    const { startDate, endDate } = getDateRange(range, qStart, qEnd);

    // 1. Total Active Employees
    const totalEmployees = await Employee.countDocuments({ status: "Active" });

    // 2. Attendance rate in specified range
    const attendanceStats = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          presentCount: {
            $sum: {
              $cond: [{ $in: ["$status", ["Present", "Late", "Half Day"]] }, 1, 0],
            },
          },
          totalHours: { $sum: "$totalHours" },
        },
      },
    ]);

    const totalRecords = attendanceStats[0]?.totalRecords || 0;
    const presentRecords = attendanceStats[0]?.presentCount || 0;
    const totalWorkedHours = attendanceStats[0]?.totalHours || 0;

    const attendanceRate =
      totalRecords > 0 ? ((presentRecords / totalRecords) * 100).toFixed(1) : "0.0";
    const avgWorkingHours =
      presentRecords > 0 ? (totalWorkedHours / presentRecords).toFixed(1) : "0.0";

    // 3. Pending Leave Approvals
    const pendingLeaves = await Leave.countDocuments({ status: "Pending" });

    // 4. Latest Month Total Payroll
    const latestPayroll = await Payroll.aggregate([
      {
        $group: {
          _id: { month: "$month", year: "$year" },
          totalNet: { $sum: "$netSalary" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 1 },
    ]);

    const currentPayrollSum = latestPayroll[0]?.totalNet || 0;

    return res.status(200).json({
      success: true,
      data: {
        totalReportsAvailable: 4,
        totalEmployees,
        attendanceRate: `${attendanceRate}%`,
        avgWorkingHours: `${avgWorkingHours}h`,
        pendingApprovals: pendingLeaves,
        currentPayrollExpense: currentPayrollSum,
      },
    });
  } catch (error) {
    console.error("Error fetching report stats:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while generating report stats",
      error: error.message,
    });
  }
};

// Stream CSV Export for Reports
// GET /api/reports/export/:type
// Private (Admin / HR)
const exportReportCSV = async (req, res) => {
  console.log("[reportController] -> exportReportCSV called with type:", req.params.type, "query:", req.query);
  try {
    const { type } = req.params; // attendance | leave | payroll | department
    const { range = "month", year = new Date().getFullYear() } = req.query;

    let csvContent = "";
    let fileName = `report_${type}_${Date.now()}.csv`;

    if (type === "attendance") {
      const { startDate, endDate } = getDateRange(range, req.query.startDate, req.query.endDate);
      const records = await Attendance.find({
        date: { $gte: startDate, $lte: endDate },
      })
        .populate("employee", "name employeeId department position")
        .sort({ date: -1 });

      csvContent = "Date,Employee ID,Name,Department,Status,Total Hours,Check In,Check Out\n";
      records.forEach((r) => {
        const emp = r.employee || {};
        const d = r.date ? new Date(r.date).toISOString().split("T")[0] : "";
        const cIn = r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : "";
        const cOut = r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : "";
        csvContent += `"${d}","${emp.employeeId || ""}","${emp.name || ""}","${emp.department || ""}","${r.status || ""}","${r.totalHours || 0}","${cIn}","${cOut}"\n`;
      });
    } else if (type === "leave") {
      const { startDate, endDate } = getDateRange(range, req.query.startDate, req.query.endDate);
      const records = await Leave.find({
        fromDate: { $gte: startDate, $lte: endDate },
      })
        .populate("employee", "name employeeId department")
        .sort({ fromDate: -1 });

      csvContent = "Employee ID,Name,Department,Leave Type,From Date,To Date,Days,Status,Reason\n";
      records.forEach((l) => {
        const emp = l.employee || {};
        const from = l.fromDate ? new Date(l.fromDate).toISOString().split("T")[0] : "";
        const to = l.toDate ? new Date(l.toDate).toISOString().split("T")[0] : "";
        csvContent += `"${emp.employeeId || ""}","${emp.name || ""}","${emp.department || ""}","${l.leaveType}","${from}","${to}","${l.days || 1}","${l.status}","${(l.reason || "").replace(/"/g, '""')}"\n`;
      });
    } else if (type === "payroll") {
      const records = await Payroll.find({ year: Number(year) })
        .populate("employee", "name employeeId department")
        .sort({ year: -1, month: -1 });

      csvContent = "Month,Year,Employee ID,Name,Department,Basic Salary,Total Earnings,Total Deductions,Net Salary,Status\n";
      records.forEach((p) => {
        const emp = p.employee || {};
        csvContent += `"${p.month}","${p.year}","${emp.employeeId || ""}","${emp.name || ""}","${emp.department || ""}","${p.earnings?.basicSalary || 0}","${p.earnings?.totalEarnings || 0}","${p.deductions?.totalDeductions || 0}","${p.netSalary || 0}","${p.status || ""}"\n`;
      });
    } else if (type === "department") {
      const employees = await Employee.find().select("name employeeId department position role status");
      csvContent = "Employee ID,Name,Department,Position,Role,Status\n";
      employees.forEach((e) => {
        csvContent += `"${e.employeeId || ""}","${e.name || ""}","${e.department || ""}","${e.position || ""}","${e.role || ""}","${e.status || ""}"\n`;
      });
    } else {
      return res.status(400).json({ success: false, message: "Invalid report type specified" });
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error("Error exporting report CSV:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to export CSV report",
      error: error.message,
    });
  }
};

module.exports = {
  getReportStats,
  exportReportCSV,
};
