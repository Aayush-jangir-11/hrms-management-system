const express = require("express");
const {
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
} = require("../controllers/payroll");

const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");

const router = express.Router();

// Apply protect middleware to all payroll routes
router.use(protect);

const adminHrRoles = ["Admin", "admin", "HR Manager", "HR Executive", "HR", "hr"];

// Employee route (view own payroll history)
router.get("/my-payrolls", getMyPayrolls);

// Salary Configuration Routes
router.get("/employee-salaries", authorizeRoles(...adminHrRoles), getEmployeeSalaries);
router.put("/employee-salaries/:id", authorizeRoles(...adminHrRoles), updateEmployeeSalary);

// Admin & HR routes
router.get("/summary", authorizeRoles(...adminHrRoles), getPayrollSummary);
router.post("/generate", authorizeRoles(...adminHrRoles), generatePayroll);
router.get("/", authorizeRoles(...adminHrRoles), getAllPayrolls);

// Specific payroll by ID (authorize check inside controller for owner or Admin/HR)
router.get("/:id", getPayrollById);

// Update status, manual edits, deletion
router.put("/:id/status", authorizeRoles(...adminHrRoles), updatePayrollStatus);
router.put("/:id", authorizeRoles(...adminHrRoles), updatePayroll);
router.delete("/:id", authorizeRoles("Admin", "admin"), deletePayroll);

module.exports = router;
