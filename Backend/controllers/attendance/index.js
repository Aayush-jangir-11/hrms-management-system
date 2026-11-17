const { punchAttendance, getTodayStatus } = require("./punchController");
const { getMyAttendanceHistory, getEmployeeMonthlyFullSummary } = require("./summaryController");
const { getEmployeePunchLogs, getAllAttendance, updateAttendance } = require("./hrAttendanceController");

module.exports = {
  punchAttendance,
  getTodayStatus,
  getMyAttendanceHistory,
  getEmployeePunchLogs,
  getAllAttendance,
  updateAttendance,
  getEmployeeMonthlyFullSummary,
};
