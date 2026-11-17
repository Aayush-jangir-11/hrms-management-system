import { useState, useEffect, useMemo } from "react";
import {
  Wallet,
  Download,
  CalendarDays,
  IndianRupee,
  CheckCircle,
  Clock3,
  Loader,
  TrendingUp,
  TrendingDown,
  Printer,
  X,
  CreditCard,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import { getArrayData } from "../../utils/helpers";
import TableSkeleton from "../../components/common/TableSkeleton";
import { useGet } from "../../hooks/useApi";
import { usePermission } from "../../hooks/usePermission";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

const EmployeePayroll = () => {
  const { can } = usePermission("payroll");
  const canDownload = can("download") || can("export") || can("view");

  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [showPayslipModal, setShowPayslipModal] = useState(null);

  /* ── TanStack Query: Fetch employee's payrolls ── */
  const { data: resData, isLoading: loading, isError, error: queryError } = useGet(
    "/payroll/my-payrolls",
    "employee-payrolls"
  );

  const payrolls = getArrayData(resData, "payrolls");
  const error = isError ? (queryError?.response?.data?.message || "Failed to load payroll history") : null;

  useEffect(() => {
    if (payrolls.length > 0 && !selectedRecordId) {
      setSelectedRecordId(payrolls[0]._id);
    }
  }, [payrolls, selectedRecordId]);

  /* ── Selected Payroll Record ── */
  const currentRecord = useMemo(() => {
    if (!selectedRecordId || payrolls.length === 0) return payrolls[0] || null;
    return payrolls.find((p) => p._id === selectedRecordId) || payrolls[0] || null;
  }, [payrolls, selectedRecordId]);

  const earnings = currentRecord?.earnings || {};
  const deductions = currentRecord?.deductions || {};
  const attendance = currentRecord?.attendanceSummary || {};

  const totalAllowances =
    (earnings.hra || 0) +
    (earnings.specialAllowance || 0) +
    (earnings.overtimePay || 0) +
    (earnings.bonus || 0);

  const handlePrint = () => {
    window.print();
  };

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
        <AlertCircle size={32} className="mx-auto mb-2 text-rose-500" />
        <h2 className="text-base font-bold">Unable to Load Payroll</h2>
        <p className="mt-1 text-xs">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Payroll</h1>
          <p className="text-sm text-slate-500 mt-1">
            View your salary statements, earnings, deductions and payslips
          </p>
        </div>

        {/* Month Selector from Real Data */}
        {payrolls.length > 0 && (
          <div className="flex items-center gap-2">
            <CalendarDays size={18} className="text-slate-500" />
            <select
              value={selectedRecordId || ""}
              onChange={(e) => setSelectedRecordId(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none shadow-sm focus:border-indigo-500 cursor-pointer"
            >
              {payrolls.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.month} {p.year}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                  <div className="h-3 w-20 bg-slate-200 rounded" />
                  <div className="h-10 w-10 bg-slate-200 rounded-xl" />
                </div>
                <div className="h-7 w-28 bg-slate-200 rounded" />
                <div className="h-2.5 w-32 bg-slate-100 rounded" />
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-left">
                  <tr>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Period</th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Basic</th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Total Earnings</th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Deductions</th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Net Salary</th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <TableSkeleton rows={5} cols={7} hasAvatar={false} />
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : payrolls.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <Briefcase size={44} className="mx-auto mb-3 text-slate-300" />
          <h2 className="text-lg font-bold text-slate-700">No Payroll Records Yet</h2>
          <p className="mt-1 text-sm text-slate-400 max-w-sm mx-auto">
            Your monthly payroll will appear here once processed by HR.
          </p>
        </div>
      ) : (
        <>
          {/* ================= SALARY SUMMARY CARDS ================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Basic Salary */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Basic Salary</p>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <IndianRupee size={18} />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mt-3">
                {formatCurrency(earnings.basicSalary)}
              </h2>
              <p className="text-xs text-slate-400 mt-1">50% of monthly gross</p>
            </div>

            {/* Allowances */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Allowances &amp; Bonus</p>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Wallet size={18} />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-emerald-600 mt-3">
                {formatCurrency(totalAllowances)}
              </h2>
              <p className="text-xs text-slate-400 mt-1">HRA + Overtime + Special</p>
            </div>

            {/* Deductions */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Deductions</p>
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                  <TrendingDown size={18} />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-rose-500 mt-3">
                -{formatCurrency(deductions.totalDeductions)}
              </h2>
              <p className="text-xs text-slate-400 mt-1">PF + PT + LWP deductions</p>
            </div>

            {/* Net Salary */}
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-5 text-white shadow-md shadow-indigo-200">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-200">Net Take Home</p>
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <CheckCircle size={18} className="text-emerald-300" />
                </div>
              </div>
              <h2 className="text-2xl font-extrabold mt-3">
                {formatCurrency(currentRecord?.netSalary)}
              </h2>
              <p className="text-xs text-indigo-200 mt-1">
                Status: <span className="font-bold text-white">{currentRecord?.status}</span>
              </p>
            </div>
          </div>

          {/* ================= CURRENT SELECTED PAYSLIP DETAIL ================= */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-slate-800">
                    {currentRecord?.month} {currentRecord?.year} Payslip
                  </h2>
                  {currentRecord?.status === "Paid" ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                      Paid
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                      {currentRecord?.status || "Pending"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Salary statement for {currentRecord?.month} {currentRecord?.year}
                </p>
              </div>

              {canDownload && (
                <button
                  onClick={() => setShowPayslipModal(currentRecord)}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 active:scale-95 transition cursor-pointer"
                  title="View & Print Payslip"
                >
                  <Download size={16} /> View &amp; Print Payslip
                </button>
              )}
            </div>

            {/* Salary Breakdown: Earnings vs Deductions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Earnings */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-3 flex items-center gap-1.5">
                  <TrendingUp size={15} /> Earnings Breakdown
                </h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Basic Salary</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(earnings.basicSalary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">House Rent Allowance (HRA)</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(earnings.hra)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Special Allowance</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(earnings.specialAllowance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Overtime Pay</span>
                    <span className="font-semibold text-blue-600">{formatCurrency(earnings.overtimePay)}</span>
                  </div>
                  {earnings.bonus > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Bonus</span>
                      <span className="font-semibold text-purple-600">{formatCurrency(earnings.bonus)}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-emerald-700">
                    <span>Total Earnings</span>
                    <span>{formatCurrency(earnings.totalEarnings)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 mb-3 flex items-center gap-1.5">
                  <TrendingDown size={15} /> Deductions Breakdown
                </h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Provident Fund (PF)</span>
                    <span className="font-semibold text-rose-600">-{formatCurrency(deductions.providentFund)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Professional Tax (PT)</span>
                    <span className="font-semibold text-rose-600">-{formatCurrency(deductions.professionalTax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Loss of Pay (LWP)</span>
                    <span className="font-semibold text-rose-600">-{formatCurrency(deductions.lwp)}</span>
                  </div>
                  {deductions.tds > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">TDS</span>
                      <span className="font-semibold text-rose-600">-{formatCurrency(deductions.tds)}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-rose-700">
                    <span>Total Deductions</span>
                    <span>-{formatCurrency(deductions.totalDeductions)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Summary Mini-Bar */}
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Attendance Recorded For This Month
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-center text-xs">
                <div className="bg-white rounded-lg p-2 border border-slate-100">
                  <p className="text-slate-400">Total Days</p>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{attendance.totalWorkingDays || 30}</p>
                </div>
                <div className="bg-white rounded-lg p-2 border border-slate-100">
                  <p className="text-slate-400">Present</p>
                  <p className="font-bold text-emerald-600 text-sm mt-0.5">{attendance.presentDays || 0}</p>
                </div>
                <div className="bg-white rounded-lg p-2 border border-slate-100">
                  <p className="text-slate-400">Paid Leave</p>
                  <p className="font-bold text-blue-600 text-sm mt-0.5">{attendance.paidLeaveDays || 0}</p>
                </div>
                <div className="bg-white rounded-lg p-2 border border-slate-100">
                  <p className="text-slate-400">Unpaid / LWP</p>
                  <p className="font-bold text-rose-600 text-sm mt-0.5">{attendance.unpaidLeaveDays || 0}</p>
                </div>
                <div className="bg-white rounded-lg p-2 border border-slate-100">
                  <p className="text-slate-400">Paid Days</p>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{attendance.paidDays || 0}</p>
                </div>
                <div className="bg-white rounded-lg p-2 border border-slate-100">
                  <p className="text-slate-400">OT Hours</p>
                  <p className="font-bold text-indigo-600 text-sm mt-0.5">{attendance.overtimeHours?.toFixed(1) || 0}h</p>
                </div>
              </div>
            </div>

            {/* Net Salary highlight banner */}
            <div className="mt-6 p-5 bg-gradient-to-r from-indigo-50 to-sky-50 border border-indigo-100 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Salary Payable</p>
                <p className="text-2xl font-black text-indigo-700 mt-1">
                  {formatCurrency(currentRecord?.netSalary)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {currentRecord?.status === "Paid" ? (
                  <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-sm bg-emerald-100/80 px-3.5 py-1.5 rounded-full">
                    <CheckCircle size={16} /> Disbursed
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-amber-700 font-bold text-sm bg-amber-100/80 px-3.5 py-1.5 rounded-full">
                    <Clock3 size={16} /> Processing
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ================= PAYSLIP HISTORY TABLE ================= */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Payslip History</h2>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                View and download all your past monthly salary records
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-left">
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Period</th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Basic</th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Total Earnings</th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Deductions</th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Net Salary</th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {payrolls.map((slip) => (
                    <tr
                      key={slip._id}
                      className={`hover:bg-slate-50/80 transition-colors ${slip._id === selectedRecordId ? "bg-indigo-50/30" : ""
                        }`}
                    >
                      <td className="px-5 py-4 text-sm font-bold text-slate-800">
                        {slip.month} {slip.year}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600 font-medium">
                        {formatCurrency(slip.earnings?.basicSalary)}
                      </td>
                      <td className="px-5 py-4 text-sm text-emerald-600 font-semibold">
                        {formatCurrency(slip.earnings?.totalEarnings)}
                      </td>
                      <td className="px-5 py-4 text-sm text-rose-500 font-semibold">
                        -{formatCurrency(slip.deductions?.totalDeductions)}
                      </td>
                      <td className="px-5 py-4 text-sm font-extrabold text-slate-900">
                        {formatCurrency(slip.netSalary)}
                      </td>
                      <td className="px-5 py-4">
                        {slip.status === "Paid" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            {slip.status || "Pending"}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canDownload && (
                            <button
                              onClick={() => setShowPayslipModal(slip)}
                              className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 transition cursor-pointer"
                              title="View Payslip"
                            >
                              <Download size={13} /> Payslip
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ================= PAYSLIP PRINT MODAL ================= */}
      {showPayslipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 my-8 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <CreditCard size={16} className="text-indigo-600" /> My Payslip
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition"
                >
                  <Printer size={14} /> Print / PDF
                </button>
                <button
                  onClick={() => setShowPayslipModal(null)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200 transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Document */}
            <div id="printable-employee-payslip" className="p-8 space-y-6 text-slate-800 bg-white">
              <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900">FUEL IT HRMS</h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Official Salary Statement</p>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded-lg bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-200">
                    PAYSLIP · {showPayslipModal.month?.toUpperCase()} {showPayslipModal.year}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">Status: <strong className="text-slate-700">{showPayslipModal.status}</strong></p>
                </div>
              </div>

              {/* Summary metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs">
                <div>
                  <p className="text-slate-400 uppercase font-semibold text-[10px]">Employee</p>
                  <p className="font-bold text-slate-800 mt-0.5">{showPayslipModal.employee?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase font-semibold text-[10px]">Employee ID</p>
                  <p className="font-bold text-slate-800 mt-0.5">{showPayslipModal.employee?.employeeId || "—"}</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase font-semibold text-[10px]">Department</p>
                  <p className="font-bold text-slate-800 mt-0.5">{showPayslipModal.employee?.department || "—"}</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase font-semibold text-[10px]">Paid Days</p>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {showPayslipModal.attendanceSummary?.paidDays || 0} / {showPayslipModal.attendanceSummary?.totalWorkingDays || 30}
                  </p>
                </div>
              </div>

              {/* Earnings & Deductions Tables */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="bg-emerald-50 px-4 py-2.5 font-bold text-xs text-emerald-800 border-b border-emerald-100">
                    Earnings
                  </div>
                  <div className="p-3 text-xs space-y-2">
                    <div className="flex justify-between"><span className="text-slate-600">Basic Salary</span><span className="font-semibold">{formatCurrency(showPayslipModal.earnings?.basicSalary)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">HRA</span><span className="font-semibold">{formatCurrency(showPayslipModal.earnings?.hra)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Special Allowance</span><span className="font-semibold">{formatCurrency(showPayslipModal.earnings?.specialAllowance)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Overtime Pay</span><span className="font-semibold">{formatCurrency(showPayslipModal.earnings?.overtimePay)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Bonus</span><span className="font-semibold">{formatCurrency(showPayslipModal.earnings?.bonus)}</span></div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-emerald-700">
                      <span>Total Earnings</span>
                      <span>{formatCurrency(showPayslipModal.earnings?.totalEarnings)}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="bg-rose-50 px-4 py-2.5 font-bold text-xs text-rose-800 border-b border-rose-100">
                    Deductions
                  </div>
                  <div className="p-3 text-xs space-y-2">
                    <div className="flex justify-between"><span className="text-slate-600">Provident Fund (PF)</span><span className="font-semibold">-{formatCurrency(showPayslipModal.deductions?.providentFund)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Professional Tax (PT)</span><span className="font-semibold">-{formatCurrency(showPayslipModal.deductions?.professionalTax)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Loss of Pay (LWP)</span><span className="font-semibold">-{formatCurrency(showPayslipModal.deductions?.lwp)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">TDS</span><span className="font-semibold">-{formatCurrency(showPayslipModal.deductions?.tds)}</span></div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-rose-700">
                      <span>Total Deductions</span>
                      <span>-{formatCurrency(showPayslipModal.deductions?.totalDeductions)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Banner */}
              <div className="rounded-xl bg-slate-900 text-white p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Net Salary Transferred</p>
                  <p className="text-2xl font-black mt-0.5">{formatCurrency(showPayslipModal.netSalary)}</p>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <p>Mode: <strong className="text-white">{showPayslipModal.paymentMode || "Bank Transfer"}</strong></p>
                  <p className="mt-0.5">Ref: {showPayslipModal._id?.slice(-8).toUpperCase()}</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 text-center text-[10px] text-slate-400">
                This is a computer-generated document and does not require a physical signature.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeePayroll;
