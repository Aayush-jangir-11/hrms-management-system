const Leave = require("../../models/Leave");
const WorkingPolicy = require("../../models/WorkingPolicy");
const { getDateRange } = require("./reportUtils");

// Get Leave Usage & Balance Report
// GET /api/reports/leave
// Private (Admin / HR)
const getLeaveReport = async (req, res) => {
  console.log("[reportController] -> getLeaveReport called with query:", req.query);
  try {
    const { range, startDate: qStart, endDate: qEnd, department } = req.query;
    const { startDate, endDate } = getDateRange(range, qStart, qEnd);

    const pipeline = [
      {
        $match: {
          fromDate: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "employee",
          foreignField: "_id",
          as: "employeeData",
        },
      },
      { $unwind: "$employeeData" },
    ];

    if (department && department !== "All Departments" && department !== "All") {
      pipeline.push({
        $match: { "employeeData.department": department },
      });
    }

    // Access payType and dayType inside dateBreakdown defined in Leave schema
    pipeline.push(
      {
        $unwind: {
          path: "$dateBreakdown",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          itemPayType: {
            $ifNull: [
              "$dateBreakdown.payType",
              {
                $cond: [
                  { $eq: ["$leaveType", "Unpaid Leave"] },
                  "Unpaid",
                  { $ifNull: ["$payType", "Paid"] },
                ],
              },
            ],
          },
          itemDayValue: {
            $cond: [
              { $eq: ["$dateBreakdown.dayType", "Half Day"] },
              0.5,
              1.0,
            ],
          },
        },
      },
      {
        $group: {
          _id: "$itemPayType",
          uniqueApps: { $addToSet: "$_id" },
          usedDays: {
            $sum: {
              $cond: [{ $eq: ["$status", "Approved"] }, "$itemDayValue", 0],
            },
          },
          pendingDays: {
            $sum: {
              $cond: [{ $eq: ["$status", "Pending"] }, "$itemDayValue", 0],
            },
          },
          rejectedDays: {
            $sum: {
              $cond: [{ $eq: ["$status", "Rejected"] }, "$itemDayValue", 0],
            },
          },
        },
      },
      {
        $project: {
          payType: "$_id",
          _id: 0,
          used: "$usedDays",
          pending: "$pendingDays",
          rejected: "$rejectedDays",
          totalApplications: { $size: "$uniqueApps" },
        },
      }
    );

    const leaveStats = await Leave.aggregate(pipeline);

    // Fetch active WorkingPolicy (2 paid leaves per month = 24 days per year)
    const policy = await WorkingPolicy.findOne({ status: "Active" });
    const leavesPerMonth = parseInt(policy?.paidLeavesPerMonth) || 2;
    const totalAnnualAllocated = leavesPerMonth * 12; // 24 Days

    const defaultCategories = ["Paid", "Unpaid"];

    const finalData = defaultCategories.map((type) => {
      const stat = leaveStats.find((s) => s.payType === type) || {
        used: 0,
        pending: 0,
        rejected: 0,
        totalApplications: 0,
      };

      const isPaid = type === "Paid";
      const allocated = isPaid ? totalAnnualAllocated : 0;
      const used = stat.used;
      const remaining = isPaid ? Math.max(0, allocated - used) : 0;

      return {
        payType: isPaid ? "Paid Leave" : "Unpaid Leave (LWP)",
        allocated,
        used,
        remaining,
        pending: stat.pending,
        rejected: stat.rejected,
        totalApplications: stat.totalApplications,
      };
    });

    return res.status(200).json({
      success: true,
      name: "Leave Summary Report",
      type: "Leave",
      coverage: `${startDate.toISOString().split("T")[0]} to ${endDate.toISOString().split("T")[0]}`,
      lastGenerated: new Date().toISOString().split("T")[0],
      data: finalData,
    });
  } catch (error) {
    console.error("Error generating leave report:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate leave report",
      error: error.message,
    });
  }
};

module.exports = {
  getLeaveReport,
};
