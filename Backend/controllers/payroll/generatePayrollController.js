const Payroll = require("../../models/Payroll");
const Employee = require("../../models/Employee");
const Attendance = require("../../models/Attendance");
const Leave = require("../../models/Leave");
const WorkingPolicy = require("../../models/WorkingPolicy");
const { MONTHS_LIST, MONTH_INDEX_MAP, getDaysInMonth } = require("./payrollUtils");

// Calculate payroll for an entire month (or single employee)
// POST /api/payroll/generate
// Private (Admin, HR)
const generatePayroll = async (req, res) => {
  try {
    const { month, year, employeeId, bonus = 0, remarks = "" } = req.body;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: "Month and Year are required" });
    }

    if (!MONTHS_LIST.includes(month)) {
      return res.status(400).json({ success: false, message: "Invalid month name provided" });
    }

    const monthIndex = MONTH_INDEX_MAP[month];
    const totalWorkingDays = getDaysInMonth(year, month);

    const startDate = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999));

    // Target employees query
    const employeeFilter = { status: "Active" };
    if (employeeId) {
      employeeFilter._id = employeeId;
    }

    const employees = await Employee.find(employeeFilter);

    if (!employees || employees.length === 0) {
      return res.status(404).json({ success: false, message: "No active employees found to generate payroll" });
    }

    // Fetch active Working Policy for dynamic shift hours
    const activePolicy = await WorkingPolicy.findOne({ status: "Active" }).sort({ createdAt: -1 });

    const parseNum = (str) => {
      if (!str) return null;
      const n = parseFloat(str.replace(/[^\d.]/g, ""));
      return isNaN(n) ? null : n;
    };

    let workHoursPerDay = 8;
    if (activePolicy) {
      const totalHrs = parseNum(activePolicy.workingHours);
      const breakMins = parseNum(activePolicy.breakDuration);
      if (totalHrs !== null) {
        const breakHrs = breakMins !== null ? breakMins / 60 : 0;
        workHoursPerDay = Math.max(1, totalHrs - breakHrs);
      }
    }

    const generatedPayrolls = [];

    for (const emp of employees) {
      // 1. Fetch attendance records for month
      const attendanceRecords = await Attendance.find({
        employee: emp._id,
        date: { $gte: startDate, $lte: endDate },
      });

      let presentDays = 0;
      let halfDays = 0;
      let absentDays = 0;
      let lateDays = 0;
      let overtimeHours = 0;

      attendanceRecords.forEach((att) => {
        if (att.status === "Present") presentDays++;
        else if (att.status === "Half Day") halfDays++;
        else if (att.status === "Absent") absentDays++;
        else if (att.status === "Late") {
          presentDays++;
          lateDays++;
        }

        if (att.totalHours > workHoursPerDay) {
          overtimeHours += att.totalHours - workHoursPerDay;
        }
      });

      // 2. Fetch approved leaves for month
      const approvedLeaves = await Leave.find({
        employee: emp._id,
        status: "Approved",
        fromDate: { $lte: endDate },
        toDate: { $gte: startDate },
      });

      let paidLeaveDays = 0;
      let unpaidLeaveDays = 0;

      approvedLeaves.forEach((lv) => {
        if (lv.dateBreakdown && lv.dateBreakdown.length > 0) {
          lv.dateBreakdown.forEach((db) => {
            const dbDate = new Date(db.date);
            if (dbDate >= startDate && dbDate <= endDate) {
              const weight = db.dayType === "Half Day" ? 0.5 : 1;
              if (db.payType === "Unpaid") unpaidLeaveDays += weight;
              else paidLeaveDays += weight;
            }
          });
        } else {
          paidLeaveDays += lv.days || 0;
        }
      });

      // If no attendance entries recorded at all, default to full present
      if (attendanceRecords.length === 0 && approvedLeaves.length === 0) {
        presentDays = totalWorkingDays;
      }

      const totalPaidDays = Math.min(
        totalWorkingDays,
        presentDays + paidLeaveDays + halfDays * 0.5
      );
      const totalUnpaidDays = Math.max(0, totalWorkingDays - totalPaidDays);

      // 3. Calculation logic
      const monthlyGross = Number(emp.salary) || 0;
      const basicSalary = Math.round(monthlyGross * 0.5);
      const hra = Math.round(monthlyGross * 0.2);
      const specialAllowance = Math.max(0, monthlyGross - (basicSalary + hra));

      // Overtime Pay calculation
      const hourlyRate = (basicSalary / (totalWorkingDays * workHoursPerDay)) || 0;
      const overtimePay = Math.round(hourlyRate * 1.5 * overtimeHours);

      // Loss of Pay (LWP) deduction
      const perDayRate = (monthlyGross / totalWorkingDays) || 0;
      const lwpDeduction = Math.round(perDayRate * totalUnpaidDays);

      // PF calculation (12% of basic up to 1800 cap)
      const providentFund = Math.min(Math.round(basicSalary * 0.12), 1800);
      const professionalTax = monthlyGross >= 15000 ? 200 : 0;

      const totalEarnings = basicSalary + hra + specialAllowance + overtimePay + Number(bonus);
      const totalDeductions = providentFund + professionalTax + lwpDeduction;
      const netSalary = Math.max(0, totalEarnings - totalDeductions);

      // 4. Construct payload
      const payrollData = {
        employee: emp._id,
        month,
        year: Number(year),
        salaryStructure: {
          annualCtc: monthlyGross * 12,
          monthlyGross,
          basicPercent: 50,
          hraPercent: 20,
          pfRate: 12,
          pfCap: 1800,
          professionalTaxAmount: 200,
          overtimeMultiplier: 1.5,
        },
        attendanceSummary: {
          totalWorkingDays,
          presentDays,
          halfDays,
          absentDays,
          leaveDays: paidLeaveDays + unpaidLeaveDays,
          paidLeaveDays,
          unpaidLeaveDays,
          paidDays: totalPaidDays,
          lateDays,
          overtimeHours,
        },
        earnings: {
          basicSalary,
          hra,
          specialAllowance,
          overtimePay,
          bonus: Number(bonus),
          totalEarnings,
        },
        deductions: {
          providentFund,
          professionalTax,
          lwp: lwpDeduction,
          tds: 0,
          advanceRecovery: 0,
          otherDeductions: 0,
          totalDeductions,
        },
        netSalary,
        generatedBy: req.user ? req.user._id : null,
        remarks: remarks || `Generated payroll for ${month} ${year}`,
      };

      // 5. Upsert payroll record
      const payrollRecord = await Payroll.findOneAndUpdate(
        { employee: emp._id, month, year: Number(year) },
        payrollData,
        { new: true, upsert: true, runValidators: true }
      );

      generatedPayrolls.push(payrollRecord);
    }

    return res.status(200).json({
      success: true,
      message: `Successfully generated payroll for ${generatedPayrolls.length} employee(s) for ${month} ${year}`,
      data: generatedPayrolls,
    });
  } catch (error) {
    console.error("Error generating payroll:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate payroll",
      error: error.message,
    });
  }
};

// Get summary statistics for monthly payroll dashboard
// GET /api/payroll/summary
// Private (Admin, HR)
const getPayrollSummary = async (req, res) => {
  try {
    const { month, year } = req.query;

    const filter = {};
    if (month) filter.month = month;
    if (year) filter.year = Number(year);

    const payrolls = await Payroll.find(filter);

    const summary = {
      totalEmployees: payrolls.length,
      totalPayout: 0,
      totalEarnings: 0,
      totalDeductions: 0,
      totalPF: 0,
      totalPT: 0,
      statusBreakdown: {
        Pending: 0,
        Processing: 0,
        Paid: 0,
        "On Hold": 0,
      },
    };

    payrolls.forEach((p) => {
      summary.totalPayout += p.netSalary || 0;
      summary.totalEarnings += p.earnings?.totalEarnings || 0;
      summary.totalDeductions += p.deductions?.totalDeductions || 0;
      summary.totalPF += p.deductions?.providentFund || 0;
      summary.totalPT += p.deductions?.professionalTax || 0;

      if (p.status && summary.statusBreakdown[p.status] !== undefined) {
        summary.statusBreakdown[p.status]++;
      }
    });

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Error fetching payroll summary:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payroll summary",
      error: error.message,
    });
  }
};

module.exports = {
  generatePayroll,
  getPayrollSummary,
};
