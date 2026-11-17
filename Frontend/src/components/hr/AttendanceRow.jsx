import {
  LogIn,
  LogOut,
  CheckCircle,
  AlertCircle,
  Eye,
} from "lucide-react";

const AttendanceRow = ({
  record,
  onView,
  onMarkPresent,
  onMarkAbsent,
  onEdit,
}) => (
  <tr className="border-b border-slate-200 hover:bg-slate-50 transition">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
          {record.initials}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800">
            {record.employeeName}
          </p>
          <p className="text-xs text-slate-500">{record.employeeId}</p>
        </div>
      </div>
    </td>
    <td className="px-6 py-4 text-sm text-slate-600">{record.department}</td>
    <td className="px-6 py-4 text-sm text-slate-600">{record.date}</td>
    <td className="px-6 py-4 text-sm text-slate-600">
      {record.checkIn ? (
        <div className="flex items-center gap-2">
          <LogIn size={16} className="text-green-600" />
          {record.checkIn}
        </div>
      ) : (
        <span className="text-slate-400">-</span>
      )}
    </td>
    <td className="px-6 py-4 text-sm text-slate-600">
      {record.checkOut ? (
        <div className="flex items-center gap-2">
          <LogOut size={16} className="text-orange-600" />
          {record.checkOut}
        </div>
      ) : (
        <span className="text-slate-400">-</span>
      )}
    </td>
    <td className="px-6 py-4 text-sm text-slate-600">
      {record.workingHours || "-"}
    </td>
    <td className="px-6 py-4 text-sm">
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          record.status === "Present"
            ? "bg-green-100 text-green-700"
            : record.status === "Absent"
              ? "bg-red-100 text-red-700"
              : record.status === "Late"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-slate-100 text-slate-700"
        }`}
      >
        {record.status}
      </span>
    </td>
    <td className="px-6 py-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onView(record)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
          title="View"
        >
          <Eye size={16} />
        </button>
        {record.status !== "Present" && (
          <button
            onClick={() => onMarkPresent(record.id)}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
            title="Mark Present"
          >
            <CheckCircle size={16} />
          </button>
        )}
        {record.status !== "Absent" && (
          <button
            onClick={() => onMarkAbsent(record.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            title="Mark Absent"
          >
            <AlertCircle size={16} />
          </button>
        )}
        <button
          onClick={() => onEdit(record)}
          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition"
          title="Edit"
        >
          ✏️
        </button>
      </div>
    </td>
  </tr>
);

export default AttendanceRow;
