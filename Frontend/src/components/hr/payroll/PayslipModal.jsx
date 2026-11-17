import React from "react";
import { CreditCard, Printer, X } from "lucide-react";
/* ── Exported Payroll Data & Helpers ── */
export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

export const formatTime = (timeVal) => {
  if (!timeVal) return "—";
  if (typeof timeVal === "string" && (timeVal.includes(":") || timeVal.includes("AM") || timeVal.includes("PM"))) {
    return timeVal;
  }
  try {
    const d = new Date(timeVal);
    if (isNaN(d.getTime())) return String(timeVal);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return String(timeVal);
  }
};

export const currentYear = new Date().getFullYear();
export const currentMonthName = MONTHS[new Date().getMonth()];

export const getRowData = (record, gridEdits = {}) => {
  const e = record?.earnings || {};
  const d = record?.deductions || {};
  const edits = gridEdits[record?._id] || {};

  const basicSalary = edits.basicSalary !== undefined ? edits.basicSalary : (e.basicSalary || 0);
  const hra = edits.hra !== undefined ? edits.hra : (e.hra || 0);
  const specialAllowance = edits.specialAllowance !== undefined ? edits.specialAllowance : (e.specialAllowance || 0);
  const overtimePay = edits.overtimePay !== undefined ? edits.overtimePay : (e.overtimePay || 0);
  const bonus = edits.bonus !== undefined ? edits.bonus : (e.bonus || 0);

  const providentFund = edits.providentFund !== undefined ? edits.providentFund : (d.providentFund || 0);
  const professionalTax = edits.professionalTax !== undefined ? edits.professionalTax : (d.professionalTax || 0);
  const lwp = edits.lwp !== undefined ? edits.lwp : (d.lwp || 0);
  const tds = edits.tds !== undefined ? edits.tds : (d.tds || 0);
  const advanceRecovery = edits.advanceRecovery !== undefined ? edits.advanceRecovery : (d.advanceRecovery || 0);
  const otherDeductions = edits.otherDeductions !== undefined ? edits.otherDeductions : (d.otherDeductions || 0);

  const totalEarnings = basicSalary + hra + specialAllowance + overtimePay + bonus;
  const totalDeductions = providentFund + professionalTax + lwp + tds + advanceRecovery + otherDeductions;
  const netSalary = Math.max(0, totalEarnings - totalDeductions);

  return {
    basicSalary,
    hra,
    specialAllowance,
    overtimePay,
    bonus,
    totalEarnings,
    providentFund,
    professionalTax,
    lwp,
    tds,
    advanceRecovery,
    otherDeductions,
    totalDeductions,
    netSalary,
  };
};

export const earnings = (record) => {
  const e = record?.earnings || {};
  const basicSalary = Number(e.basicSalary) || 0;
  const hra = Number(e.hra) || 0;
  const specialAllowance = Number(e.specialAllowance) || 0;
  const overtimePay = Number(e.overtimePay) || 0;
  const bonus = Number(e.bonus) || 0;
  const totalEarnings =
    Number(e.totalEarnings) ||
    (basicSalary + hra + specialAllowance + overtimePay + bonus);
  return {
    basicSalary,
    hra,
    specialAllowance,
    overtimePay,
    bonus,
    totalEarnings,
  };
};

export const deductions = (record) => {
  const d = record?.deductions || {};
  const providentFund = Number(d.providentFund) || 0;
  const professionalTax = Number(d.professionalTax) || 0;
  const lwp = Number(d.lwp) || 0;
  const tds = Number(d.tds) || 0;
  const advanceRecovery = Number(d.advanceRecovery) || 0;
  const otherDeductions = Number(d.otherDeductions) || 0;
  const totalDeductions =
    Number(d.totalDeductions) ||
    (providentFund + professionalTax + lwp + tds + advanceRecovery + otherDeductions);
  return {
    providentFund,
    professionalTax,
    lwp,
    tds,
    advanceRecovery,
    otherDeductions,
    totalDeductions,
  };
};

export const attendance = (record) => {
  const a = record?.attendanceSummary || {};
  return {
    totalWorkingDays: Number(a.totalWorkingDays) || 30,
    presentDays: Number(a.presentDays) || 0,
    halfDays: Number(a.halfDays) || 0,
    absentDays: Number(a.absentDays) || 0,
    leaveDays: Number(a.leaveDays) || 0,
    paidLeaveDays: Number(a.paidLeaveDays) || 0,
    unpaidLeaveDays: Number(a.unpaidLeaveDays) || 0,
    paidDays: Number(a.paidDays) || Number(a.presentDays) || 0,
    lateDays: Number(a.lateDays) || 0,
    overtimeHours: Number(a.overtimeHours) || 0,
  };
};

const PayslipModal = ({
  record,
  onClose,
  onPrint,
}) => {
  if (!record) return null;

  const e = earnings(record);
  const d = deductions(record);
  const att = attendance(record);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 my-8 overflow-hidden">
        {/* Header toolbar */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <CreditCard size={16} className="text-sky-600" /> Payslip Preview
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onPrint}
              className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-sky-700 transition cursor-pointer"
            >
              <Printer size={14} /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Payslip document */}
        <div id="printable-payslip" className="p-8 space-y-6 text-slate-800 bg-white">
          {/* Organization Branding */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">FUEL IT HRMS</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Enterprise Payroll &amp; Workforce Management</p>
            </div>
            <div className="text-right">
              <span className="inline-block rounded-lg bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700 border border-sky-200">
                PAYSLIP FOR {record.month?.toUpperCase()} {record.year}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                Status: <strong className="text-slate-700">{record.status}</strong>
              </p>
            </div>
          </div>

          {/* Employee Summary Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs">
            <div>
              <p className="text-slate-400 uppercase font-semibold text-[10px]">Employee Name</p>
              <p className="font-bold text-slate-800 mt-0.5">{record.employee?.name || "—"}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase font-semibold text-[10px]">Employee ID</p>
              <p className="font-bold text-slate-800 mt-0.5">{record.employee?.employeeId || "—"}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase font-semibold text-[10px]">Department</p>
              <p className="font-bold text-slate-800 mt-0.5">{record.employee?.department || "—"}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase font-semibold text-[10px]">Paid Days</p>
              <p className="font-bold text-slate-800 mt-0.5">
                {att.paidDays || 0} / {att.totalWorkingDays || 30}
              </p>
            </div>
          </div>

          {/* Earnings & Deductions Tables */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Earnings */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-emerald-50 px-4 py-2.5 font-bold text-xs text-emerald-800 border-b border-emerald-100">
                Earnings
              </div>
              <div className="p-3 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Basic Salary (50%)</span>
                  <span className="font-semibold">{formatCurrency(e.basicSalary)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">HRA (20%)</span>
                  <span className="font-semibold">{formatCurrency(e.hra)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Special Allowance</span>
                  <span className="font-semibold">{formatCurrency(e.specialAllowance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Overtime Pay</span>
                  <span className="font-semibold">{formatCurrency(e.overtimePay)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Bonus</span>
                  <span className="font-semibold">{formatCurrency(e.bonus)}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-emerald-700">
                  <span>Total Earnings</span>
                  <span>{formatCurrency(e.totalEarnings)}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-rose-50 px-4 py-2.5 font-bold text-xs text-rose-800 border-b border-rose-100">
                Deductions
              </div>
              <div className="p-3 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Provident Fund (12%)</span>
                  <span className="font-semibold">-{formatCurrency(d.providentFund)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Professional Tax</span>
                  <span className="font-semibold">-{formatCurrency(d.professionalTax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Loss of Pay (LWP)</span>
                  <span className="font-semibold">-{formatCurrency(d.lwp)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">TDS</span>
                  <span className="font-semibold">-{formatCurrency(d.tds)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Advance Recovery</span>
                  <span className="font-semibold">-{formatCurrency(d.advanceRecovery)}</span>
                </div>
                {d.otherDeductions > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Other Deductions</span>
                    <span className="font-semibold">-{formatCurrency(d.otherDeductions)}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-rose-700">
                  <span>Total Deductions</span>
                  <span>-{formatCurrency(d.totalDeductions)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Salary Banner */}
          <div className="rounded-xl bg-slate-900 text-white p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Net Salary Transferred</p>
              <p className="text-2xl font-black mt-0.5">{formatCurrency(record.netSalary)}</p>
            </div>
            <div className="text-right text-xs text-slate-400">
              <p>Mode: <strong className="text-white">{record.paymentMode || "Bank Transfer"}</strong></p>
              <p className="mt-0.5">Ref: {record._id?.slice(-8).toUpperCase()}</p>
            </div>
          </div>

          {/* Footer Note */}
          <div className="border-t border-slate-100 pt-4 text-center text-[10px] text-slate-400">
            This is a computer-generated payslip and does not require a physical signature.
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PayslipModal);
