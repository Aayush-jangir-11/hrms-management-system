const Attendance = require("../../models/Attendance");
const PunchLog = require("../../models/PunchLog");
const Employee = require("../../models/Employee");
const Department = require("../../models/Department");
const {
  getStartOfDay,
  parseShiftTime,
  parseHalfDayThreshold,
  parseGraceMinutes,
} = require("./attendanceUtils");

// Punch In or Punch Out (Creates PunchLog and updates/creates Attendance summary with multi-session support)
// POST /api/attendance/punch
// Private (Employee, HR, Admin)
const punchAttendance = async (req, res) => {
  try {
    const employeeId = req.user._id;

    const {
      punchType,
      location,
      device = "Web Portal",
    } = req.body;

    // 1. Validate punch type
    const type = punchType?.toUpperCase();

    if (!["IN", "OUT"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Punch type must be IN or OUT",
      });
    }

    const now = new Date();
    const todayStart = getStartOfDay(now);

    const employee = await Employee.findById(employeeId).populate("shift");
    const policy = employee?.shift || null;

    // 2. Find today's attendance
    let attendance = await Attendance.findOne({
      employee: employeeId,
      date: todayStart,
    });

    // 3. Check active session
    const isPunchedIn =
      attendance?.sessions?.some(
        (session) => !session.punchOut
      ) || false;

    // 4. Validate punch action
    if (type === "IN" && isPunchedIn) {
      return res.status(400).json({
        success: false,
        message: "You are already punched in",
      });
    }

    if (type === "OUT" && !isPunchedIn) {
      return res.status(400).json({
        success: false,
        message: "You must punch in first",
      });
    }

    // 5. Create punch log
    const punchLog = await PunchLog.create({
      employee: employeeId,
      punchType: type,
      punchTime: now,
      location: location || "Headquarters - Mumbai",
      device: req.device,
    });

    // 6. PUNCH IN
    if (type === "IN") {
      let isLate = false;
      let lateMinutes = 0;

      if (policy && policy.startTime) {
        const shiftStart = parseShiftTime(policy.startTime, now);
        const graceMins = parseGraceMinutes(policy.gracePeriod);

        if (shiftStart) {
          const lateThreshold = new Date(shiftStart.getTime() + graceMins * 60 * 1000);

          if (now > lateThreshold) {
            isLate = true;
            lateMinutes = Math.max(0, Math.round((now.getTime() - shiftStart.getTime()) / (60 * 1000)));
            console.log(
              `[Attendance Auto-Late] Employee ${employeeId} punched in at ${now.toLocaleTimeString()}, ` +
              `shift start was ${policy.startTime} (grace: ${graceMins}m). Marked Late by ${lateMinutes}m.`
            );
          }
        }
      }

      if (!attendance) {
        attendance = new Attendance({
          employee: employeeId,
          date: todayStart,
          checkIn: now,
          status: isLate ? "Late" : "Present",
          sessions: [{ punchIn: now }],
          remark: isLate
            ? `Late check-in by ${lateMinutes} mins (shift start: ${policy?.startTime || "N/A"})`
            : "On-time check-in",
        });
      } else {
        if (!attendance.checkIn) {
          attendance.checkIn = now;
        }

        if (isLate && attendance.status !== "Half Day") {
          attendance.status = "Late";
          attendance.remark = `Late check-in by ${lateMinutes} mins (shift start: ${policy?.startTime || "N/A"})`;
        }

        attendance.sessions.push({
          punchIn: now,
        });
      }

      await attendance.save();

      return res.status(200).json({
        success: true,
        message: isLate
          ? `Punched in successfully (Marked Late — ${lateMinutes} mins after shift start)`
          : "Punched in successfully",
        data: {
          punchLog,
          attendance,
          isLate,
          lateMinutes,
        },
      });
    }

    // 7. PUNCH OUT
    const activeSession = attendance.sessions.find(
      (session) => !session.punchOut
    );

    if (activeSession) {
      activeSession.punchOut = now;

      const durationMs =
        new Date(activeSession.punchOut) -
        new Date(activeSession.punchIn);

      activeSession.duration = parseFloat(
        (durationMs / (1000 * 60 * 60)).toFixed(2)
      );
    }

    attendance.checkOut = now;

    const totalHours = attendance.sessions.reduce(
      (acc, s) => acc + (s.duration || 0),
      0
    );

    attendance.totalHours = parseFloat(totalHours.toFixed(2));

    const halfDayThreshold = parseHalfDayThreshold(policy?.halfDayThreshold);

    if (attendance.totalHours < halfDayThreshold) {
      attendance.status = "Half Day";
      attendance.remark = `Half Day: Worked ${attendance.totalHours}h, below minimum threshold of ${halfDayThreshold}h.`;
      console.log(
        `[Attendance Auto-HalfDay] Employee ${employeeId} worked ${attendance.totalHours}h ` +
        `(threshold: ${halfDayThreshold}h). Status set to 'Half Day'.`
      );
    } else if (attendance.status === "Half Day" && attendance.totalHours >= halfDayThreshold) {
      attendance.status = "Present";
      attendance.remark = `Full Day completed: Worked ${attendance.totalHours}h (met threshold of ${halfDayThreshold}h).`;
    }

    await attendance.save();

    return res.status(200).json({
      success: true,
      message: attendance.status === "Half Day"
        ? `Punched out successfully (Status: Half Day — worked ${attendance.totalHours}h of ${halfDayThreshold}h minimum)`
        : "Punched out successfully",
      data: {
        punchLog,
        attendance,
        halfDayThreshold,
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to process attendance",
    });
  }
};

// Get Today's Attendance & Punch Status for logged-in employee
// GET /api/attendance/today
// Private (Employee, HR, Admin)
const getTodayStatus = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const todayStart = getStartOfDay(new Date());

    const employee = await Employee.findById(employeeId).populate("shift");

    const deptDoc = employee?.department
      ? await Department.findOne({
        name: { $regex: new RegExp(`^${employee.department.trim()}$`, "i") },
      })
      : null;

    const attendance = await Attendance.findOne({
      employee: employeeId,
      date: todayStart,
    });

    const latestPunch = await PunchLog.findOne({
      employee: employeeId,
    }).sort({ punchTime: -1 });

    const isCurrentlyPunchedIn = Boolean(
      attendance?.sessions && attendance.sessions.some((s) => !s.punchOut)
    );
    const isShiftCompleted = Boolean(attendance && !isCurrentlyPunchedIn && attendance.checkOut);

    let currentSessionSeconds = 0;
    if (isCurrentlyPunchedIn && attendance?.sessions && attendance.sessions.length > 0) {
      const activeSession = attendance.sessions.find((s) => !s.punchOut);
      if (activeSession) {
        currentSessionSeconds = Math.max(
          0,
          Math.floor((Date.now() - new Date(activeSession.punchIn).getTime()) / 1000)
        );
      }
    }
    const accumulatedSeconds = Math.round((attendance?.totalHours || 0) * 3600);
    const liveTotalSeconds = accumulatedSeconds + currentSessionSeconds;

    return res.status(200).json({
      success: true,
      data: {
        isPunchedIn: isCurrentlyPunchedIn,
        isCompleted: isShiftCompleted,
        attendance: attendance || null,
        latestPunch: latestPunch || null,
        liveTotalSeconds,
        accumulatedHours: attendance?.totalHours || 0,
        sessions: attendance?.sessions || [],
        department: employee?.department || req.user.department || "General",
        headquarter: deptDoc?.office || "Headquarters - Mumbai",
        office: deptDoc?.office || "Headquarters - Mumbai",
        shift: employee?.shift || null,
      },
    });
  } catch (error) {
    console.error("Error in getTodayStatus:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch today's status.",
    });
  }
};

module.exports = {
  punchAttendance,
  getTodayStatus,
};
