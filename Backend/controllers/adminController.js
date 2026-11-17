const Employee = require("../models/Employee");
const Department = require("../models/Department");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const employeeController = require("./employeeController");
const departmentController = require("./departmentController");

// Admin Dashboard Stats
// GET /api/admin/dashboard-stats
const getDashboardStats = async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ status: "Active" });

    // Fetch all created departments from Department model & Employee collection
    const deptDocuments = await Department.find().select("name");
    const deptNamesFromDocs = deptDocuments.map((d) => d.name);
    const empDepts = await Employee.distinct("department");

    // Merge unique department names
    const allDepartmentNames = Array.from(
      new Set([...deptNamesFromDocs, ...empDepts].filter(Boolean))
    );
    const totalDepartments = allDepartmentNames.length;

    // Count all HR roles (HR, HR Manager, HR Executive, etc.)
    const totalHR = await Employee.countDocuments({
      role: { $regex: /HR/i },
    });
    const totalAdmins = await Employee.countDocuments({ role: "Admin" });

    // Recent 5 joined employees
    const recentEmployees = await Employee.find()
      .select("name email department position role joinDate createdAt")
      .sort({ createdAt: -1 })
      .limit(5);

    // Dynamic stats per department
    const deptStats = [];
    for (let deptName of allDepartmentNames) {
      const count = await Employee.countDocuments({ department: deptName });
      deptStats.push({
        name: deptName,
        employees: count,
        percentage:
          totalEmployees > 0 ? Math.round((count / totalEmployees) * 100) : 0,
      });
    }

    // ── Dynamic Today's Workforce Attendance Stats ──
    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
    const endOfToday = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));

    // Attendance records created or dated today
    const todayAttendanceRecords = await Attendance.find({
      $or: [
        { date: { $gte: startOfToday, $lte: endOfToday } },
        { createdAt: { $gte: startOfToday, $lte: endOfToday } },
      ],
    }).select("status employee checkIn");

    // Employees who are present or punched in
    const presentRecords = todayAttendanceRecords.filter(
      (r) => ["Present", "Late", "Half Day"].includes(r.status) || r.checkIn != null
    );
    const presentEmpIds = new Set(
      presentRecords.map((r) => r.employee?.toString()).filter(Boolean)
    );
    const presentCount = presentEmpIds.size;

    // Approved leaves active today
    const approvedLeavesToday = await Leave.find({
      status: "Approved",
      fromDate: { $lte: endOfToday },
      toDate: { $gte: startOfToday },
    }).select("employee");

    const leaveEmpIds = new Set(
      approvedLeavesToday.map((l) => l.employee?.toString()).filter(Boolean)
    );

    // Add attendance records marked as "On Leave"
    todayAttendanceRecords
      .filter((r) => r.status === "On Leave")
      .forEach((r) => {
        if (r.employee) leaveEmpIds.add(r.employee.toString());
      });

    // Don't double count if an employee was present
    presentEmpIds.forEach((id) => leaveEmpIds.delete(id));
    const onLeaveCount = leaveEmpIds.size;

    // Absent: Active employees who are neither present nor on leave
    const absentCount = Math.max(0, activeEmployees - presentCount - onLeaveCount);

    const activePercentage =
      activeEmployees > 0
        ? Math.round((presentCount / activeEmployees) * 100)
        : 0;

    const todayAttendance = {
      present: presentCount,
      onLeave: onLeaveCount,
      absent: absentCount,
      total: activeEmployees,
      percentage: activePercentage,
    };

    // ── Dynamic Employee Growth Trend by Month ──
    const selectedYear = parseInt(req.query.year, 10) || now.getFullYear();
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    const allEmployees = await Employee.find().select("joinDate createdAt");

    const employeeGrowth = monthNames.map((month, index) => {
      // Month index is 0 to 11
      const startOfMonth = new Date(Date.UTC(selectedYear, index, 1, 0, 0, 0, 0));
      const endOfMonth = new Date(Date.UTC(selectedYear, index + 1, 0, 23, 59, 59, 999));

      const totalEmployeesAtMonth = allEmployees.filter((emp) => {
        const d = emp.joinDate || emp.createdAt;
        return d && new Date(d) <= endOfMonth;
      }).length;

      const newJoinersAtMonth = allEmployees.filter((emp) => {
        const d = emp.joinDate || emp.createdAt;
        return d && new Date(d) >= startOfMonth && new Date(d) <= endOfMonth;
      }).length;

      return {
        month,
        total: totalEmployeesAtMonth,
        newJoined: newJoinersAtMonth,
      };
    });

    // Available years for filter dropdown
    const yearsSet = new Set(
      allEmployees
        .map((e) => new Date(e.joinDate || e.createdAt).getFullYear())
        .filter((y) => !isNaN(y) && y > 2000)
    );
    yearsSet.add(now.getFullYear());
    const availableYears = Array.from(yearsSet).sort((a, b) => b - a);

    res.status(200).json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        totalDepartments,
        totalHR,
        totalAdmins,
        recentEmployees,
        deptStats,
        todayAttendance,
        employeeGrowth,
        selectedYear,
        availableYears,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  ...employeeController,
  ...departmentController,
};
