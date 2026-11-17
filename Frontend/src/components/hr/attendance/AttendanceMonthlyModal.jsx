import React from "react";
import {
  X,
  CheckCircle,
  Clock,
  Clock3,
  UserX,
  CalendarDays,
  FileText,
  MapPin,
  Laptop,
  ShieldCheck,
  ArrowDownRight,
  ArrowUpRight,
  Loader2,
} from "lucide-react";

const AttendanceMonthlyModal = ({
  isOpen,
  onClose,
  employee,
  monthlyData,
  loading,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  activeTab,
  onTabChange,
  monthNames,
  yearOptions,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col">
        {/* Header Banner */}
        <div className="relative shrink-0 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-700 p-6 text-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 border border-white/30 backdrop-blur-md text-base font-black shadow-inner">
                {employee?.initials || "EM"}
              </div>
              <div>
                <h2 className="text-lg font-black leading-tight">
                  {monthlyData?.employee?.name || employee?.employeeName}
                </h2>
                <p className="mt-0.5 text-xs text-sky-100 font-medium">
                  {monthlyData?.employee?.employeeId || employee?.employeeId} ·{" "}
                  {monthlyData?.employee?.department || employee?.department} ·{" "}
                  {monthlyData?.employee?.position || employee?.position}
                </p>
              </div>
            </div>

            {/* Month & Year Selectors & Close Button */}
            <div className="flex items-center gap-3">
              {/* Month Select */}
              <select
                value={selectedMonth}
                onChange={(e) => onMonthChange(parseInt(e.target.value, 10))}
                className="rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-xs font-bold text-white outline-none backdrop-blur-md cursor-pointer hover:bg-white/20 transition"
              >
                {monthNames.map((m) => (
                  <option key={m.value} value={m.value} className="text-slate-800">
                    {m.label}
                  </option>
                ))}
              </select>

              {/* Year Select */}
              <select
                value={selectedYear}
                onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
                className="rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-xs font-bold text-white outline-none backdrop-blur-md cursor-pointer hover:bg-white/20 transition"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y} className="text-slate-800">
                    {y}
                  </option>
                ))}
              </select>

              <button
                onClick={onClose}
                className="rounded-xl p-2 text-white/80 hover:bg-white/10 hover:text-white transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 size={36} className="animate-spin text-sky-500" />
              <p className="text-xs font-bold text-slate-500">
                Fetching Complete Monthly Attendance &amp; Audit Logs...
              </p>
            </div>
          ) : monthlyData ? (
            <>
              {/* Monthly Stats KPI Grid */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      Present Days
                    </span>
                    <CheckCircle size={18} className="text-emerald-600" />
                  </div>
                  <p className="mt-2 text-2xl font-black text-emerald-900">
                    {monthlyData.stats?.present || 0}
                    <span className="text-xs font-semibold text-emerald-600 ml-1">
                      / {monthlyData.period?.totalDaysInMonth} Days
                    </span>
                  </p>
                </div>

                <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">
                      Absent Days
                    </span>
                    <UserX size={18} className="text-rose-600" />
                  </div>
                  <p className="mt-2 text-2xl font-black text-rose-900">
                    {monthlyData.stats?.absent || 0}
                    <span className="text-xs font-semibold text-rose-600 ml-1">
                      Days
                    </span>
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                      Late Arrivals
                    </span>
                    <Clock size={18} className="text-amber-600" />
                  </div>
                  <p className="mt-2 text-2xl font-black text-amber-900">
                    {monthlyData.stats?.late || 0}
                    <span className="text-xs font-semibold text-amber-600 ml-1">
                      Times
                    </span>
                  </p>
                </div>

                <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">
                      Total Hours Worked
                    </span>
                    <Clock3 size={18} className="text-sky-600" />
                  </div>
                  <p className="mt-2 text-2xl font-black text-sky-900">
                    {monthlyData.stats?.totalWorkedHours || 0}
                    <span className="text-xs font-semibold text-sky-600 ml-1">
                      hrs (Avg: {monthlyData.stats?.avgHoursPerDay || 0}h/day)
                    </span>
                  </p>
                </div>
              </div>

              {/* Tabs Selector: Daily Breakdown vs Punch Audit Logs */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onTabChange("daily")}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
                      activeTab === "daily"
                        ? "bg-sky-500 text-white shadow-md shadow-sky-200"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <CalendarDays size={16} />
                    <span>Daily Attendance Records ({monthlyData.dailyAttendance?.length || 0})</span>
                  </button>

                  <button
                    onClick={() => onTabChange("logs")}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
                      activeTab === "logs"
                        ? "bg-sky-500 text-white shadow-md shadow-sky-200"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <FileText size={16} />
                    <span>Raw Punch Audit Logs ({monthlyData.punchLogs?.length || 0})</span>
                  </button>
                </div>
              </div>

              {/* TAB 1: Daily Attendance Breakdown Table */}
              {activeTab === "daily" && (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          <th className="px-5 py-3">Date</th>
                          <th className="px-5 py-3">Status</th>
                          <th className="px-5 py-3">Check In</th>
                          <th className="px-5 py-3">Check Out</th>
                          <th className="px-5 py-3">Worked Hours</th>
                          <th className="px-5 py-3">Sessions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-medium">
                        {monthlyData.dailyAttendance && monthlyData.dailyAttendance.length > 0 ? (
                          monthlyData.dailyAttendance.map((dayRec, idx) => {
                            const dObj = new Date(dayRec.date);
                            const formattedD = dObj.toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            });

                            const checkInT = dayRec.checkIn
                              ? new Date(dayRec.checkIn).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })
                              : "—";

                            const checkOutT = dayRec.checkOut
                              ? new Date(dayRec.checkOut).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })
                              : "—";

                            return (
                              <tr key={idx} className="hover:bg-slate-50/60 transition">
                                <td className="px-5 py-3.5 font-bold text-slate-800 whitespace-nowrap">
                                  {formattedD}
                                </td>
                                <td className="px-5 py-3.5 whitespace-nowrap">
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                                      dayRec.status === "Present"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : dayRec.status === "Late"
                                        ? "bg-amber-50 text-amber-700 border-amber-200"
                                        : dayRec.status === "Half Day"
                                        ? "bg-purple-50 text-purple-700 border-purple-200"
                                        : dayRec.status === "On Leave"
                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                        : "bg-rose-50 text-rose-700 border-rose-200"
                                    }`}
                                  >
                                    {dayRec.status}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5 font-mono text-slate-700 whitespace-nowrap">
                                  {checkInT}
                                </td>
                                <td className="px-5 py-3.5 font-mono text-slate-700 whitespace-nowrap">
                                  {checkOutT}
                                </td>
                                <td className="px-5 py-3.5 font-mono font-bold text-sky-700 whitespace-nowrap">
                                  {dayRec.totalHours > 0 ? `${dayRec.totalHours} hrs` : "—"}
                                </td>
                                <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                                  {dayRec.sessions?.length || 0} session(s)
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="6" className="px-5 py-10 text-center text-slate-400 font-medium">
                              No attendance records found for this month.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: Raw Punch Audit Logs Table */}
              {activeTab === "logs" && (
                <div className="space-y-4">
                  {/* Audit Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-medium text-slate-500">Total Audit Events</p>
                        <p className="text-xl font-bold text-slate-900 mt-0.5">
                          {monthlyData.punchLogs?.length || 0}
                        </p>
                      </div>
                      <div className="h-9 w-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                        <Clock size={18} />
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-emerald-50/50 p-3 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-medium text-emerald-700">Total Punch INs</p>
                        <p className="text-xl font-bold text-emerald-900 mt-0.5">
                          {monthlyData.punchLogs?.filter((p) => p.punchType === "IN").length || 0}
                        </p>
                      </div>
                      <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <ArrowDownRight size={18} />
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-indigo-50/50 p-3 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-medium text-indigo-700">Total Punch OUTs</p>
                        <p className="text-xl font-bold text-indigo-900 mt-0.5">
                          {monthlyData.punchLogs?.filter((p) => p.punchType === "OUT").length || 0}
                        </p>
                      </div>
                      <div className="h-9 w-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                        <ArrowUpRight size={18} />
                      </div>
                    </div>
                  </div>

                  {/* Audit Log Table */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            <th className="px-5 py-3">#</th>
                            <th className="px-5 py-3">Punch Timestamp</th>
                            <th className="px-5 py-3">Event Type</th>
                            <th className="px-5 py-3">Location / Geofence</th>
                            <th className="px-5 py-3">Device Source</th>
                            <th className="px-5 py-3">Audit Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-medium">
                          {monthlyData.punchLogs && monthlyData.punchLogs.length > 0 ? (
                            monthlyData.punchLogs.map((pLog, idx) => {
                              const pTime = new Date(pLog.punchTime);
                              const dateFormatted = pTime.toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              });
                              const timeFormatted = pTime.toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                                hour12: true,
                              });

                              return (
                                <tr key={idx} className="hover:bg-slate-50/60 transition">
                                  <td className="px-5 py-3.5 font-mono text-slate-400 text-[11px]">
                                    #{String(idx + 1).padStart(2, "0")}
                                  </td>
                                  <td className="px-5 py-3.5 font-mono font-bold text-slate-800 whitespace-nowrap">
                                    <div className="flex flex-col">
                                      <span>{dateFormatted}</span>
                                      <span className="text-[11px] text-slate-500 font-normal">{timeFormatted}</span>
                                    </div>
                                  </td>
                                  <td className="px-5 py-3.5 whitespace-nowrap">
                                    <span
                                      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold border ${
                                        pLog.punchType === "IN"
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                          : "bg-indigo-50 text-indigo-700 border-indigo-200"
                                      }`}
                                    >
                                      {pLog.punchType === "IN" ? (
                                        <ArrowDownRight size={12} />
                                      ) : (
                                        <ArrowUpRight size={12} />
                                      )}
                                      Punch {pLog.punchType}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                                    <div className="flex items-center gap-1.5">
                                      <MapPin size={14} className="text-rose-500" />
                                      <span className="font-semibold">{pLog.location || "Office Headquarters"}</span>
                                    </div>
                                  </td>
                                  <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                                    <div className="flex items-center gap-1.5">
                                      <Laptop size={14} className="text-sky-500" />
                                      <span>{pLog.device || "Web Portal"}</span>
                                    </div>
                                  </td>
                                  <td className="px-5 py-3.5 whitespace-nowrap">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200">
                                      <ShieldCheck size={12} className="text-emerald-600" />
                                      Verified Audit
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan="6" className="px-5 py-10 text-center text-slate-400 font-medium">
                                No raw punch logs recorded for this month.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-10 text-center text-slate-500">
              Failed to load monthly record container.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-100 bg-slate-50/70 p-4 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-6 py-2.5 text-xs font-bold text-white transition hover:bg-slate-900 cursor-pointer"
          >
            Close Record
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceMonthlyModal;
