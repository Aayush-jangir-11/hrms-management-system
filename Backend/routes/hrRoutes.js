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
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

const router = express.Router();

// Protect all HR routes and restrict to authorized roles
router.use(protect);
router.use(authorizeRoles('Admin', 'HR Manager', 'HR Executive', 'HR'));

// Dashboard Stats for HR
router.get('/dashboard-stats', getDashboardStats);

// Employee Operations for HR
router.get('/employees', getAllEmployees);
router.post('/employees', createEmployee);
router.post('/employees/create', createEmployee);
router.get('/employees/:id', getEmployeeById);
router.put('/employees/:id', updateEmployee);
router.delete('/employees/:id', deleteEmployee);

// Department Operations for HR
router.get('/departments', getAllDepartments);
router.post('/departments', createDepartment);
router.put('/departments/:id', updateDepartment);
router.delete('/departments/:id', deleteDepartment);

module.exports = router;
