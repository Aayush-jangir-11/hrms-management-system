const express = require('express');
const {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} = require('../controllers/employeeController');
const {
  createDepartment,
  getAllDepartments,
  updateDepartment,
  deleteDepartment,
} = require('../controllers/departmentController');
const { getDashboardStats } = require('../controllers/adminController');
const {
  getSettings,
  updateSettings,
  testEmailConnection,
} = require('../controllers/settingsController');
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

const router = express.Router();

// Apply authentication and Admin role authorization to all admin routes
router.use(protect);
router.use(authorizeRoles('Admin'));

// Dashboard Stats
router.get('/dashboard-stats', getDashboardStats);

// Employee Management Routes (using unified employeeController)
router.get('/employees', getAllEmployees);
router.post('/employees', createEmployee);
router.post('/employees/create', createEmployee);
router.get('/employees/:id', getEmployeeById);
router.put('/employees/:id', updateEmployee);
router.delete('/employees/:id', deleteEmployee);

// Department Management Routes (using dedicated departmentController)
router.post('/departments', createDepartment);
router.get('/departments', getAllDepartments);
router.put('/departments/:id', updateDepartment);
router.delete('/departments/:id', deleteDepartment);

// Global Platform & Email / SMTP Settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);
router.post('/settings/test-email', testEmailConnection);

module.exports = router;
