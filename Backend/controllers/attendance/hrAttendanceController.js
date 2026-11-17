const Attendance = require("../../models/Attendance");
const PunchLog = require("../../models/PunchLog");
const Employee = require("../../models/Employee");
const { getStartOfDay, getEndOfDay } = require("./attendanceUtils");
const { getPagination, formatPagination } = require("../../utils/paginate");

// Get Raw Punch Logs for an employee (Audit trail)
// GET /api/attendance/logs/:employeeId
// Private (HR, Admin)
const getEmployeePunchLogs = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { date } = req.query;

    const filter = { employee: employeeId };

    if (date) {
      const d = new Date(date);
      filter.punchTime = {
        $gte: getStartOfDay(d),
        $lte: getEndOfDay(d),
      };
    }

    const logs = await PunchLog.find(filter)
      .sort({ punchTime: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    console.error("Error in getEmployeePunchLogs:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch punch logs.",
    });
  }
};

// Get All Employees Attendance (HR / Admin view)
// GET /api/attendance/all
// Private (HR, Admin)
const getAllAttendance = async (req, res) => {
  try {
    const { date, status, department, search } = req.query;
    const { isPaginated, page, limit, skip } = getPagination(req.query);

    const targetDate = date ? getStartOfDay(date) : getStartOfDay();

    // 1. Fetch all active employees
    const employees = await Employee.find({ status: { $ne: "Terminated" } })
      .select("name employeeId email department position role shift status")
      .populate("shift")
      .sort({ name: 1 })
      .lean();

    // 2. Fetch attendance records for the target date
    const attendanceRecords = await Attendance.find({
      date: targetDate,
    }).lean();

    const attendanceMap = {};
    attendanceRecords.forEach((att) => {
      if (att.employee) {
        attendanceMap[att.employee.toString()] = att;
      }
    });

    // 3. Combine employees with attendance records (Fallback to Absent/Not Punched if no attendance doc exists yet)
    let combinedRecords = employees.map((emp) => {
      const att = attendanceMap[emp._id.toString()];

      if (att) {
        return {
          ...att,
          employee: emp,
        };
      }

      return {
        _id: `synth_${emp._id}`,
        employee: emp,
        date: targetDate,
        checkIn: null,
        checkOut: null,
        totalHours: 0,
        status: "Absent",
        sessions: [],
        remark: "Not Punched Yet",
        isSynthetic: true,
      };
    });

    // Filter by status
    if (status && status !== "All") {
      combinedRecords = combinedRecords.filter((r) => r.status === status);
    }

    // Filter by department
    if (department && department !== "All") {
      combinedRecords = combinedRecords.filter(
        (r) => r.employee && r.employee.department === department
      );
    }

    // Filter by search query
    if (search) {
      const query = search.toLowerCase();
      combinedRecords = combinedRecords.filter(
        (r) =>
          r.employee &&
          ((r.employee.name || "").toLowerCase().includes(query) ||
            (r.employee.employeeId || "").toLowerCase().includes(query) ||
            (r.employee.email || "").toLowerCase().includes(query))
      );
    }

    const totalRecords = combinedRecords.length;
    let paginatedData = combinedRecords;

    if (isPaginated) {
      paginatedData = combinedRecords.slice(skip, skip + limit);
    }

    return res.status(200).json({
      success: true,
      count: paginatedData.length,
      data: paginatedData,
      pagination: formatPagination({
        totalRecords,
        page,
        limit,
        isPaginated,
      }),
    });
  } catch (error) {
    console.error("Error in getAllAttendance:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch attendance records.",
      error: error.message,
    });
  }
};

// Manual correction of attendance record (HR / Admin)
// PUT /api/attendance/:id
// Private (HR, Admin)
const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { checkIn, checkOut, status, remark, employeeId, date } = req.body;

    let attendance = null;

    if (id && !id.startsWith("synth_")) {
      attendance = await Attendance.findById(id);
    }

    if (!attendance) {
      let empId = employeeId;
      if (id && id.startsWith("synth_")) {
        empId = id.replace("synth_", "");
      }

      if (!empId) {
        return res.status(400).json({
          success: false,
          message: "Employee ID is required to create attendance record.",
        });
      }

      const targetDate = date ? getStartOfDay(date) : getStartOfDay();

      attendance = await Attendance.findOne({
        employee: empId,
        date: targetDate,
      });

      if (!attendance) {
        attendance = new Attendance({
          employee: empId,
          date: targetDate,
          status: status || "Present",
          sessions: [],
        });
      }
    }

    if (checkIn !== undefined) {
      attendance.checkIn = checkIn ? new Date(checkIn) : null;
    }
    if (checkOut !== undefined) {
      attendance.checkOut = checkOut ? new Date(checkOut) : null;
    }
    if (status) attendance.status = status;
    if (remark !== undefined) attendance.remark = remark;

    if (status === "Absent") {
      attendance.checkIn = null;
      attendance.checkOut = null;
      attendance.totalHours = 0;
    } else if (attendance.checkIn && attendance.checkOut) {
      const diffMs = attendance.checkOut.getTime() - attendance.checkIn.getTime();
      const hours = Math.max(0, diffMs / (1000 * 60 * 60));
      attendance.totalHours = parseFloat(hours.toFixed(2));
    } else {
      attendance.totalHours = 0;
    }

    await attendance.save();

    return res.status(200).json({
      success: true,
      message: "Attendance record updated successfully.",
      data: attendance,
    });
  } catch (error) {
    console.error("Error in updateAttendance:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update attendance record.",
      error: error.message,
    });
  }
};

module.exports = {
  getEmployeePunchLogs,
  getAllAttendance,
  updateAttendance,
};
