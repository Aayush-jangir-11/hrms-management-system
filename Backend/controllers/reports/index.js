const { getReportStats, exportReportCSV } = require("./exportReport");
const { getAttendanceReport, getComprehensiveAttendanceReport } = require("./attendanceReport");
const { getLeaveReport } = require("./leaveReport");
const { getPayrollReport } = require("./payrollReport");
const { getDepartmentReport } = require("./departmentReport");

module.exports = {
  getReportStats,
  getAttendanceReport,
  getLeaveReport,
  getPayrollReport,
  getDepartmentReport,
  exportReportCSV,
  getComprehensiveAttendanceReport,
};
