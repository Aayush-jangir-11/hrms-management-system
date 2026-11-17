const Employee = require("../../models/Employee");

// Get Department Headcount & Distribution Report
// GET /api/reports/department
// Private (Admin / HR)
const getDepartmentReport = async (req, res) => {
  console.log("[reportController] -> getDepartmentReport called");
  try {
    const departmentStats = await Employee.aggregate([
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 },
          avgSalary: { $avg: "$salary" },
          roles: { $addToSet: "$position" },
        },
      },
      {
        $project: {
          dept: "$_id",
          _id: 0,
          count: 1,
          avgSalary: { $round: ["$avgSalary", 0] },
          rolesCount: { $size: "$roles" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const totalCount = departmentStats.reduce((sum, d) => sum + d.count, 0);

    const formattedData = departmentStats.map((item) => ({
      dept: item.dept || "General",
      count: item.count,
      percentage: totalCount > 0 ? ((item.count / totalCount) * 100).toFixed(1) + "%" : "0%",
      avgSalary: item.avgSalary || 0,
      rolesCount: item.rolesCount || 1,
    }));

    return res.status(200).json({
      success: true,
      name: "Department Overview",
      type: "Overview",
      coverage: "All Departments",
      lastGenerated: new Date().toISOString().split("T")[0],
      data: formattedData,
    });
  } catch (error) {
    console.error("Error generating department report:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate department report",
      error: error.message,
    });
  }
};

module.exports = {
  getDepartmentReport,
};
