import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Download,
  Search,
  TrendingUp,
  Clock,
  AlertCircle,
  FileText,
  RefreshCw,
  Loader2,
  Calendar,
  Users,
  WalletCards,
  Palmtree,
  Printer,
  ChevronRight,
  Filter,
  CheckCircle2,
  Building2,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import API from "../../services/api";
import MonthYearPicker, { MONTHS } from "../../components/common/MonthYearPicker";
import { useDebounce } from "../../hooks/useDebounce";
import { usePermission } from "../../hooks/usePermission";
import { useToast } from "../../hooks/useToast";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

/* ─── Component ────────────────────────────────────────────────────────────── */
const Reports = () => {
  const { can } = usePermission("reports");
  const { showToast } = useToast();
  /* active tab: "attendance" | "leave" | "payroll" | "department" */
  const [activeTab, setActiveTab] = useState("attendance");

  /* search & filters */
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [dateRange, setDateRange] = useState("month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  /* payroll specific month/year */
  const currentYear = new Date().getFullYear();
  const currentMonthName = MONTHS[new Date().getMonth()];
  const [payrollMonth, setPayrollMonth] = useState(currentMonthName);
  const [payrollYear, setPayrollYear] = useState(String(currentYear));

  const [downloading, setDownloading] = useState(false);

  /* construct query string for API */
  const buildQueryParams = () => {
    let query = `range=${dateRange}`;
    if (dateRange === "custom" && customStartDate && customEndDate) {
      query += `&startDate=${customStartDate}&endDate=${customEndDate}`;
    }
    if (activeTab === "payroll") {
      query += `&month=${payrollMonth}&year=${payrollYear}`;
    }
    return query;
  };

  const queryStr = buildQueryParams();
  const isCustomValid = dateRange !== "custom" || (customStartDate && customEndDate);

  /* ── TanStack Query: Fetch all report datasets ── */
  const {
    data: reportResults,
    isLoading: loading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["hr-reports-data", activeTab, queryStr],
    queryFn: async () => {
      const [statsRes, attRes, leaveRes, payRes, deptRes] = await Promise.all([
        API.get(`/reports/stats?${queryStr}`).then((res) => res.data).catch(() => null),
        API.get(`/reports/attendance?${queryStr}`).then((res) => res.data).catch(() => null),
        API.get(`/reports/leave?${queryStr}`).then((res) => res.data).catch(() => null),
        API.get(`/reports/payroll?${queryStr}`).then((res) => res.data).catch(() => null),
        API.get(`/reports/department`).then((res) => res.data).catch(() => null),
      ]);
      return {
        stats: statsRes?.data || {},
        attendance: Array.isArray(attRes?.data) ? attRes.data : [],
        leave: Array.isArray(leaveRes?.data) ? leaveRes.data : [],
        payroll: Array.isArray(payRes?.data) ? payRes.data : [],
        department: Array.isArray(deptRes?.data) ? deptRes.data : [],
        rawMeta: {
          attendanceCoverage: attRes?.coverage || "Last 30 days",
          leaveCoverage: leaveRes?.coverage || "Last 30 days",
          payrollCoverage: payRes?.coverage || `Year ${currentYear}`,
        },
      };
    },
    enabled: Boolean(isCustomValid),
    staleTime: 60 * 1000,
  });

  const stats = reportResults?.stats || {};
  const attendanceData = reportResults?.attendance || [];
  const leaveData = reportResults?.leave || [];
  const payrollData = reportResults?.payroll || [];
  const departmentData = reportResults?.department || [];

  /* ── Filtered Datasets based on SearchTerm ── */
  const filteredAttendance = useMemo(() => {
    if (!debouncedSearch.trim()) return attendanceData;
    const term = debouncedSearch.toLowerCase();
    return attendanceData.filter(
      (r) =>
        (r.date && r.date.toLowerCase().includes(term)) ||
        (r.employeeName && r.employeeName.toLowerCase().includes(term))
    );
  }, [attendanceData, debouncedSearch]);

  const filteredLeave = useMemo(() => {
    if (!debouncedSearch.trim()) return leaveData;
    const term = debouncedSearch.toLowerCase();
    return leaveData.filter(
      (r) =>
        (r.leaveType && r.leaveType.toLowerCase().includes(term)) ||
        (r.payType && r.payType.toLowerCase().includes(term))
    );
  }, [leaveData, debouncedSearch]);

  const filteredPayroll = useMemo(() => {
    if (!debouncedSearch.trim()) return payrollData;
    const term = debouncedSearch.toLowerCase();
    return payrollData.filter(
      (r) =>
        (r.month && r.month.toLowerCase().includes(term)) ||
        (r.year && String(r.year).includes(term))
    );
  }, [payrollData, debouncedSearch]);

  const filteredDepartment = useMemo(() => {
    if (!debouncedSearch.trim()) return departmentData;
    const term = debouncedSearch.toLowerCase();
    return departmentData.filter(
      (r) => r.dept && r.dept.toLowerCase().includes(term)
    );
  }, [departmentData, debouncedSearch]);

  /* ── Totals Calculations for Summary Rows ── */
  const attendanceTotals = useMemo(() => {
    let present = 0, absent = 0, late = 0, halfDay = 0, totalHours = 0;
    filteredAttendance.forEach((r) => {
      present += Number(r.present) || 0;
      absent += Number(r.absent) || 0;
      late += Number(r.late) || 0;
      halfDay += Number(r.halfDay) || 0;
      totalHours += Number(r.totalHours) || 0;
    });
    const totalPunches = present + absent + halfDay;
    const avgRate = totalPunches > 0 ? ((present / totalPunches) * 100).toFixed(1) : "0.0";
    return { present, absent, late, halfDay, totalHours: totalHours.toFixed(1), avgRate };
  }, [filteredAttendance]);

  const leaveTotals = useMemo(() => {
    let allocated = 0, used = 0, remaining = 0, pending = 0;
    filteredLeave.forEach((r) => {
      allocated += Number(r.allocated) || 0;
      used += Number(r.used) || 0;
      remaining += Number(r.remaining) || 0;
      pending += Number(r.pending) || 0;
    });
    return { allocated, used, remaining, pending };
  }, [filteredLeave]);

  const payrollTotals = useMemo(() => {
    let totalGross = 0, totalDed = 0, totalNet = 0, totalEmp = 0, paid = 0, pending = 0;
    filteredPayroll.forEach((r) => {
      totalGross += Number(r.totalSalary) || 0;
      totalDed += Number(r.totalDeductions) || 0;
      totalNet += Number(r.totalNetPay) || 0;
      totalEmp += Number(r.employees) || 0;
      paid += Number(r.paidCount) || 0;
      pending += Number(r.pendingCount) || 0;
    });
    return { totalGross, totalDed, totalNet, totalEmp, paid, pending };
  }, [filteredPayroll]);

  const departmentTotals = useMemo(() => {
    let totalEmployees = 0, totalSalarySum = 0;
    filteredDepartment.forEach((r) => {
      totalEmployees += Number(r.count) || 0;
      totalSalarySum += (Number(r.avgSalary) || 0) * (Number(r.count) || 1);
    });
    const avgOverallSalary = totalEmployees > 0 ? Math.round(totalSalarySum / totalEmployees) : 0;
    return { totalEmployees, avgOverallSalary };
  }, [filteredDepartment]);

  /* ── Export CSV Handler ── */
  const handleExportCSV = async () => {
    try {
      setDownloading(true);
      const typeMap = {
        attendance: "attendance",
        leave: "leave",
        payroll: "payroll",
        department: "department",
      };
      const response = await API.get(`/reports/export/${apiType}?${queryStr}`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeTab.toUpperCase()}_REPORT_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[Reports] Export CSV error:", err);
      showToast("Failed to download CSV. Please try again.", "error");
    } finally {
      setDownloading(false);
    }
  };

  /* ── Print Handler ── */
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600">
            <Sparkles size={14} /> Analytics &amp; Compliance Hub
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Reports &amp; Intelligence
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Monitor attendance compliance, leave utilization, monthly salary registers &amp; workforce metrics
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => refetch()}
            disabled={loading || isRefetching}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300 disabled:opacity-60"
            title="Refresh Report Data"
          >
            <RefreshCw size={14} className={loading || isRefetching ? "animate-spin text-blue-600" : "text-slate-400"} />
            <span>Refresh</span>
          </button>

          {can("export") && (
            <>
              <button
                onClick={handlePrint}
                className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300 cursor-pointer"
                title="Print Executive Report View"
              >
                <Printer size={14} className="text-slate-500" />
                <span>Print View</span>
              </button>

              <button
                onClick={handleExportCSV}
                disabled={downloading}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] cursor-pointer disabled:opacity-50"
                title="Export CSV Report"
              >
                {downloading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Download size={14} />
                )}
                <span>Export CSV</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Top Executive KPI Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Attendance Rate */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-emerald-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Avg Attendance Rate
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {stats.attendanceRate || "0.0%"}
            </span>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center">
              Active Period
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
              style={{ width: `${Math.min(100, parseFloat(stats.attendanceRate) || 0)}%` }}
            />
          </div>
        </div>

        {/* Avg Working Hours */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Avg Work Hours
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {stats.avgWorkingHours || "0.0h"}
            </span>
            <span className="text-[11px] font-semibold text-slate-500">per shift / day</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium">
            Based on active employee punch logs
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-amber-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pending Leaves
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition group-hover:bg-amber-600 group-hover:text-white">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {stats.pendingApprovals || 0}
            </span>
            <span className="text-[11px] font-bold text-amber-600">Awaiting Action</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium">
            Requests needing HR / Admin approval
          </div>
        </div>

        {/* Total Monthly Payroll Summary */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-indigo-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Payroll Net Disbursed
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
              <WalletCards size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900 truncate">
              {formatCurrency(payrollTotals.totalNet || 0)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-indigo-600 font-semibold">
            {payrollTotals.paid} Paid · {payrollTotals.pending} Pending
          </div>
        </div>
      </div>

      {/* ── Main Category Tabs Bar ── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-sm">
        {/* Domain Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab("attendance")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${activeTab === "attendance"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
          >
            <BarChart3 size={15} />
            <span>Attendance &amp; Punctuality</span>
          </button>

          <button
            onClick={() => setActiveTab("leave")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${activeTab === "leave"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
          >
            <Palmtree size={15} />
            <span>Leave &amp; Absences</span>
          </button>

          <button
            onClick={() => setActiveTab("payroll")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${activeTab === "payroll"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
          >
            <WalletCards size={15} />
            <span>Payroll Register</span>
          </button>

          <button
            onClick={() => setActiveTab("department")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${activeTab === "department"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
          >
            <Building2 size={15} />
            <span>Department Headcount</span>
          </button>
        </div>

        {/* Contextual Filter Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Universal Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Search in ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3.5 py-2 text-xs font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Date Filter: For Attendance & Leave */}
          {activeTab !== "payroll" && activeTab !== "department" && (
            <select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                if (e.target.value !== "custom") {
                  setCustomStartDate("");
                  setCustomEndDate("");
                }
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none transition hover:border-slate-300 cursor-pointer"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 90 Days</option>
              <option value="year">Last 1 Year</option>
              <option value="custom">Custom Range</option>
            </select>
          )}

          {/* Month-Year Picker: For Payroll Tab */}
          {activeTab === "payroll" && (
            <MonthYearPicker
              selectedMonth={payrollMonth}
              selectedYear={payrollYear}
              onSelect={(m, y) => {
                setPayrollMonth(m);
                setPayrollYear(y);
              }}
            />
          )}
        </div>
      </div>

      {/* Custom Date Range Picker Bar (if custom selected) */}
      {dateRange === "custom" && activeTab !== "payroll" && activeTab !== "department" && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-blue-900">
            <Calendar size={15} /> Select Date Range:
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">From:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">To:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => refetch()}
            disabled={!customStartDate || !customEndDate}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      )}

      {/* ── Active Tab Data Grid ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {/* Tab 1: Attendance & Punctuality Report */}
        {activeTab === "attendance" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Log Date</th>
                  <th className="px-4 py-3.5 text-center">Present</th>
                  <th className="px-4 py-3.5 text-center">Absent</th>
                  <th className="px-4 py-3.5 text-center">Late In</th>
                  <th className="px-4 py-3.5 text-center">Half Day</th>
                  <th className="px-4 py-3.5 text-center">Total Shift Hours</th>
                  <th className="px-5 py-3.5 text-right">Attendance Rate (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Loader2 size={24} className="mx-auto animate-spin mb-2 text-blue-600" />
                      Loading Attendance Records...
                    </td>
                  </tr>
                ) : filteredAttendance.length > 0 ? (
                  filteredAttendance.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {row.date || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700">
                          {row.present || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 font-bold text-rose-700">
                          {row.absent || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 font-bold text-amber-700">
                          {row.late || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-0.5 font-bold text-orange-700">
                          {row.halfDay || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-800">
                        {row.totalHours ? `${row.totalHours} hrs` : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 font-bold text-xs ${parseFloat(row.percentage) >= 90
                            ? "bg-emerald-100 text-emerald-800"
                            : parseFloat(row.percentage) >= 75
                              ? "bg-blue-100 text-blue-800"
                              : "bg-rose-100 text-rose-800"
                            }`}
                        >
                          {row.percentage || 0}%
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Search size={32} className="mx-auto mb-2 text-slate-300" />
                      No attendance punch records found for this period.
                    </td>
                  </tr>
                )}
              </tbody>

              {/* Attendance Summary Totals Row */}
              {filteredAttendance.length > 0 && (
                <tfoot className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200">
                  <tr>
                    <td className="px-5 py-3.5 uppercase tracking-wider text-slate-600">
                      Total / Overall Average
                    </td>
                    <td className="px-4 py-3.5 text-center text-emerald-700">
                      {attendanceTotals.present}
                    </td>
                    <td className="px-4 py-3.5 text-center text-rose-700">
                      {attendanceTotals.absent}
                    </td>
                    <td className="px-4 py-3.5 text-center text-amber-700">
                      {attendanceTotals.late}
                    </td>
                    <td className="px-4 py-3.5 text-center text-orange-700">
                      {attendanceTotals.halfDay}
                    </td>
                    <td className="px-4 py-3.5 text-center text-blue-700">
                      {attendanceTotals.totalHours} hrs
                    </td>
                    <td className="px-5 py-3.5 text-right text-emerald-700 text-sm">
                      {attendanceTotals.avgRate}%
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* Tab 2: Leave & Absence Summary */}
        {activeTab === "leave" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Leave Category</th>
                  <th className="px-4 py-3.5 text-center">Pay Type</th>
                  <th className="px-4 py-3.5 text-center">Allocated Days</th>
                  <th className="px-4 py-3.5 text-center">Utilized Days</th>
                  <th className="px-4 py-3.5 text-center">Available Balance</th>
                  <th className="px-4 py-3.5 text-center">Pending Approvals</th>
                  <th className="px-5 py-3.5 text-right">Utilization Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Loader2 size={24} className="mx-auto animate-spin mb-2 text-emerald-600" />
                      Loading Leave Data...
                    </td>
                  </tr>
                ) : filteredLeave.length > 0 ? (
                  filteredLeave.map((row, idx) => {
                    const alloc = Number(row.allocated) || 0;
                    const used = Number(row.used) || 0;
                    const utilPct = alloc > 0 ? ((used / alloc) * 100).toFixed(0) : "—";
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          {row.leaveType || "General Leave"}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${row.payType === "Unpaid"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-emerald-50 text-emerald-700"
                              }`}
                          >
                            {row.payType || "Paid"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-slate-800">
                          {row.allocated || 0}
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-rose-600">
                          {row.used || 0}
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-emerald-600">
                          {row.remaining || 0}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {Number(row.pending) > 0 ? (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 font-bold text-amber-800">
                              {row.pending} pending
                            </span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-slate-800">
                          {utilPct !== "—" ? `${utilPct}%` : "—"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Search size={32} className="mx-auto mb-2 text-slate-300" />
                      No leave summary records found.
                    </td>
                  </tr>
                )}
              </tbody>

              {/* Leave Summary Totals Row */}
              {filteredLeave.length > 0 && (
                <tfoot className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200">
                  <tr>
                    <td className="px-5 py-3.5 uppercase tracking-wider text-slate-600">
                      Total Across Leaves
                    </td>
                    <td className="px-4 py-3.5 text-center">—</td>
                    <td className="px-4 py-3.5 text-center text-slate-800">
                      {leaveTotals.allocated}
                    </td>
                    <td className="px-4 py-3.5 text-center text-rose-700">
                      {leaveTotals.used}
                    </td>
                    <td className="px-4 py-3.5 text-center text-emerald-700">
                      {leaveTotals.remaining}
                    </td>
                    <td className="px-4 py-3.5 text-center text-amber-700">
                      {leaveTotals.pending}
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-800">—</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* Tab 3: Monthly Payroll Register */}
        {activeTab === "payroll" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Payroll Period</th>
                  <th className="px-4 py-3.5 text-center">Headcount</th>
                  <th className="px-4 py-3.5 text-right">Total Gross CTC</th>
                  <th className="px-4 py-3.5 text-right">Deductions (PF/PT/LOP)</th>
                  <th className="px-4 py-3.5 text-right">Total Net Payable</th>
                  <th className="px-5 py-3.5 text-center">Status Breakdown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Loader2 size={24} className="mx-auto animate-spin mb-2 text-indigo-600" />
                      Loading Payroll Register...
                    </td>
                  </tr>
                ) : filteredPayroll.length > 0 ? (
                  filteredPayroll.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {row.month} {row.year}
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                        {row.employees || 0} employees
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-slate-900">
                        {formatCurrency(row.totalSalary || 0)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-rose-600">
                        -{formatCurrency(row.totalDeductions || 0)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-emerald-700 text-sm">
                        {formatCurrency(row.totalNetPay || 0)}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                            <CheckCircle2 size={12} /> {row.paidCount || 0} Paid
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                            <Clock size={12} /> {row.pendingCount || 0} Pending
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Search size={32} className="mx-auto mb-2 text-slate-300" />
                      No payroll records generated for {payrollMonth} {payrollYear}.
                    </td>
                  </tr>
                )}
              </tbody>

              {/* Payroll Totals Row */}
              {filteredPayroll.length > 0 && (
                <tfoot className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200">
                  <tr>
                    <td className="px-5 py-3.5 uppercase tracking-wider text-slate-600">
                      Total Disbursed
                    </td>
                    <td className="px-4 py-3.5 text-center text-slate-800">
                      {payrollTotals.totalEmp}
                    </td>
                    <td className="px-4 py-3.5 text-right text-slate-900">
                      {formatCurrency(payrollTotals.totalGross)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-rose-700">
                      -{formatCurrency(payrollTotals.totalDed)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-emerald-700 text-sm font-black">
                      {formatCurrency(payrollTotals.totalNet)}
                    </td>
                    <td className="px-5 py-3.5 text-center text-xs text-slate-600">
                      {payrollTotals.paid} Paid · {payrollTotals.pending} Pending
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* Tab 4: Department Headcount & Workforce */}
        {activeTab === "department" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Department Name</th>
                  <th className="px-4 py-3.5 text-center">Headcount</th>
                  <th className="px-4 py-3.5 text-center">Workforce Share</th>
                  <th className="px-4 py-3.5 text-right">Avg Monthly Salary</th>
                  <th className="px-5 py-3.5 text-right">Estimated Monthly Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <Loader2 size={24} className="mx-auto animate-spin mb-2 text-purple-600" />
                      Loading Department Metrics...
                    </td>
                  </tr>
                ) : filteredDepartment.length > 0 ? (
                  filteredDepartment.map((row, idx) => {
                    const count = Number(row.count) || 0;
                    const avgSal = Number(row.avgSalary) || 0;
                    const totalDeptCost = count * avgSal;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                          <Building2 size={15} className="text-purple-600" />
                          {row.dept || "General"}
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-slate-800">
                          {row.count} employees
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="rounded-full bg-purple-50 px-2.5 py-0.5 font-bold text-purple-700">
                            {row.percentage || "0%"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-semibold text-slate-800">
                          {formatCurrency(avgSal)}
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-indigo-700">
                          {formatCurrency(totalDeptCost)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <Search size={32} className="mx-auto mb-2 text-slate-300" />
                      No department headcount records found.
                    </td>
                  </tr>
                )}
              </tbody>

              {/* Department Totals Row */}
              {filteredDepartment.length > 0 && (
                <tfoot className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200">
                  <tr>
                    <td className="px-5 py-3.5 uppercase tracking-wider text-slate-600">
                      Total Active Workforce
                    </td>
                    <td className="px-4 py-3.5 text-center text-slate-900">
                      {departmentTotals.totalEmployees}
                    </td>
                    <td className="px-4 py-3.5 text-center text-purple-700">100%</td>
                    <td className="px-4 py-3.5 text-right text-slate-800">
                      Avg: {formatCurrency(departmentTotals.avgOverallSalary)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-indigo-700 font-black">
                      {formatCurrency(
                        departmentTotals.avgOverallSalary * departmentTotals.totalEmployees
                      )}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
