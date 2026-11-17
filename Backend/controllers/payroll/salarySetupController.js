const Employee = require("../../models/Employee");

// Get all active employees with their base salary & CTC details
// GET /api/payroll/employee-salaries
const getEmployeeSalaries = async (req, res) => {
  try {
    const employees = await Employee.find({})
      .select("employeeId name email department position status salary joinDate")
      .sort({ name: 1 });

    const formatted = employees.map((emp) => {
      const empObj = emp.toObject();
      empObj.ctc = (emp.salary || 0) * 12;
      return empObj;
    });

    return res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("Error fetching employee salaries:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch employee salaries",
      error: error.message,
    });
  }
};

// Update an employee's Annual CTC / Base Salary
// PUT /api/payroll/employee-salaries/:id
const updateEmployeeSalary = async (req, res) => {
  try {
    const { id } = req.params;
    const { ctc, salary } = req.body;

    let monthlySalary = 0;
    if (ctc !== undefined && ctc !== null && !isNaN(Number(ctc))) {
      monthlySalary = Number(ctc) / 12;
    } else if (salary !== undefined && salary !== null && !isNaN(Number(salary))) {
      monthlySalary = Number(salary);
    } else {
      return res.status(400).json({
        success: false,
        message: "Valid Annual CTC or Monthly Salary is required",
      });
    }

    if (monthlySalary < 0) {
      return res.status(400).json({
        success: false,
        message: "Salary amount cannot be negative",
      });
    }

    const employee = await Employee.findByIdAndUpdate(
      id,
      { salary: Math.round(monthlySalary) },
      { new: true, runValidators: true }
    ).select("employeeId name email department position status salary");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const empObj = employee.toObject();
    empObj.ctc = (employee.salary || 0) * 12;

    return res.status(200).json({
      success: true,
      message: `Annual CTC updated successfully for ${employee.name}`,
      data: empObj,
    });
  } catch (error) {
    console.error("Error updating employee salary:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update employee salary",
      error: error.message,
    });
  }
};

module.exports = {
  getEmployeeSalaries,
  updateEmployeeSalary,
};
