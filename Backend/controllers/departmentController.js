const Department = require("../models/Department");

// Create Department
// POST /api/admin/departments
const createDepartment = async (req, res) => {
  try {
    const { office, name, code, head, headRole, status, growth, teams } = req.body;

    if (!name || !code || !head) {
      return res.status(400).json({ success: false, message: "Please provide Name, Code, and Head." });
    }

    const normalizedCode = code.trim().toUpperCase();

    // Check if code exists
    const codeExists = await Department.findOne({ code: normalizedCode });
    if (codeExists) {
      return res.status(400).json({ success: false, message: `Department code '${normalizedCode}' already exists.` });
    }

    // Pull newly assigned employee IDs from all other existing departments
    const assignedEmpIds = (teams || [])
      .flatMap((team) => team.assignedEmployeeIds || [])
      .filter(Boolean);

    if (assignedEmpIds.length > 0) {
      await Department.updateMany(
        {},
        {
          $pull: {
            "teams.$[].assignedEmployeeIds": {
              $in: assignedEmpIds,
            },
          },
        }
      );
    }

    const newDept = await Department.create({
      office: office || "Headquarters - Mumbai",
      name: name.trim(),
      code: normalizedCode,
      head: head.trim(),
      headRole: headRole || "Department Head",
      status: status || "Active",
      growth: growth || "+0%",
      teams: teams || [],
    });

    return res.status(201).json({ success: true, message: "Department created successfully", data: newDept });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get All Departments
// GET /api/admin/departments
const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: departments.length, data: departments });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Department
// PUT /api/admin/departments/:id
const updateDepartment = async (req, res) => {
  try {
    const { office, name, code, head, headRole, status, growth, teams } = req.body;
    const dept = await Department.findById(req.params.id);
    if (!dept) {
      return res.status(404).json({ success: false, message: "Department not found." });
    }

    if (code) {
      const normalizedCode = code.trim().toUpperCase();
      const codeExists = await Department.findOne({ code: normalizedCode, _id: { $ne: req.params.id } });
      if (codeExists) {
        return res.status(400).json({ success: false, message: `Department code '${normalizedCode}' is in use by another department.` });
      }
      dept.code = normalizedCode;
    }

    // Pull newly assigned employee IDs from all other departments
    if (teams !== undefined) {

      const assignedEmpIds = (teams || [])
        .flatMap((team) => team.assignedEmployeeIds || [])
        .filter(Boolean);

      if (assignedEmpIds.length > 0) {
        await Department.updateMany(
          { _id: { $ne: req.params.id } },
          {
            $pull: {
              "teams.$[].assignedEmployeeIds": {
                $in: assignedEmpIds,
              },
            },
          }
        );
      }

      dept.teams = teams;
    }
    if (office !== undefined) dept.office = office;
    if (name !== undefined) dept.name = name;
    if (head !== undefined) dept.head = head;
    if (headRole !== undefined) dept.headRole = headRole;
    if (status !== undefined) dept.status = status;
    if (growth !== undefined) dept.growth = growth;

    await dept.save();
    return res.status(200).json({ success: true, message: "Department updated successfully", data: dept });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Department
// DELETE /api/admin/departments/:id
const deleteDepartment = async (req, res) => {
  try {
    const dept = await Department.findByIdAndDelete(req.params.id);
    if (!dept) {
      return res.status(404).json({ success: false, message: "Department not found." });
    }
    return res.status(200).json({ success: true, message: "Department deleted successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createDepartment,
  getAllDepartments,
  updateDepartment,
  deleteDepartment,
};
