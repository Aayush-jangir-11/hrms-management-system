const express = require("express");
const {
  applyLeave,
  getMyLeaveRequests,
  getAllLeaveRequests,
  updateLeaveStatus,
  deleteLeaveRequest,
} = require("../controllers/leaveController");
const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");

const router = express.Router();

// Apply protect middleware to all leave routes
router.use(protect);

// Employee & HR shared routes
router.post("/apply", applyLeave);
router.get("/my-leaves", getMyLeaveRequests);
router.delete("/:id", deleteLeaveRequest); // Controller handles permission (owner of pending leave or HR/Admin)

// HR & Admin restricted routes
router.get(
  "/all",
  authorizeRoles("Admin", "admin", "HR Manager", "HR Executive", "HR", "hr"),
  getAllLeaveRequests
);
router.put(
  "/:id/status",
  authorizeRoles("Admin", "admin", "HR Manager", "HR Executive", "HR", "hr"),
  updateLeaveStatus
);

module.exports = router;
