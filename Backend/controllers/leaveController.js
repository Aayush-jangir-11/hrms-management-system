const Leave = require("../models/Leave");
const Employee = require("../models/Employee");
const WorkingPolicy = require("../models/WorkingPolicy");
const Attendance = require("../models/Attendance");
const createNotification = require("../utils/createNotification");
const { getStartOfDay } = require("./attendance/attendanceUtils");
const { getPagination, formatPagination } = require("../utils/paginate");


// Synchronize approved leave dates directly into the Attendance collection.
// @param {Object} leaveDoc - The Mongoose Leave document
// @param {string} action - 'APPROVE' | 'REVOKE'
const syncLeaveToAttendance = async (leaveDoc, action = "APPROVE") => {
  try {
    if (!leaveDoc || !leaveDoc.employee) return;

    // 1. Gather all dates covered by this leave
    const datesToSync = [];

    if (Array.isArray(leaveDoc.dateBreakdown) && leaveDoc.dateBreakdown.length > 0) {
      leaveDoc.dateBreakdown.forEach((item) => {
        if (item.date) {
          datesToSync.push({
            dateStr: item.date,
            dayType: item.dayType || "Full Day",
            halfDaySession: item.halfDaySession || null,
            payType: item.payType || "Paid",
          });
        }
      });
    } else {
      // Fallback: iterate between fromDate and toDate
      let curr = new Date(leaveDoc.fromDate);
      const end = new Date(leaveDoc.toDate);
      while (curr <= end) {
        datesToSync.push({
          dateStr: curr.toISOString().split("T")[0],
          dayType: "Full Day",
          halfDaySession: null,
          payType: "Paid",
        });
        curr.setDate(curr.getDate() + 1);
      }
    }

    // 2. Process each date
    for (const item of datesToSync) {
      const normalizedDate = getStartOfDay(item.dateStr);

      if (action === "APPROVE") {
        const isHalfDay = item.dayType === "Half Day";
        const status = isHalfDay ? "Half Day" : "On Leave";
        const sessionInfo = item.halfDaySession ? ` (${item.halfDaySession})` : "";
        const remark = `Approved Leave: ${leaveDoc.leaveType}${isHalfDay ? ` - Half Day${sessionInfo}` : ""}`;

        // Upsert attendance record: update status & remark without wiping checkIn/checkOut if already punched
        await Attendance.findOneAndUpdate(
          {
            employee: leaveDoc.employee,
            date: normalizedDate,
          },
          {
            $set: {
              status,
              remark,
            },
            $setOnInsert: {
              checkIn: null,
              checkOut: null,
              sessions: [],
              totalHours: isHalfDay ? 4.0 : 0,
            },
          },
          { upsert: true, new: true }
        );
      } else if (action === "REVOKE") {
        // If leave is rejected or cancelled, check if employee had a real check-in
        const existingRecord = await Attendance.findOne({
          employee: leaveDoc.employee,
          date: normalizedDate,
        });

        if (existingRecord) {
          if (!existingRecord.checkIn && (!existingRecord.sessions || existingRecord.sessions.length === 0)) {
            // Pure synthetic record created by leave: remove it so daily status reverts to absent/not punched
            await Attendance.deleteOne({ _id: existingRecord._id });
          } else {
            // Employee actually punched in: restore status based on physical hours
            existingRecord.status = existingRecord.totalHours >= 4.5 ? "Present" : "Half Day";
            existingRecord.remark = "Leave revoked; punch record retained";
            await existingRecord.save();
          }
        }
      }
    }
  } catch (err) {
    console.error("[LeaveSync] Error synchronizing leave to attendance:", err);
  }
};

// Apply for Leave (Employee)
// POST /api/leave/apply
// Private
const applyLeave = async (req, res) => {
  try {
    const { leaveType, fromDate, toDate, days, dateBreakdown, reason } = req.body;
    const employeeId = req.user._id;

    if (!leaveType || !fromDate || !toDate || !reason) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required leave details.",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const leaveFromDate = new Date(fromDate);
    leaveFromDate.setHours(0, 0, 0, 0);

    if (leaveFromDate < today) {
      return res.status(400).json({
        success: false,
        message: "Leave applications for past dates prior to current date are not allowed.",
      });
    }

    // 1. Resolve Employee & Active Working Policy
    const employee = await Employee.findById(employeeId);
    let policy = null;

    if (employee) {
      policy = await WorkingPolicy.findOne({
        status: "Active",
        targetScope: "Employee-Specific",
        targetEmployees: employeeId,
      });

      if (!policy && employee.department) {
        policy = await WorkingPolicy.findOne({
          status: "Active",
          targetScope: "Department-Specific",
          targetDepartments: employee.department,
        });
      }
    }

    if (!policy) {
      policy = await WorkingPolicy.findOne({ status: "Active" }).sort({ createdAt: -1 });
    }


    // 2. Build standard clean date breakdown for requested date range
    const startD = new Date(fromDate);
    const endD = new Date(toDate);
    const finalBreakdown = [];
    let curr = new Date(startD);

    const formatDateStrLocal = (dateObj) => {
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
      const dd = String(dateObj.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    while (curr <= endD) {
      const dStr = formatDateStrLocal(curr);
      const custom = Array.isArray(dateBreakdown)
        ? dateBreakdown.find((item) => item.date === dStr)
        : null;

      finalBreakdown.push({
        date: dStr,
        leaveType: leaveType,
        payType: custom?.payType || "Paid",
        dayType: custom?.dayType || "Full Day",
        halfDaySession: custom?.halfDaySession || null,
        isSandwiched: false,
      });

      curr.setDate(curr.getDate() + 1);
    }

    // Recalculate total days taking half days into account
    const totalCalculatedDays = finalBreakdown.reduce((sum, item) => {
      return sum + (item.dayType === "Half Day" ? 0.5 : 1.0);
    }, 0);

    const newLeave = await Leave.create({
      employee: employeeId,
      leaveType,
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      days: days || totalCalculatedDays,
      dateBreakdown: finalBreakdown,
      reason: reason.trim(),
      status: "Pending",
    });

    const populatedLeave = await Leave.findById(newLeave._id).populate(
      "employee",
      "name email department position employeeId"
    );

    const sandwichNotice = "";

    // Trigger Notification for HR & Admin Users
    try {
      const hrUsers = await Employee.find({ role: { $regex: /HR|Admin/i } }).select("_id");
      for (let hr of hrUsers) {
        await createNotification({
          recipient: hr._id,
          sender: employeeId,
          type: "leave",
          title: "New Leave Application",
          message: `${populatedLeave?.employee?.name || "An employee"} applied for ${leaveType} (${days || totalCalculatedDays} days).`,
          link: "/hr/leave",
        });
      }
    } catch (notifErr) {
      console.error("[Leave Controller] Notification trigger error:", notifErr);
    }

    return res.status(201).json({
      success: true,
      message: `Leave application submitted successfully.${sandwichNotice}`,
      data: populatedLeave,
    });
  } catch (error) {
    console.error("[Leave Controller] Error applying for leave:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to submit leave application.",
    });
  }
};

// Get logged-in employee's leave requests
// GET /api/leave/my-leaves
// Private
const getMyLeaveRequests = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const { isPaginated, page, limit, skip } = getPagination(req.query);

    const filter = { employee: employeeId };
    const totalRecords = await Leave.countDocuments(filter);

    let query = Leave.find(filter)
      .populate("approvedBy", "name email")
      .sort({ createdAt: -1 });

    if (isPaginated) {
      query = query.skip(skip).limit(limit);
    }

    const leaves = await query;

    return res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves,
      pagination: formatPagination({
        totalRecords,
        page,
        limit,
        isPaginated,
      }),
    });
  } catch (error) {
    console.error("[Leave Controller] Error fetching my leaves:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch leave history.",
    });
  }
};

// Get all leave requests (HR / Admin)
// GET /api/leave/all
// Private (HR, Admin)
const getAllLeaveRequests = async (req, res) => {
  try {
    const { status, employeeId } = req.query;
    const { isPaginated, page, limit, skip } = getPagination(req.query);

    const filter = {};
    if (status && status !== "All") filter.status = status;
    if (employeeId) filter.employee = employeeId;

    const totalRecords = await Leave.countDocuments(filter);

    let query = Leave.find(filter)
      .populate("employee", "name email department position employeeId")
      .populate("approvedBy", "name email")
      .sort({ createdAt: -1 });

    if (isPaginated) {
      query = query.skip(skip).limit(limit);
    }

    const leaves = await query;

    return res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves,
      pagination: formatPagination({
        totalRecords,
        page,
        limit,
        isPaginated,
      }),
    });
  } catch (error) {
    console.error("[Leave Controller] Error fetching all leaves:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch leave requests.",
    });
  }
};

// Update leave status (Approve / Reject) (HR / Admin)
// PUT /api/leave/:id/status
// Private (HR, Admin)
const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const approverId = req.user._id;

    if (!["Approved", "Rejected", "Pending"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value provided.",
      });
    }

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found.",
      });
    }

    const previousStatus = leave.status;

    leave.status = status;
    leave.approvedBy = approverId;
    if (status === "Rejected" && rejectionReason) {
      leave.rejectionReason = rejectionReason;
    }

    await leave.save();

    // Synchronize to Attendance records
    if (status === "Approved") {
      await syncLeaveToAttendance(leave, "APPROVE");
    } else if (previousStatus === "Approved" && (status === "Rejected" || status === "Pending")) {
      await syncLeaveToAttendance(leave, "REVOKE");
    }

    const updatedLeave = await Leave.findById(leave._id)
      .populate("employee", "name email department position employeeId")
      .populate("approvedBy", "name email");

    // Trigger Notification for Employee
    try {
      await createNotification({
        recipient: leave.employee,
        sender: approverId,
        type: "leave",
        title: `Leave Request ${status}`,
        message: `Your ${leave.leaveType} request for ${leave.days} day(s) has been ${status.toLowerCase()}.${status === "Rejected" && rejectionReason ? ` Reason: ${rejectionReason}` : ""}`,
        link: "/employee/leave",
      });
    } catch (notifErr) {
      console.error("[Leave Controller] Notification trigger error:", notifErr);
    }

    return res.status(200).json({
      success: true,
      message: `Leave request marked as ${status} and attendance synced successfully.`,
      data: updatedLeave,
    });
  } catch (error) {
    console.error("[Leave Controller] Error updating leave status:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update leave status.",
    });
  }
};

// Delete leave request
// DELETE /api/leave/:id
// Private
const deleteLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = (req.user.role || "").toLowerCase();

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found.",
      });
    }

    // Only owner of pending leave or HR/Admin can delete
    const isOwner = leave.employee.toString() === userId.toString();
    const isManagement = userRole === "admin" || userRole.includes("hr");

    if (!isOwner && !isManagement) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this leave request.",
      });
    }

    // If the leave was already approved, revoke its attendance entries before deleting
    if (leave.status === "Approved") {
      await syncLeaveToAttendance(leave, "REVOKE");
    }

    await Leave.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Leave request cancelled/deleted successfully.",
    });
  } catch (error) {
    console.error("[Leave Controller] Error deleting leave request:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete leave request.",
    });
  }
};

module.exports = {
  applyLeave,
  getMyLeaveRequests,
  getAllLeaveRequests,
  updateLeaveStatus,
  deleteLeaveRequest,
};
