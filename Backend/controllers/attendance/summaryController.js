const Attendance = require("../../models/Attendance");
const PunchLog = require("../../models/PunchLog");
const Employee = require("../../models/Employee");

// Get Attendance History for logged in employee
// GET /api/attendance/my-history
// Private (Employee)
const getMyAttendanceHistory = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const { month, year, status } = req.query;

    const filter = { employee: employeeId };

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    if (status && status !== "All") {
      filter.status = status;
    }

    const records = await Attendance.find(filter)
      .sort({ date: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error("Error in getMyAttendanceHistory:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch attendance history.",
    });
  }
};

// Get Complete Dynamic Monthly Summary & Punch Logs Container for an Employee
// Supports past and current months/years via query params ?month=8&year=2026
// GET /api/attendance/monthly-summary/:employeeId?
// Private (Employee, HR, Admin)
const getEmployeeMonthlyFullSummary = async (req, res) => {
  try {
    let targetEmployeeId = req.params.employeeId;

    if (!targetEmployeeId || targetEmployeeId === "me") {
      targetEmployeeId = req.user._id;
    }

    // Authorization check: non-admin/HR users can only view their own summary
    const isSelf = targetEmployeeId.toString() === req.user._id.toString();
    const isAdminOrHR = ["Admin", "HR"].includes(req.user.role);

    if (!isSelf && !isAdminOrHR) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to view another employee's attendance summary.",
      });
    }

    const employee = await Employee.findById(targetEmployeeId)
      .select("-password")
      .populate("shift");

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee record not found." });
    }

    const now = new Date();
    const month = req.query.month ? parseInt(req.query.month, 10) : now.getMonth() + 1;
    const year = req.query.year ? parseInt(req.query.year, 10) : now.getFullYear();

    if (isNaN(month) || month < 1 || month > 12 || isNaN(year) || year < 2000 || year > 2100) {
      return res.status(400).json({
        success: false,
        message: "Invalid month (1-12) or year provided.",
      });
    }

    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    const totalDaysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

    // 1. Fetch Attendance Records for the specific requested month & year
    const attendanceRecords = await Attendance.find({
      employee: targetEmployeeId,
      date: { $gte: startDate, $lte: endDate },
    })
      .sort({ date: 1 })
      .lean();

    const attendanceMap = {};
    attendanceRecords.forEach((record) => {
      if (record.date) {
        const dStr = typeof record.date === "string" 
          ? record.date.split("T")[0] 
          : new Date(record.date).toISOString().split("T")[0];
        attendanceMap[dStr] = record;
      }
    });

    // 2. Fetch Raw Punch Logs for the specific requested month & year
    const punchLogs = await PunchLog.find({
      employee: targetEmployeeId,
      punchTime: { $gte: startDate, $lte: endDate },
    })
      .sort({ punchTime: 1 })
      .lean();

    // 3. Synthesize day-by-day full calendar matrix for the month
    const dailyBreakdown = [];
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let halfDayCount = 0;
    let leaveCount = 0;
    let weekendCount = 0;
    let totalWorkedHours = 0;

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dayDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      const dateStr = dayDate.toISOString().split("T")[0];
      const dayOfWeek = dayDate.getUTCDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayOfWeek];

      const record = attendanceMap[dateStr];

      let dayStatus = "Absent";
      let totalHours = 0;
      let checkIn = null;
      let checkOut = null;
      let sessions = [];
      let remark = "";

      if (record) {
        dayStatus = record.status || "Present";
        totalHours = record.totalHours || 0;
        checkIn = record.checkIn ? new Date(record.checkIn).toISOString() : null;
        checkOut = record.checkOut ? new Date(record.checkOut).toISOString() : null;
        sessions = (record.sessions || []).map((s) => ({
          punchIn: s.punchIn ? new Date(s.punchIn).toISOString() : null,
          punchOut: s.punchOut ? new Date(s.punchOut).toISOString() : null,
          duration: s.duration || 0,
        }));
        remark = record.remark || "";
      } else if (isWeekend) {
        dayStatus = "Weekend";
        remark = "Weekly Off";
      } else {
        const todayUtcStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
        if (dayDate > todayUtcStart) {
          dayStatus = "Upcoming";
          remark = "Future date";
        } else {
          dayStatus = "Absent";
          remark = "No punch recorded";
        }
      }

      if (dayStatus === "Present") {
        presentCount++;
      } else if (dayStatus === "Late") {
        lateCount++;
        presentCount++;
      } else if (dayStatus === "Half Day") {
        halfDayCount++;
      } else if (dayStatus === "On Leave") {
        leaveCount++;
      } else if (dayStatus === "Weekend") {
        weekendCount++;
      } else if (dayStatus === "Absent") {
        absentCount++;
      }

      totalWorkedHours += totalHours;

      dailyBreakdown.push({
        dayNumber: day,
        date: dateStr,
        dayName,
        isWeekend,
        status: dayStatus,
        checkIn,
        checkOut,
        totalHours,
        sessions,
        remark,
      });
    }

    const workedDaysCount = dailyBreakdown.filter((d) => d.totalHours > 0).length;
    const avgHoursPerDay =
      workedDaysCount > 0
        ? parseFloat((totalWorkedHours / workedDaysCount).toFixed(2))
        : 0;

    return res.status(200).json({
      success: true,
      data: {
        employee: {
          id: employee._id,
          employeeId: employee.employeeId,
          name: employee.name,
          email: employee.email,
          phone: employee.phone,
          department: employee.department,
          position: employee.position,
          role: employee.role,
          shift: employee.shift || null,
        },
        period: {
          month,
          year,
          totalDaysInMonth,
        },
        stats: {
          totalDaysRecorded: dailyBreakdown.length,
          present: presentCount,
          absent: absentCount,
          late: lateCount,
          halfDay: halfDayCount,
          onLeave: leaveCount,
          totalWorkedHours: parseFloat(totalWorkedHours.toFixed(2)),
          avgHoursPerDay,
        },
        dailyAttendance: dailyBreakdown.map((r) => ({
          date: r.date,
          status: r.status,
          checkIn: r.checkIn || null,
          checkOut: r.checkOut || null,
          totalHours: r.totalHours || 0,
          sessions: r.sessions || [],
        })),
        punchLogs: punchLogs.map((p) => ({
          punchTime: p.punchTime,
          punchType: p.punchType,
          location: p.location || "Office",
          device: p.device || "Web Portal",
        })),
      },
    });
  } catch (error) {
    console.error("Error in getEmployeeMonthlyFullSummary:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch monthly summary and punch logs.",
      error: error.message,
    });
  }
};

module.exports = {
  getMyAttendanceHistory,
  getEmployeeMonthlyFullSummary,
};
