const express = require("express");
const router = express.Router();
const {
  createTask,
  getTodayTasks,
  toggleTaskStatus,
  getAllTasks,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");
const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");

// All task routes require authentication
router.use(protect);

// Employee & Common routes (accessible by Employee, HR, Admin)
router.get("/today", getTodayTasks);
router.put("/:id/toggle", toggleTaskStatus);

// HR & Admin restricted routes
router.post(
  "/",
  authorizeRoles("Admin", "HR Manager", "HR Executive", "HR"),
  createTask
);

router.get(
  "/all",
  authorizeRoles("Admin", "HR Manager", "HR Executive", "HR"),
  getAllTasks
);

router.put(
  "/:id",
  authorizeRoles("Admin", "HR Manager", "HR Executive", "HR"),
  updateTask
);

router.delete(
  "/:id",
  authorizeRoles("Admin", "HR Manager", "HR Executive", "HR"),
  deleteTask
);

module.exports = router;
