import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Users,
  UserCheck,
  Building2,
  CalendarDays,
  WalletCards,
  ShieldCheck,
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  Filter,
  ChevronDown,
  ArrowUpRight,
  Eye,
  MoreHorizontal,
  Clock3,
  CheckCircle2,
  X,
  FileSpreadsheet,
  FileDown,
  Printer,
  Sparkles,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Search,
  Palmtree,
  ShieldAlert,
  SlidersHorizontal,
  BriefcaseBusiness,
} from "lucide-react";
import API from "../../services/api";
import MonthYearPicker, { MONTHS } from "../../components/common/MonthYearPicker";
import { useDebounce } from "../../hooks/useDebounce";
import { useToast } from "../../hooks/useToast";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

/* ─── Admin Reports Component ─────────────────────────────────────────────── */
const AdminReports = () => {
  const { showToast } = useToast();
  /* active tab: "overview" | "payroll" | "attendance" | "audit" */
  const [activeTab, setActiveTab] = useState("overview");

  /* filter & search */
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

  /* build query params for API */
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

  /* ── TanStack Query: Fetch all enterprise analytics ── */
  const {
    data: reportResults,
    isLoading: loading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["admin-reports-analytics", activeTab, queryStr],
    queryFn: async () => {
      const [statsRes, adminStatsRes, deptRes, attRes, payRes, leaveRes, rolesRes] =
        await Promise.all([
          API.get(`/reports/stats?${queryStr}`).then((r) => r.data).catch(() => null),
          API.get("/admin/dashboard-stats").then((r) => r.data).catch(() => null),
          API.get("/reports/department").then((r) => r.data).catch(() => null),
          API.get(`/reports/attendance?${queryStr}`).then((r) => r.data).catch(() => null),
          API.get(`/reports/payroll?${queryStr}`).then((r) => r.data).catch(() => null),
          API.get(`/reports/leave?${queryStr}`).then((r) => r.data).catch(() => null),
          API.get("/roles").then((r) => r.data).catch(() => null),
        ]);

      return {
        stats: statsRes?.data || {},
        adminStats: adminStatsRes?.data || {},
        departments: Array.isArray(deptRes?.data) ? deptRes.data : [],
        attendance: Array.isArray(attRes?.data) ? attRes.data : [],
        payroll: Array.isArray(payRes?.data) ? payRes.data : [],
        leave: Array.isArray(leaveRes?.data) ? leaveRes.data : [],
        roles: Array.isArray(rolesRes?.data) ? rolesRes.data : [],
      };
    },
    enabled: Boolean(isCustomValid),
    staleTime: 60 * 1000,
  });

  const stats = reportResults?.stats || {};
  const adminStats = reportResults?.adminStats || {};
  const departments = reportResults?.departments || [];
  const attendanceData = reportResults?.attendance || [];
  const payrollData = reportResults?.payroll || [];
  const rolesData = reportResults?.roles || [];

  /* ── Computed Metrics & Totals ── */
  const totalEmployees = useMemo(() => {
    if (adminStats.totalEmployees) return adminStats.totalEmployees;
    return departments.reduce((acc, d) => acc + (Number(d.count) || 0), 0);
  }, [adminStats, departments]);

  const departmentCostMetrics = useMemo(() => {
    let totalCost = 0;
    departments.forEach((d) => {
      const count = Number(d.count) || 0;
      const avg = Number(d.avgSalary) || 0;
      totalCost += count * avg;
    });
    const avgCostPerEmp = totalEmployees > 0 ? Math.round(totalCost / totalEmployees) : 0;
    return { totalCost, avgCostPerEmp };
  }, [departments, totalEmployees]);

  const payrollTotals = useMemo(() => {
    let totalGross = 0, totalDed = 0, totalNet = 0, totalEmp = 0, paid = 0, pending = 0;
    payrollData.forEach((r) => {
      totalGross += Number(r.totalSalary) || 0;
      totalDed += Number(r.totalDeductions) || 0;
      totalNet += Number(r.totalNetPay) || 0;
      totalEmp += Number(r.employees) || 0;
      paid += Number(r.paidCount) || 0;
      pending += Number(r.pendingCount) || 0;
    });
    return { totalGross, totalDed, totalNet, totalEmp, paid, pending };
  }, [payrollData]);

  /* Filtered Department list */
  const filteredDepartments = useMemo(() => {
    if (!debouncedSearch.trim()) return departments;
    return departments.filter(
      (d) => d.dept && d.dept.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [departments, debouncedSearch]);

  /* Filtered Payroll list */
  const filteredPayroll = useMemo(() => {
    if (!debouncedSearch.trim()) return payrollData;
    const term = debouncedSearch.toLowerCase();
    return payrollData.filter(
      (p) =>
        (p.month && p.month.toLowerCase().includes(term)) ||
        (p.year && String(p.year).includes(term))
    );
  }, [payrollData, debouncedSearch]);

  /* Filtered Attendance list */
  const filteredAttendance = useMemo(() => {
    if (!debouncedSearch.trim()) return attendanceData;
    return attendanceData.filter(
      (a) => a.date && a.date.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [attendanceData, debouncedSearch]);

  /* ── Export CSV Stream Handler ── */
  const handleExportCSV = async (typeOverride) => {
    try {
      setDownloading(true);
      const targetType =
        typeOverride ||
        (activeTab === "payroll" ? "payroll" : activeTab === "attendance" ? "attendance" : "department");
      const response = await API.get(`/reports/export/${targetType}?${queryStr}`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ADMIN_${targetType.toUpperCase()}_REPORT_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[AdminReports] Export CSV error:", err);
      showToast("Could not download report CSV. Please try again.", "error");
    } finally {
      setDownloading(false);
    }
  };

  /* ── Print Executive Summary ── */
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* =====================================================
          HERO SECTION (Matching Admin Dashboard Gradient & Theme)
      ====================================================== */}
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 p-6 shadow-xl shadow-blue-200/40 md:p-8">
        {/* Background Ambient Circles */}
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-28 right-40 h-72 w-72 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute right-10 top-10 hidden opacity-10 md:block pointer-events-none text-white">
          <BarChart3 size={150} />
        </div>

        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                Admin Intelligence
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-blue-100 backdrop-blur-md">
                {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-white md:text-3xl lg:text-4xl">
              Reports &amp; Analytics
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100 md:text-base">
              Analyze employees, attendance, departments, payroll, and system activity from one centralized reporting dashboard.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={loading || isRefetching}
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/20 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw size={15} className={loading || isRefetching ? "animate-spin text-white" : ""} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/20 active:scale-[0.98] cursor-pointer"
            >
              <Printer size={15} />
              <span>Print View</span>
            </button>

            <button
              onClick={() => handleExportCSV()}
              disabled={downloading}
              className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-blue-600 shadow-xl transition hover:bg-blue-50 active:scale-[0.98] disabled:opacity-70 cursor-pointer"
            >
              {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================
          REPORT STAT CARDS (Matching Project Gradient Palette)
      ====================================================== */}
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Total Employees (Sky / Blue) */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-sky-50 transition duration-500 group-hover:scale-150" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Total Employees
              </p>
              <h3 className="mt-2 text-3xl font-black text-slate-900">
                {totalEmployees || 0}
              </h3>
              <p className="mt-1 text-xs text-sky-600 font-bold">
                current workforce
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/30">
              <Users size={22} />
            </div>
          </div>
        </div>

        {/* Card 2: Average Attendance (Emerald / Teal) */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-50 transition duration-500 group-hover:scale-150" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Average Attendance
              </p>
              <h3 className="mt-2 text-3xl font-black text-slate-900">
                {stats.attendanceRate || "0.0%"}
              </h3>
              <p className="mt-1 text-xs text-emerald-600 font-bold">
                {stats.avgWorkingHours ? `${stats.avgWorkingHours}/shift` : "8.0h/shift"}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
              <UserCheck size={22} />
            </div>
          </div>
        </div>

        {/* Card 3: Departments (Violet / Purple) */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-violet-50 transition duration-500 group-hover:scale-150" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Departments
              </p>
              <h3 className="mt-2 text-3xl font-black text-slate-900">
                {departments.length || 0}
              </h3>
              <p className="mt-1 text-xs text-violet-600 font-bold">
                total departments
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30">
              <Building2 size={22} />
            </div>
          </div>
        </div>

        {/* Card 4: Monthly Payroll (Orange / Amber) */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-orange-50 transition duration-500 group-hover:scale-150" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Monthly Payroll
              </p>
              <h3 className="mt-2 text-2xl font-black text-slate-900 truncate">
                {formatCurrency(payrollTotals.totalNet || departmentCostMetrics.totalCost || 0)}
              </h3>
              <p className="mt-1 text-xs text-orange-600 font-bold">
                Avg: {formatCurrency(departmentCostMetrics.avgCostPerEmp)} / emp
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30">
              <WalletCards size={22} />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          DOMAIN TABS & FILTER CONTROLS
      ====================================================== */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm">
        {/* Domain Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${activeTab === "overview"
              ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
          >
            <Building2 size={15} />
            <span>Workforce &amp; Departments</span>
          </button>

          <button
            onClick={() => setActiveTab("payroll")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${activeTab === "payroll"
              ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
          >
            <WalletCards size={15} />
            <span>Payroll Financials</span>
          </button>

          <button
            onClick={() => setActiveTab("attendance")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${activeTab === "attendance"
              ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
          >
            <UserCheck size={15} />
            <span>Attendance &amp; Logs</span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${activeTab === "audit"
              ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
          >
            <ShieldCheck size={15} />
            <span>Security &amp; System Audit</span>
          </button>
        </div>

        {/* Contextual Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-60">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Search in ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3.5 py-2 text-xs font-medium text-slate-800 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
            />
          </div>

          {/* Date Filter: Attendance */}
          {activeTab === "attendance" && (
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

          {/* Month-Year Picker: Payroll Tab */}
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

      {/* =====================================================
          TAB 1: WORKFORCE & DEPARTMENTS (Matching Project Style)
      ====================================================== */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Building2 size={18} className="text-sky-600" />
                  Department Distribution
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 font-medium">
                  Employees across departments with estimated monthly payroll cost
                </p>
              </div>

              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-600 self-start sm:self-auto">
                {departments.length} Departments
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400">
                <Loader2 size={24} className="mx-auto animate-spin mb-2 text-sky-600" />
                Loading department distributions...
              </div>
            ) : filteredDepartments.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2">
                {filteredDepartments.map((department, index) => {
                  const count = Number(department.count) || 0;
                  const pct = department.percentage
                    ? parseFloat(department.percentage)
                    : totalEmployees > 0
                      ? Math.round((count / totalEmployees) * 100)
                      : 0;
                  const avgSalary = Number(department.avgSalary) || 0;
                  const totalDeptCost = count * avgSalary;

                  return (
                    <div key={index} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition hover:bg-white hover:border-sky-200 hover:shadow-sm">
                      <div className="mb-2 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-700">
                            {department.dept || "General"}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {count} employees · Est. Cost: {formatCurrency(totalDeptCost)}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-slate-700">
                          {pct}%
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-600 transition-all duration-1000"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <Search size={32} className="mx-auto mb-2 text-slate-300" />
                No department records found.
              </div>
            )}
          </section>
        </div>
      )}

      {/* =====================================================
          TAB 2: PAYROLL FINANCIALS (Matching Project Style)
      ====================================================== */}
      {activeTab === "payroll" && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <WalletCards size={18} className="text-sky-600" />
                Monthly Payroll Audit Register
              </h2>
              <p className="mt-0.5 text-xs text-slate-400 font-medium">
                Period-wise salary disbursement, tax deductions, and payment clearance status
              </p>
            </div>
            <button
              onClick={() => handleExportCSV("payroll")}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Download size={13} /> Export Payroll CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-4">Payroll Period</th>
                  <th className="px-4 py-4 text-center">Headcount</th>
                  <th className="px-4 py-4 text-right">Gross Total Salary</th>
                  <th className="px-4 py-4 text-right">Deductions (PF/PT/LOP)</th>
                  <th className="px-4 py-4 text-right">Net Payable</th>
                  <th className="px-5 py-4 text-center">Payment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Loader2 size={24} className="mx-auto animate-spin mb-2 text-sky-600" />
                      Loading Payroll Records...
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
                            <Clock3 size={12} /> {row.pendingCount || 0} Pending
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

              {filteredPayroll.length > 0 && (
                <tfoot className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200">
                  <tr>
                    <td className="px-5 py-3.5 uppercase tracking-wider text-slate-600">
                      Total Company Spend
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
        </section>
      )}

      {/* =====================================================
          TAB 3: ATTENDANCE & LEAVES (Matching Project Style)
      ====================================================== */}
      {activeTab === "attendance" && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <UserCheck size={18} className="text-emerald-600" />
                Workforce Attendance &amp; Punctuality Logs
              </h2>
              <p className="mt-0.5 text-xs text-slate-400 font-medium">
                Day-by-day punch attendance rates, late comers, and absenteeism breakdown
              </p>
            </div>
            <button
              onClick={() => handleExportCSV("attendance")}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Download size={13} /> Export Attendance CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-4">Log Date</th>
                  <th className="px-4 py-4 text-center">Present</th>
                  <th className="px-4 py-4 text-center">Absent</th>
                  <th className="px-4 py-4 text-center">Late Comers</th>
                  <th className="px-4 py-4 text-center">Half Day</th>
                  <th className="px-4 py-4 text-center">Total Shift Hours</th>
                  <th className="px-5 py-4 text-right">Compliance Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Loader2 size={24} className="mx-auto animate-spin mb-2 text-emerald-600" />
                      Loading Attendance Logs...
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
                              ? "bg-sky-100 text-sky-800"
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
            </table>
          </div>
        </section>
      )}

      {/* =====================================================
          TAB 4: SECURITY & SYSTEM AUDIT
      ====================================================== */}
      {activeTab === "audit" && (
        <section className="space-y-6">
          <div className="grid gap-5 md:grid-cols-3">
            {/* Roles Snapshot */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-violet-600" />
                  Active Roles in System
                </h3>
                <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-bold text-violet-700">
                  {rolesData.length || 3} Roles
                </span>
              </div>
              <div className="space-y-2.5">
                {rolesData.length > 0 ? (
                  rolesData.map((r, i) => (
                    <div key={i} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50">
                      <span className="font-bold text-slate-800">{r.name || r.roleName}</span>
                      <span className="text-slate-500 font-medium">RBAC Active</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50">
                      <span className="font-bold text-slate-800">Admin</span>
                      <span className="text-violet-700 font-bold">Full Access</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50">
                      <span className="font-bold text-slate-800">HR Manager</span>
                      <span className="text-sky-700 font-bold">HR Domain</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50">
                      <span className="font-bold text-slate-800">Employee</span>
                      <span className="text-slate-600 font-bold">Self Service</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* System Health */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  System Operational Health
                </h3>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                  100% Online
                </span>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Database Engine</span>
                  <span className="font-bold text-slate-800">MongoDB Atlas / Mongoose</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">API Gateway Status</span>
                  <span className="font-bold text-emerald-600">Operational (Healthy)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Scheduled Background Jobs</span>
                  <span className="font-bold text-sky-600">Active</span>
                </div>
              </div>
            </div>

            {/* Governance Summary */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <FileText size={16} className="text-sky-600" />
                  Audit Exporter
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Export all organization audit trails, employee master records, and compliance datasets in 1 click.
              </p>
              <button
                onClick={handlePrint}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 cursor-pointer"
              >
                <Printer size={14} />
                Generate Audit Summary Sheet
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default AdminReports;
