import React from "react";
import {
  CalendarDays,
  Calendar,
  MoreVertical,
  Clock,
  Clock3,
  CheckCircle,
  AlertCircle,
  UserX,
  Loader2,
  Search,
} from "lucide-react";
import TableSkeleton from "../../common/TableSkeleton";

const AttendanceTable = ({
  records,
  loading,
  filteredCount,
  currentPage,
  itemsPerPage,
  totalPages,
  onPageChange,
  onItemsPerPageChange,
  onOpenMonthlyModal,
  onOpenActionModal,
}) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
      {/* DESKTOP TABLE VIEW (Screens >= 768px) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th className="px-6 py-4">Employee</th>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Check In</th>
              <th className="px-6 py-4">Check Out</th>
              <th className="px-6 py-4">Worked Hours</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <TableSkeleton rows={itemsPerPage || 6} cols={8} hasAvatar={true} />
            ) : records.length > 0 ? (
              records.map((record) => (
                <tr
                  key={record.id}
                  className="group hover:bg-sky-50/40 transition duration-150"
                >
                  {/* Employee Profile (Clickable to open Monthly Full Record Modal) */}
                  <td className="px-6 py-4.5">
                    <div
                      onClick={() => onOpenMonthlyModal(record)}
                      className="flex items-center gap-3 cursor-pointer group-hover:text-sky-600 transition"
                      title="Click to view full monthly attendance record"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 font-bold text-white shadow-xs text-xs">
                        {record.initials}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 group-hover:text-sky-600 transition whitespace-nowrap">
                          {record.employeeName}
                        </p>
                        <p className="text-xs font-medium text-slate-400">
                          {record.employeeId} · {record.position}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Department */}
                  <td className="px-6 py-4.5 text-xs font-semibold text-slate-600 whitespace-nowrap">
                    <span className="inline-block rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700 font-medium border border-slate-200/60">
                      {record.department}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="px-6 py-4.5 text-xs font-medium text-slate-700 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays size={14} className="text-slate-400" />
                      <span>{record.date}</span>
                    </div>
                  </td>

                  {/* Check In */}
                  <td className="px-6 py-4.5 text-xs font-mono font-semibold text-slate-700 whitespace-nowrap">
                    {record.checkIn ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-emerald-700 border border-emerald-100">
                        {record.checkIn}
                      </span>
                    ) : (
                      <span className="text-slate-300 font-normal">—</span>
                    )}
                  </td>

                  {/* Check Out */}
                  <td className="px-6 py-4.5 text-xs font-mono font-semibold text-slate-700 whitespace-nowrap">
                    {record.checkOut ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-blue-700 border border-blue-100">
                        {record.checkOut}
                      </span>
                    ) : (
                      <span className="text-slate-300 font-normal">—</span>
                    )}
                  </td>

                  {/* Working Hours */}
                  <td className="px-6 py-4.5 text-xs font-mono font-bold text-slate-800 whitespace-nowrap">
                    {record.workingHours ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-slate-700 border border-slate-200">
                        <Clock3 size={13} className="text-sky-500" />
                        {record.workingHours}
                      </span>
                    ) : (
                      <span className="text-slate-300 font-normal">—</span>
                    )}
                  </td>

                  {/* Status Pill */}
                  <td className="px-6 py-4.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${
                        record.status === "Present"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : record.status === "Late"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : record.status === "Half Day"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : record.status === "On Leave"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : record.status === "Absent"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {record.status === "Present" && <CheckCircle size={13} />}
                      {record.status === "Late" && <AlertCircle size={13} />}
                      {record.status === "Half Day" && <Clock size={13} />}
                      {record.status === "On Leave" && <Calendar size={13} />}
                      {record.status === "Absent" && <UserX size={13} />}
                      <span>{record.status}</span>
                    </span>
                  </td>

                  {/* Action Trigger */}
                  <td className="px-6 py-4.5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onOpenMonthlyModal(record)}
                        className="flex h-9 items-center gap-1 rounded-xl border border-sky-200 bg-sky-50 px-3 text-xs font-bold text-sky-700 shadow-2xs transition hover:bg-sky-100 cursor-pointer"
                        title="View Full Month Attendance Record"
                      >
                        <Calendar size={14} />
                        <span>Month Record</span>
                      </button>

                      <button
                        onClick={() => onOpenActionModal(record)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs transition hover:bg-sky-50 hover:text-sky-600 hover:border-sky-300 active:scale-95 cursor-pointer"
                        title="Open Actions Menu"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="px-6 py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <Search size={24} />
                    </div>
                    <p className="text-sm font-bold text-slate-600">
                      No attendance records found
                    </p>
                    <p className="text-xs text-slate-400">
                      Try changing the search keyword, date, or filter parameters.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARD VIEW (Phone screens < 768px) */}
      <div className="md:hidden p-3.5 space-y-3 bg-slate-50/50">
        {loading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs animate-pulse space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="h-4 w-32 rounded bg-slate-200" />
                  <div className="h-3 w-20 rounded bg-slate-100" />
                </div>
                <div className="h-6 w-16 rounded-full bg-slate-100 shrink-0" />
              </div>
              <div className="h-14 rounded-xl bg-slate-50 border border-slate-100" />
              <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
                <div className="h-8 w-24 rounded-xl bg-slate-100" />
                <div className="h-8 w-8 rounded-xl bg-slate-100" />
              </div>
            </div>
          ))
        ) : records.length > 0 ? (
          records.map((record) => (
            <div
              key={record.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3 transition hover:shadow-md"
            >
              {/* Header: Avatar + Employee + Status */}
              <div className="flex items-start justify-between gap-3">
                <div
                  onClick={() => onOpenMonthlyModal(record)}
                  className="flex items-center gap-3 min-w-0 cursor-pointer"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 font-bold text-white shadow-xs text-xs">
                    {record.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {record.employeeName}
                    </p>
                    <p className="text-xs font-medium text-slate-400 truncate">
                      {record.employeeId} · {record.department}
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border shrink-0 ${
                    record.status === "Present"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : record.status === "Late"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : record.status === "Half Day"
                      ? "bg-purple-50 text-purple-700 border-purple-200"
                      : record.status === "On Leave"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : record.status === "Absent"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {record.status === "Present" && <CheckCircle size={12} />}
                  {record.status === "Late" && <AlertCircle size={12} />}
                  {record.status === "Half Day" && <Clock size={12} />}
                  {record.status === "On Leave" && <Calendar size={12} />}
                  {record.status === "Absent" && <UserX size={12} />}
                  <span>{record.status}</span>
                </span>
              </div>

              {/* Timing & Date Details Box */}
              <div className="rounded-xl bg-slate-50/80 p-3 text-xs border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={13} className="text-slate-400" />
                    <span>Date:</span>
                  </span>
                  <span className="font-bold text-slate-800">{record.date}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Check In</span>
                    <span className="font-mono font-bold text-slate-800">
                      {record.checkIn ? (
                        <span className="text-emerald-700">{record.checkIn}</span>
                      ) : (
                        "—"
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Check Out</span>
                    <span className="font-mono font-bold text-slate-800">
                      {record.checkOut ? (
                        <span className="text-blue-700">{record.checkOut}</span>
                      ) : (
                        "—"
                      )}
                    </span>
                  </div>
                </div>

                {record.workingHours && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span className="text-[11px] text-slate-500 font-medium">Worked Hours:</span>
                    <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100 text-[11px]">
                      {record.workingHours}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => onOpenMonthlyModal(record)}
                  className="flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 shadow-2xs transition hover:bg-sky-100 cursor-pointer"
                >
                  <Calendar size={13} />
                  <span>Month Record</span>
                </button>

                <button
                  onClick={() => onOpenActionModal(record)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs transition hover:bg-sky-50 hover:text-sky-600 active:scale-95 cursor-pointer"
                  title="Open Actions Menu"
                >
                  <MoreVertical size={15} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/80 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mx-auto mb-3">
              <Search size={22} />
            </div>
            <p className="text-sm font-bold text-slate-700">No attendance records found</p>
            <p className="text-xs text-slate-400 mt-1">Try changing your search date or filters</p>
          </div>
        )}
      </div>

      {/* Table Footer with Pagination Controls */}
      <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
          <span>
            Showing{" "}
            <strong className="text-slate-800">
              {filteredCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
            </strong>{" "}
            to{" "}
            <strong className="text-slate-800">
              {Math.min(currentPage * itemsPerPage, filteredCount)}
            </strong>{" "}
            of <strong className="text-slate-800">{filteredCount}</strong> matching rows
          </span>

          {/* Items Per Page Selector */}
          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
            <span className="text-slate-400">Per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:border-sky-500 cursor-pointer shadow-2xs"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Pagination Navigation Buttons */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage === 1}
              onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-sky-50 hover:text-sky-600 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-700 transition cursor-pointer shadow-2xs"
            >
              Previous
            </button>

            <span className="px-3 py-1.5 rounded-xl bg-sky-100 text-sky-800 text-xs font-extrabold border border-sky-200 shadow-2xs">
              Page {currentPage} of {totalPages}
            </span>

            <button
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-sky-50 hover:text-sky-600 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-700 transition cursor-pointer shadow-2xs"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceTable;
