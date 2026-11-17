const express = require("express");
const {
  getAllPolicies,
  getPolicyById,
  createPolicy,
  updatePolicy,
  deletePolicy,
  assignPolicy,
} = require("../controllers/policyController");
const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");

const router = express.Router();

// Protect all policy routes
router.use(protect);

// Public / Shared Policy Routes (Read-only for all logged in employees)
router.get("/", getAllPolicies);
router.get("/:id", getPolicyById);

// Admin & HR Restricted Policy Routes (Create, Update, Delete, Assign)
router.post(
  "/",
  authorizeRoles("Admin", "HR Manager", "HR Executive", "HR"),
  createPolicy
);
router.put(
  "/:id",
  authorizeRoles("Admin", "HR Manager", "HR Executive", "HR"),
  updatePolicy
);
router.delete(
  "/:id",
  authorizeRoles("Admin", "HR Manager", "HR Executive", "HR"),
  deletePolicy
);
router.post(
  "/:id/assign",
  authorizeRoles("Admin", "HR Manager", "HR Executive", "HR"),
  assignPolicy
);

module.exports = router;
