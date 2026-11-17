const { generatePayroll, getPayrollSummary } = require("./generatePayrollController");
const { getEmployeeSalaries, updateEmployeeSalary } = require("./salarySetupController");
const {
  getAllPayrolls,
  getMyPayrolls,
  getPayrollById,
  updatePayrollStatus,
  updatePayroll,
  deletePayroll,
} = require("./payrollCrudController");

module.exports = {
  generatePayroll,
  getAllPayrolls,
  getMyPayrolls,
  getPayrollById,
  updatePayrollStatus,
  updatePayroll,
  deletePayroll,
  getPayrollSummary,
  getEmployeeSalaries,
  updateEmployeeSalary,
};
