const Attendance = require("../../models/Attendance");
const PunchLog = require("../../models/PunchLog");
const Leave = require("../../models/Leave");
const Employee = require("../../models/Employee");
const CalendarEvent = require("../../models/CalendarEvent");
const WorkingPolicy = require("../../models/WorkingPolicy");
const { formatDateStr, getDateRange, applySandwichRule } = require("./reportUtils");

// Get Attendance Analytics Report
// GET /api/reports/attendance
// Private (Admin / HR)
const getAttendanceReport = async (req, res) => {
  console.log("[reportController] -> getAttendanceReport called with query:", req.query);
  try {
    const { range = "month", startDate: qStart, endDate: qEnd, department } = req.query;
    const { startDate, endDate } = getDateRange(range, qStart, qEnd);

    const matchStage = {
      date: { $gte: startDate, $lte: endDate },
    };

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
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$date" },
          },
          present: {
            $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] },
          },
          absent: {
            $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] },
          },
          late: {
            $sum: { $cond: [{ $eq: ["$status", "Late"] }, 1, 0] },
          },
          halfDay: {
            $sum: { $cond: [{ $eq: ["$status", "Half Day"] }, 1, 0] },
          },
          onLeave: {
            $sum: { $cond: [{ $eq: ["$status", "On Leave"] }, 1, 0] },
          },
          total: { $sum: 1 },
          avgHours: { $avg: "$totalHours" },
        },
      },
      {
        $project: {
          date: "$_id",
          _id: 0,
          present: 1,
          absent: 1,
          late: 1,
          halfDay: 1,
          onLeave: 1,
          total: 1,
          avgHours: { $round: ["$avgHours", 1] },
          percentage: {
            $cond: [
              { $gt: ["$total", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          { $add: ["$present", "$late", "$halfDay"] },
                          "$total",
                        ],
                      },
                      100,
                    ],
                  },
                  1,
                ],
              },
              0,
            ],
          },
        },
      },
      { $sort: { date: -1 } }
    );

    const dbBreakdown = await Attendance.aggregate(pipeline);
    const breakdownMap = new Map();
    dbBreakdown.forEach((row) => breakdownMap.set(row.date, row));

    // 1. Calculate target active workforce with department filter support
    const empFilter = { status: "Active" };
    if (department && department !== "All Departments" && department !== "All") {
      empFilter.department = department;
    }
    const targetTotalEmployees = await Employee.countDocuments(empFilter);

    // 2. Fetch company holidays within report range
    const holidays = await CalendarEvent.find({
      category: "Holiday",
      date: { $gte: formatDateStr(startDate), $lte: formatDateStr(endDate) },
    }).lean();
    const holidayDates = new Set(holidays.map((h) => h.date));

    // 3. Normalized today's date to distinguish past vs future dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 4. Fill all dates dynamically in the requested date range
    const completeBreakdown = [];
    let current = new Date(endDate);
    current.setHours(0, 0, 0, 0);

    const startBoundary = new Date(startDate);
    startBoundary.setHours(0, 0, 0, 0);

    while (current >= startBoundary) {
      const dateStr = formatDateStr(current);
      const dayOfWeek = current.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidayDates.has(dateStr);
      const isFutureDate = current > today;

      const row = breakdownMap.get(dateStr);

      if (isFutureDate) {
        // Future dates: unpunched and pending
        completeBreakdown.push({
          date: dateStr,
          present: 0,
          absent: 0,
          late: 0,
          halfDay: 0,
          onLeave: 0,
          total: 0,
          avgHours: 0,
          percentage: 0,
        });
      } else if (isWeekend || isHoliday) {
        // Weekends or declared public holidays
        completeBreakdown.push({
          date: dateStr,
          present: 0,
          absent: 0,
          late: 0,
          halfDay: 0,
          onLeave: 0,
          total: 0,
          avgHours: 0,
          percentage: 0,
        });
      } else if (row) {
        // Existing attendance records: count unpunched active employees as absent
        const present = row.present || 0;
        const late = row.late || 0;
        const halfDay = row.halfDay || 0;
        const onLeave = row.onLeave || 0;
        const recordedCount = present + late + halfDay + onLeave + (row.absent || 0);

        const unrecordedAbsent = Math.max(0, targetTotalEmployees - recordedCount);
        const totalAbsent = (row.absent || 0) + unrecordedAbsent;
        const effectiveTotal = Math.max(targetTotalEmployees, recordedCount);

        const payablePresent = present + late + halfDay * 0.5;
        const realPercentage =
          effectiveTotal > 0
            ? Math.round((payablePresent / effectiveTotal) * 100)
            : 0;

        completeBreakdown.push({
          date: dateStr,
          present,
          absent: totalAbsent,
          late,
          halfDay,
          onLeave,
          total: effectiveTotal,
          avgHours: row.avgHours ? Number(Number(row.avgHours).toFixed(1)) : 0,
          percentage: realPercentage,
        });
      } else {
        // Past working day with no punches recorded: mark employees as Absent
        completeBreakdown.push({
          date: dateStr,
          present: 0,
          absent: targetTotalEmployees,
          late: 0,
          halfDay: 0,
          onLeave: 0,
          total: targetTotalEmployees,
          avgHours: 0,
          percentage: 0,
        });
      }

      current.setDate(current.getDate() - 1);
    }

    return res.status(200).json({
      success: true,
      name: "Daily Attendance Report",
      type: "Attendance",
      coverage: `${formatDateStr(startDate)} to ${formatDateStr(endDate)}`,
      lastGenerated: new Date().toISOString().split("T")[0],
      data: completeBreakdown,
    });
  } catch (error) {
    console.error("Error generating attendance report:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate attendance report",
      error: error.message,
    });
  }
};

// GET /api/reports/comprehensive
// Private: Employee / HR / Admin
const getComprehensiveAttendanceReport = async (req, res) => {
  try {
    const targetEmployeeId = req.query.employeeId || req.user?._id;

    if (!targetEmployeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required",
      });
    }

    const employee = await Employee.findById(targetEmployeeId)
      .populate("shift")
      .lean();

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const now = new Date();

    let startDateObj;
    let endDateObj;

    if (req.query.startDate) {
      startDateObj = new Date(req.query.startDate);
      startDateObj.setHours(0, 0, 0, 0);
    } else {
      startDateObj = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    if (req.query.endDate) {
      endDateObj = new Date(req.query.endDate);
      endDateObj.setHours(23, 59, 59, 999);
    } else {
      endDateObj = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const startDateStr = formatDateStr(startDateObj);
    const endDateStr = formatDateStr(endDateObj);

    let policy = employee.shift;

    // Employee specific policy
    if (!policy) {
      policy = await WorkingPolicy.findOne({
        targetEmployees: targetEmployeeId,
        status: "Active",
      }).lean();
    }

    // Department policy
    if (!policy && employee.department) {
      policy = await WorkingPolicy.findOne({
        targetScope: "Department-Specific",
        targetDepartments: employee.department,
        status: "Active",
      }).lean();
    }

    // Company policy
    if (!policy) {
      policy = await WorkingPolicy.findOne({
        targetScope: "Company-Wide",
        status: "Active",
      }).lean();
    }

    // Default working days
    const workDays =
      policy?.workDays?.length > 0
        ? policy.workDays
        : ["Mon", "Tue", "Wed", "Thu", "Fri"];

    // Sandwich setting
    const isSandwichEnabled = policy?.sandwichRuleEnabled ?? true;

    const holidayEvents = await CalendarEvent.find({
      category: "Holiday",
      date: {
        $gte: startDateStr,
        $lte: endDateStr,
      },
    }).lean();

    // Date -> Holiday title
    const holidayMap = new Map();
    holidayEvents.forEach((event) => {
      holidayMap.set(event.date, event.title);
    });

    const attendanceRecords = await Attendance.find({
      employee: targetEmployeeId,
      date: {
        $gte: startDateObj,
        $lte: endDateObj,
      },
    }).lean();

    const attendanceMap = new Map();
    attendanceRecords.forEach((attendance) => {
      const dateStr = formatDateStr(new Date(attendance.date));
      attendanceMap.set(dateStr, attendance);
    });

    const punchLogs = await PunchLog.find({
      employee: targetEmployeeId,
      punchTime: {
        $gte: startDateObj,
        $lte: endDateObj,
      },
    })
      .sort({ punchTime: 1 })
      .lean();

    const punchMap = new Map();
    punchLogs.forEach((punch) => {
      const dateStr = formatDateStr(new Date(punch.punchTime));
      if (!punchMap.has(dateStr)) {
        punchMap.set(dateStr, []);
      }
      punchMap.get(dateStr).push(punch);
    });

    const leaves = await Leave.find({
      employee: targetEmployeeId,
      status: {
        $in: ["Approved", "Pending"],
      },
      $or: [
        {
          fromDate: { $lte: endDateObj },
          toDate: { $gte: startDateObj },
        },
      ],
    }).lean();

    const leaveMap = new Map();
    leaves.forEach((leave) => {
      if (Array.isArray(leave.dateBreakdown) && leave.dateBreakdown.length > 0) {
        leave.dateBreakdown.forEach((breakdown) => {
          if (!breakdown.date) return;
          leaveMap.set(breakdown.date, {
            leaveId: leave._id,
            leaveType: leave.leaveType,
            payType: breakdown.payType || "Paid",
            dayType: breakdown.dayType || "Full Day",
            status: leave.status,
          });
        });
      } else {
        let currentDate = new Date(leave.fromDate);
        const leaveEndDate = new Date(leave.toDate || leave.fromDate);

        currentDate.setHours(0, 0, 0, 0);
        leaveEndDate.setHours(0, 0, 0, 0);

        while (currentDate <= leaveEndDate) {
          const dateStr = formatDateStr(currentDate);
          leaveMap.set(dateStr, {
            leaveId: leave._id,
            leaveType: leave.leaveType,
            payType: "Paid",
            dayType: "Full Day",
            status: leave.status,
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    });

    const dailyReport = [];
    let currentDate = new Date(startDateObj);

    while (currentDate <= endDateObj) {
      const dateStr = formatDateStr(currentDate);
      const dayName = currentDate.toLocaleDateString("en-US", { weekday: "short" });
      const isWorkingDay = workDays.includes(dayName);
      const isHoliday = holidayMap.has(dateStr);
      const attendance = attendanceMap.get(dateStr);
      const punches = punchMap.get(dateStr) || [];
      const leave = leaveMap.get(dateStr);

      let initialStatus = "Absent";

      if (attendance && attendance.status === "Present") {
        initialStatus = "Present";
      } else if (attendance && attendance.status === "Half Day") {
        initialStatus = "Half Day";
      } else if (attendance && attendance.status === "Late") {
        initialStatus = "Late";
      } else if (leave) {
        initialStatus = leave.status === "Approved" ? "On Leave" : "Leave Pending";
      } else if (isHoliday) {
        initialStatus = "Holiday";
      } else if (!isWorkingDay) {
        initialStatus = "Weekly Off";
      }

      dailyReport.push({
        date: dateStr,
        dayName,
        isWorkingDay,
        isHoliday,
        holidayTitle: isHoliday ? holidayMap.get(dateStr) : null,
        status: initialStatus,
        punches,
        checkIn: attendance?.checkIn || null,
        checkOut: attendance?.checkOut || null,
        totalHours: attendance?.totalHours || 0,
        leaveDetails: leave || null,
        isSandwiched: false,
        sandwichDetails: null,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (isSandwichEnabled) {
      applySandwichRule(dailyReport);
    }

    const summary = {
      totalDays: dailyReport.length,
      totalWorkingDays: 0,
      presentDays: 0,
      lateDays: 0,
      halfDays: 0,
      approvedLeaveDays: 0,
      paidLeaveDays: 0,
      unpaidLeaveDays: 0,
      pendingLeaveDays: 0,
      weeklyOffs: 0,
      holidays: 0,
      sandwichedDays: 0,
      absentDays: 0,
      totalLopDays: 0,
      totalPayableDays: 0,
      lopBreakdown: {
        fromAbsent: 0,
        fromSandwich: 0,
        fromUnpaidLeave: 0,
        fromPendingLeave: 0,
        fromHalfDay: 0,
      },
    };

    dailyReport.forEach((day) => {
      if (day.status === "Present") {
        summary.presentDays += 1;
        summary.totalWorkingDays += 1;
        summary.totalPayableDays += 1;
      } else if (day.status === "Late") {
        summary.lateDays += 1;
        summary.presentDays += 1;
        summary.totalWorkingDays += 1;
        summary.totalPayableDays += 1;
      } else if (day.status === "Half Day") {
        summary.halfDays += 1;
        summary.totalWorkingDays += 1;
        summary.totalPayableDays += 0.5;
        summary.totalLopDays += 0.5;
        summary.lopBreakdown.fromHalfDay += 0.5;
      } else if (day.status === "On Leave") {
        summary.approvedLeaveDays += 1;
        summary.totalWorkingDays += 1;
        if (day.leaveDetails?.payType === "Paid") {
          summary.paidLeaveDays += 1;
          summary.totalPayableDays += 1;
        } else {
          summary.unpaidLeaveDays += 1;
          summary.totalLopDays += 1;
          summary.lopBreakdown.fromUnpaidLeave += 1;
        }
      } else if (day.status === "Leave Pending") {
        summary.pendingLeaveDays += 1;
        summary.totalWorkingDays += 1;
        summary.totalLopDays += 1;
        summary.lopBreakdown.fromPendingLeave += 1;
      } else if (day.status === "Weekly Off") {
        summary.weeklyOffs += 1;
        summary.totalPayableDays += 1;
      } else if (day.status === "Holiday") {
        summary.holidays += 1;
        summary.totalPayableDays += 1;
      } else if (day.status === "Sandwich Leave") {
        summary.sandwichedDays += 1;
        summary.totalLopDays += 1;
        summary.lopBreakdown.fromSandwich += 1;
      } else if (day.status === "Absent") {
        summary.absentDays += 1;
        summary.totalWorkingDays += 1;
        summary.totalLopDays += 1;
        summary.lopBreakdown.fromAbsent += 1;
      }
    });

    return res.status(200).json({
      success: true,
      employee: {
        id: employee._id,
        name: employee.name,
        employeeId: employee.employeeId,
        department: employee.department,
      },
      policyApplied: {
        name: policy?.name || "Default Shift Policy",
        sandwichRuleEnabled: isSandwichEnabled,
        workDays,
      },
      summary,
      dailyReport,
    });
  } catch (error) {
    console.error("Error in getComprehensiveAttendanceReport:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate comprehensive attendance report.",
      error: error.message,
    });
  }
};

module.exports = {
  getAttendanceReport,
  getComprehensiveAttendanceReport,
};
