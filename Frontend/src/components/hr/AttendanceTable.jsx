import {
  CheckCircle,
  AlertCircle,
  Search,
  Eye,
  Edit2,
  Clock,
} from "lucide-react";

const AttendanceTable = ({
  records = [],
  onView,
  onEdit,
  onMarkPresent,
  onMarkAbsent,
  actionLoading = false,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-xs font-semibold">
              <th className="px-6 py-3.5">Employee</th>
              <th className="px-6 py-3.5">Department</th>
              <th className="px-6 py-3.5">Date</th>
              <th className="px-6 py-3.5">Check-in</th>
              <th className="px-6 py-3.5">Check-out</th>
              <th className="px-6 py-3.5">Working Hours</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {records.length > 0 ? (
              records.map((record) => (
                <tr
                  key={record.id}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  {/* Employee Info */}
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                        {record.initials}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          {record.employeeName}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {record.employeeId}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Department */}
                  <td className="px-6 py-3.5 text-xs text-slate-600">
                    {record.department}
                  </td>

                  {/* Date */}
                  <td className="px-6 py-3.5 text-xs text-slate-600">
                    {record.date}
                  </td>

                  {/* Check-In */}
                  <td className="px-6 py-3.5 text-xs font-mono text-slate-700">
                    {record.checkIn || (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>

                  {/* Check-Out */}
                  <td className="px-6 py-3.5 text-xs font-mono text-slate-700">
                    {record.checkOut || (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>

                  {/* Working Hours */}
                  <td className="px-6 py-3.5 text-xs font-mono font-semibold text-slate-700">
                    {record.workingHours ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} className="text-slate-400" />
                        {record.workingHours}
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="px-6 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        record.status === "Present"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : record.status === "Late"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : record.status === "Half Day"
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : record.status === "On Leave"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : record.status === "Absent"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {record.status === "Present" && <CheckCircle size={11} />}
                      {record.status === "Late" && <AlertCircle size={11} />}
                      {record.status}
                    </span>
                  </td>

                  {/* Action Buttons */}
                  <td className="px-6 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => onView && onView(record)}
                        className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition cursor-pointer"
                        title="View Details"
                      >
                        <Eye size={15} />
                      </button>

                      <button
                        onClick={() => onEdit && onEdit(record)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                        title="Edit Record"
                      >
                        <Edit2 size={15} />
                      </button>

                      {record.status !== "Present" && (
                        <button
                          onClick={() => onMarkPresent && onMarkPresent(record.id)}
                          disabled={actionLoading}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer disabled:opacity-50"
                          title="Quick Mark Present"
                        >
                          <CheckCircle size={15} />
                        </button>
                      )}

                      {record.status !== "Absent" && (
                        <button
                          onClick={() => onMarkAbsent && onMarkAbsent(record.id)}
                          disabled={actionLoading}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer disabled:opacity-50"
                          title="Quick Mark Absent"
                        >
                          <AlertCircle size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="8"
                  className="px-6 py-12 text-center text-slate-400 text-xs"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search size={24} className="text-slate-300" />
                    <p>No attendance records found matching the filters</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceTable;
