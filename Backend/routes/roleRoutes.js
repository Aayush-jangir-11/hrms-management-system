const express = require("express");
const {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  updateRolePermissions,
  deleteRole,
} = require("../controllers/roleController");

const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");

const router = express.Router();

// All role routes require authentication + Admin access
router.use(protect);
router.use(authorizeRoles("Admin", "Super Admin"));

// GET    /api/roles           → List all roles
router.get("/", getAllRoles);

// GET    /api/roles/:id       → Get single role
router.get("/:id", getRoleById);

// POST   /api/roles           → Create new role
router.post("/", createRole);

// PUT    /api/roles/:id       → Update role name/description
router.put("/:id", updateRole);

// PUT    /api/roles/:id/permissions → Save module permissions for a role
router.put("/:id/permissions", updateRolePermissions);

// DELETE /api/roles/:id       → Delete role (non-protected only)
router.delete("/:id", deleteRole);

module.exports = router;
