import React from "react";
import { Calendar, X, Loader, AlertTriangle, AlertCircle } from "lucide-react";
import { MONTHS, currentYear, formatTime } from "./PayslipModal";

const AttendanceReportModal = ({
  show,
  onClose,
  reportEmpInfo,
  reportMonth,
  reportYear,
  setReportMonth,
  setReportYear,
  loadingReport,
  reportData,
  onRefreshReport,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-sky-100 px-6 py-5 bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-white font-bold border border-white/30 backdrop-blur-xs">
              <Calendar size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Attendance &amp; LOP Report — {reportEmpInfo.name}
              </h2>
              <div className="flex items-center gap-2.5 mt-0.5">
                <span className="text-xs text-sky-100 font-medium">
                  Period: {reportMonth} {reportYear}
                </span>
                <input
                  type="month"
                  value={
                    MONTHS.indexOf(reportMonth) !== -1
                      ? `${reportYear || currentYear}-${String(MONTHS.indexOf(reportMonth) + 1).padStart(2, "0")}`
                      : `${reportYear || currentYear}-${String(new Date().getMonth() + 1).padStart(2, "0")}`
                  }
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const parts = e.target.value.split("-");
                    if (parts.length === 2) {
                      const y = parts[0];
                      const mIdx = Number(parts[1]) - 1;
                      if (mIdx >= 0 && mIdx < 12) {
                        const newMonth = MONTHS[mIdx];
                        setReportMonth(newMonth);
                        setReportYear(y);
                        onRefreshReport(reportEmpInfo.id, reportEmpInfo.name, newMonth, y);
                      }
                    }
                  }}
                  className="bg-white/20 text-white text-xs font-semibold rounded-lg px-2.5 py-1 outline-none border border-white/30 cursor-pointer focus:bg-white/30 transition"
                  title="Select Month & Year from Calendar"
                />
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-sky-100 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loadingReport ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader size={36} className="animate-spin text-sky-500" />
              <p className="mt-3 text-xs font-semibold text-slate-500">
                Generating full monthly attendance report...
              </p>
            </div>
          ) : !reportData || !reportData.success ? (
            <div className="py-16 text-center text-slate-500">
              <AlertTriangle size={36} className="mx-auto text-amber-500 mb-2" />
              <p className="font-bold text-slate-700">Failed to load report data</p>
            </div>
          ) : (
            <>
              {/* Stats Overview Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4">
                  <p className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">Total Working Days</p>
                  <p className="text-2xl font-extrabold text-sky-900 mt-1">
                    {reportData.summary?.totalWorkingDays || 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                  <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Present Days</p>
                  <p className="text-2xl font-extrabold text-emerald-700 mt-1">
                    {reportData.summary?.presentDays || 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
                  <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Absent &amp; Sandwiched</p>
                  <p className="text-2xl font-extrabold text-rose-700 mt-1">
                    {(reportData.summary?.absentDays || 0) + (reportData.summary?.sandwichedDays || 0)}
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
                  <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Total LOP Days</p>
                  <p className="text-2xl font-extrabold text-amber-700 mt-1">
                    {reportData.summary?.totalLopDays || 0} Days
                  </p>
                </div>
              </div>

              {/* LOP Breakdown Details */}
              {reportData.summary?.totalLopDays > 0 && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4 text-xs">
                  <h4 className="font-bold text-rose-900 flex items-center gap-2 mb-2">
                    <AlertCircle size={15} className="text-rose-600" />
                    Loss of Pay (LOP) Breakdown
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700 font-medium">
                    <div>• Direct Absent: <strong className="text-rose-800">{reportData.summary?.lopBreakdown?.fromAbsent || 0} days</strong></div>
                    <div>• Sandwiched Offs: <strong className="text-rose-800">{reportData.summary?.lopBreakdown?.fromSandwich || 0} days</strong></div>
                    <div>• Unpaid Leaves: <strong className="text-rose-800">{reportData.summary?.lopBreakdown?.fromUnpaidLeave || 0} days</strong></div>
                    <div>• Half Days: <strong className="text-rose-800">{reportData.summary?.lopBreakdown?.fromHalfDay || 0} days</strong></div>
                  </div>
                </div>
              )}

              {/* Daily Attendance Table */}
              <div className="rounded-2xl border border-slate-200/80 overflow-hidden bg-white shadow-xs">
                <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Daily Attendance Logs</h3>
                  <span className="text-xs text-sky-600 font-bold bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
                    Shift Policy: {reportData.policyApplied?.name || "Default Shift"}
                  </span>
                </div>
                <div className="overflow-x-auto max-h-[350px]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 border-b border-slate-200 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Day</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Check In</th>
                        <th className="px-4 py-3">Check Out</th>
                        <th className="px-4 py-3">Punches</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.dailyReport?.map((day) => (
                        <tr key={day.date} className="hover:bg-slate-50/70 transition">
                          <td className="px-4 py-2.5 font-bold text-slate-800">{day.date}</td>
                          <td className="px-4 py-2.5 font-medium text-slate-500">{day.dayName}</td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold border ${
                                day.status === "Present"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : day.status === "Late"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : day.status === "Half Day"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : day.status === "Absent" || day.status === "Sandwich Off (LOP)"
                                  ? "bg-rose-50 text-rose-700 border-rose-200 font-extrabold"
                                  : day.status === "Weekly Off" || day.status === "Holiday"
                                  ? "bg-slate-100 text-slate-600 border-slate-200"
                                  : "bg-purple-50 text-purple-700 border-purple-200"
                              }`}
                            >
                              {day.status}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-700 font-mono font-semibold">
                            {formatTime(day.checkIn)}
                          </td>
                          <td className="px-4 py-2.5 text-slate-700 font-mono font-semibold">
                            {formatTime(day.checkOut)}
                          </td>
                          <td className="px-4 py-2.5 text-slate-400 font-mono text-[10px]">
                            {day.punches && day.punches.length > 0 ? `${day.punches.length} punches` : "No punch"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-100 px-6 py-4 bg-slate-50/70 flex items-center justify-between">
          <p className="text-xs text-slate-400 font-medium">Report generated via `/api/reports/comprehensive`</p>
          <button
            onClick={onClose}
            className="rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-2 text-xs font-bold text-white shadow-md shadow-blue-200 transition hover:shadow-lg active:scale-[0.98] cursor-pointer"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(AttendanceReportModal);
