import React from "react";
import { X, TrendingUp, TrendingDown, CheckCircle, Printer } from "lucide-react";
import { formatCurrency, earnings, deductions, attendance } from "./PayslipModal";

const PayrollDetailModal = ({
  record,
  onClose,
  onOpenPayslip,
}) => {
  if (!record) return null;

  const e = earnings(record);
  const d = deductions(record);
  const att = attendance(record);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 p-6 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Payroll Details</h2>
            <p className="mt-0.5 text-xs font-semibold text-slate-400">
              {record.month} {record.year}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Employee Info */}
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-xl font-bold text-white shadow-md">
              {record.employee?.name?.charAt(0) || "E"}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">
                {record.employee?.name}
              </h3>
              <p className="text-sm font-medium text-sky-600">
                {record.employee?.department}
              </p>
              <p className="text-xs text-slate-400">
                {record.employee?.employeeId} · {record.employee?.email}
              </p>
            </div>
          </div>

          {/* Earnings */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5 mb-3">
              <TrendingUp size={14} /> Earnings
            </p>
            {[
              ["Basic Salary (50%)", e.basicSalary],
              ["HRA (20%)", e.hra],
              ["Special Allowance", e.specialAllowance],
              ["Overtime Pay", e.overtimePay],
              ["Bonus", e.bonus],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">{label}</span>
                <span className="font-semibold text-emerald-700">{formatCurrency(val)}</span>
              </div>
            ))}
            <div className="border-t border-emerald-200 pt-2 flex justify-between text-sm font-bold">
              <span className="text-slate-700">Total Earnings</span>
              <span className="text-emerald-800">{formatCurrency(e.totalEarnings)}</span>
            </div>
          </div>

          {/* Deductions */}
          <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-5 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5 mb-3">
              <TrendingDown size={14} /> Deductions
            </p>
            {[
              ["Provident Fund (12%)", d.providentFund],
              ["Professional Tax", d.professionalTax],
              ["Loss of Pay (LWP)", d.lwp],
              ["TDS", d.tds],
              ["Advance Recovery", d.advanceRecovery],
              ["Other Deductions", d.otherDeductions],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">{label}</span>
                <span className="font-semibold text-rose-600">-{formatCurrency(val)}</span>
              </div>
            ))}
            <div className="border-t border-rose-200 pt-2 flex justify-between text-sm font-bold">
              <span className="text-slate-700">Total Deductions</span>
              <span className="text-rose-700">-{formatCurrency(d.totalDeductions)}</span>
            </div>
          </div>

          {/* Attendance Summary */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Attendance Summary
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                ["Working Days", att.totalWorkingDays],
                ["Present", att.presentDays],
                ["Absent", att.absentDays],
                ["Half Days", att.halfDays],
                ["Late", att.lateDays],
                ["Paid Leave", att.paidLeaveDays],
                ["Unpaid Leave", att.unpaidLeaveDays],
                ["Paid Days", att.paidDays],
                ["OT Hours", att.overtimeHours?.toFixed(1)],
              ].map(([label, val]) => (
                <div key={label} className="rounded-xl bg-white border border-slate-100 p-2.5 text-center">
                  <p className="text-lg font-extrabold text-slate-800">{val ?? "—"}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Net Salary */}
          <div className="rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 p-5 flex items-center justify-between shadow-lg shadow-blue-200">
            <div>
              <p className="text-xs font-bold text-sky-100 uppercase tracking-wider">Net Salary</p>
              <p className="text-3xl font-extrabold text-white mt-1">
                {formatCurrency(record.netSalary)}
              </p>
            </div>
            {record.status === "Paid" ? (
              <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-xs font-bold text-white border border-white/30">
                <CheckCircle size={14} /> Paid
              </span>
            ) : (
              <span className="rounded-full bg-amber-400/30 px-4 py-2 text-xs font-bold text-amber-100 border border-amber-300/40">
                Pending
              </span>
            )}
          </div>

          {/* Remarks */}
          {record.remarks && (
            <p className="text-xs text-slate-400 italic text-center">{record.remarks}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                onClose();
                onOpenPayslip(record);
              }}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 py-3 text-sm font-bold hover:bg-sky-100 transition-colors cursor-pointer"
            >
              <Printer size={16} /> Print Payslip
            </button>
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PayrollDetailModal);
