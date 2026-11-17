const Role = require("../models/Role");
const Employee = require("../models/Employee");

// GET /api/roles
// Private (Admin)

exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find().sort({ createdAt: 1 }).lean();

    // Dynamically calculate assigned users count for each role from Employee collection
    const rolesWithCounts = await Promise.all(
      roles.map(async (role) => {
        const count = await Employee.countDocuments({
          role: { $regex: new RegExp(`^${role.name.trim()}$`, "i") },
        });
        return {
          ...role,
          users: count,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: rolesWithCounts,
    });
  } catch (error) {
    console.error("[RoleController] getAllRoles:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


// GET /api/roles/:id
// Private (Admin)
exports.getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id).lean();

    if (!role) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }

    const count = await Employee.countDocuments({
      role: { $regex: new RegExp(`^${role.name.trim()}$`, "i") },
    });

    return res.status(200).json({ success: true, data: { ...role, users: count } });
  } catch (error) {
    console.error("[RoleController] getRoleById:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/roles
// Private (Admin)

exports.createRole = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: "Role name is required" });
    }

    // Duplicate check
    const existing = await Role.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A role named "${name.trim()}" already exists`,
      });
    }

    const role = await Role.create({
      name: name.trim(),
      description: description?.trim() || "Custom HRMS access role",
      protected: false,
    });

    return res.status(201).json({
      success: true,
      message: `Role "${role.name}" created successfully`,
      data: role,
    });
  } catch (error) {
    console.error("[RoleController] createRole:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


// PUT /api/roles/:id/permissions
// Private (Admin)

exports.updateRolePermissions = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }

    // Super Admin permissions are immutable
    if (role.protected && role.name === "Super Admin") {
      return res.status(403).json({
        success: false,
        message: "Super Admin master permissions cannot be modified",
      });
    }

    const { permissions } = req.body;

    if (!permissions || typeof permissions !== "object") {
      return res.status(400).json({ success: false, message: "permissions object is required" });
    }

    // Dynamic: Support both array [{ module, enabled, actions }] and object { [module]: { enabled, ...actions } }
    if (Array.isArray(permissions)) {
      role.permissions = permissions;
    } else {
      const updatedPermissions = Object.keys(permissions).map((modKey) => {
        const mod = permissions[modKey] || {};
        const actions = Object.keys(mod).filter((k) => k !== "enabled" && Boolean(mod[k]));
        return {
          module: modKey,
          enabled: Boolean(mod.enabled),
          actions,
        };
      });
      role.permissions = updatedPermissions;
    }

    role.markModified("permissions");
    await role.save();

    return res.status(200).json({
      success: true,
      message: `Permissions saved successfully for role "${role.name}"`,
      data: role,
    });
  } catch (error) {
    console.error("[RoleController] updateRolePermissions:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


// PUT /api/roles/:id
// Private (Admin)

exports.updateRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }

    if (role.protected) {
      return res.status(403).json({
        success: false,
        message: "System-protected roles cannot be renamed",
      });
    }

    const { name, description } = req.body;

    if (name?.trim()) {
      // Check duplicate name
      const dup = await Role.findOne({ name: name.trim(), _id: { $ne: role._id } });
      if (dup) {
        return res.status(409).json({
          success: false,
          message: `A role named "${name.trim()}" already exists`,
        });
      }
      role.name = name.trim();
    }

    if (description !== undefined) {
      role.description = description.trim();
    }

    await role.save();

    return res.status(200).json({
      success: true,
      message: "Role updated successfully",
      data: role,
    });
  } catch (error) {
    console.error("[RoleController] updateRole:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


// DELETE /api/roles/:id
// Private (Admin)

exports.deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }

    if (role.protected) {
      return res.status(403).json({
        success: false,
        message: `System-protected role "${role.name}" cannot be deleted`,
      });
    }

    await role.deleteOne();

    return res.status(200).json({
      success: true,
      message: `Role "${role.name}" deleted successfully`,
    });
  } catch (error) {
    console.error("[RoleController] deleteRole:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
