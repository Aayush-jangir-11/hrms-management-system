const express = require("express");
const {
  getReportStats,
  getAttendanceReport,
  getLeaveReport,
  getPayrollReport,
  getDepartmentReport,
  exportReportCSV,
  getComprehensiveAttendanceReport,
} = require("../controllers/reports");
const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");

const router = express.Router();

// Comprehensive attendance report — accessible by all logged-in users (self or HR/Admin for others)
router.get("/comprehensive", protect, getComprehensiveAttendanceReport);

// Restrict all other report analytics to HR and Admin roles
router.use(protect);
router.use(authorizeRoles("Admin", "HR Manager", "HR Executive", "HR"));

// Statistics Cards Summary
router.get("/stats", getReportStats);

// Individual Reports
router.get("/attendance", getAttendanceReport);
router.get("/leave", getLeaveReport);
router.get("/payroll", getPayrollReport);
router.get("/department", getDepartmentReport);

// Direct CSV Export Stream
router.get("/export/:type", exportReportCSV);

module.exports = router;
