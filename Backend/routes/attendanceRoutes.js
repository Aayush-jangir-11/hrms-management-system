const express = require("express");
const router = express.Router();
const {
  punchAttendance,
  getTodayStatus,
  getMyAttendanceHistory,
  getEmployeePunchLogs,
  getAllAttendance,
  updateAttendance,
  getEmployeeMonthlyFullSummary,
} = require("../controllers/attendance");
const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");
const detectDevice = require("../middlewares/detectDevice");

// Employee & all logged in users routes
router.post("/punch", protect, detectDevice, punchAttendance);
router.get("/today", protect, getTodayStatus);
router.get("/my-history", protect, getMyAttendanceHistory);
router.get("/monthly-summary", protect, getEmployeeMonthlyFullSummary);
router.get("/monthly-summary/:employeeId", protect, getEmployeeMonthlyFullSummary);

// HR / Admin routes
router.get("/all", protect, authorizeRoles("Admin", "HR"), getAllAttendance);
router.get("/logs/:employeeId", protect, authorizeRoles("Admin", "HR"), getEmployeePunchLogs);
router.put("/:id", protect, authorizeRoles("Admin", "HR"), updateAttendance);

module.exports = router;
