import { useState, useRef } from "react";
import { Eye, CheckCircle, AlertCircle, Trash2, Calendar, MoreVertical } from "lucide-react";

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return "";
  if (/^\d{1,2}\s+[A-Za-z]{3,}\s+\d{4}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const LeaveRequestRow = ({
  request,
  onView,
  onApprove,
  onReject,
  onDelete,
  canApprove = true,
  canDelete = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);

  const handleToggleMenu = (e) => {
    e.stopPropagation();
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuHeight = request.status === "Pending" ? 150 : 90;
      setMenuPos({
        top: Math.max(10, rect.top - menuHeight),
        left: rect.right - 144, // 144px width (w-36)
      });
    }
    setIsOpen(!isOpen);
  };

  return (
    <tr className="border-b border-slate-200 hover:bg-slate-50 transition">
      <td className="px-6 py-4">
        <div>
          <p className="text-sm font-bold text-slate-800">
            {request.employeeName}
          </p>
          <p className="text-xs font-semibold text-slate-500">{request.employeeId}</p>
        </div>
      </td>
      <td className="px-6 py-4 text-sm">
        <span className="px-3 py-1 bg-sky-100 text-sky-800 rounded-lg text-xs font-extrabold border border-sky-200/80 shadow-2xs">
          {request.leaveType}
        </span>
      </td>
      {/* From Date */}
      <td className="px-6 py-4 text-xs font-semibold text-slate-700">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-sky-50/90 border border-sky-200/80 text-xs font-bold text-sky-900 shadow-2xs">
          <Calendar size={13} className="text-sky-500 shrink-0" />
          <span>{formatDateDisplay(request.fromDate)}</span>
        </div>
      </td>

      {/* To Date */}
      <td className="px-6 py-4 text-xs font-semibold text-slate-700">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-50/90 border border-blue-200/80 text-xs font-bold text-blue-900 shadow-2xs">
          <Calendar size={13} className="text-blue-500 shrink-0" />
          <span>{formatDateDisplay(request.toDate)}</span>
        </div>
      </td>

      {/* Days */}
      <td className="px-6 py-4 text-xs font-bold text-slate-700">
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200/80 font-extrabold text-xs">
          {request.days || 1} {request.days === 1 ? "Day" : "Days"}
        </span>
      </td>

      <td className="px-6 py-4 text-sm text-slate-600 font-medium">{request.reason}</td>
      <td className="px-6 py-4 text-sm">
        <span
          className={`px-3 py-1 rounded-full text-xs font-extrabold ${request.status === "Approved"
              ? "bg-green-100 text-green-700"
              : request.status === "Rejected"
                ? "bg-red-100 text-red-700"
                : request.status === "Pending"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-slate-100 text-slate-700"
            }`}
        >
          {request.status}
        </span>
      </td>
      <td className="px-6 py-4 text-center">
        {/* Single 3-Dots / Action Icon Button */}
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggleMenu}
          className={`p-2 rounded-xl transition cursor-pointer border ${isOpen
              ? "bg-sky-100 text-sky-700 border-sky-300 shadow-2xs"
              : "bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-slate-200"
            }`}
          title="Actions Menu"
        >
          <MoreVertical size={16} />
        </button>

        {/* Action Dropdown Menu - Fixed Position (No Table Clipping) */}
        {isOpen && (
          <>
            {/* Transparent Overlay to close on outside click */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            <div
              style={{ top: `${menuPos.top}px`, left: `${menuPos.left}px` }}
              className="fixed w-36 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100 text-left"
            >
              {/* View Details */}
              <button
                type="button"
                onClick={() => {
                  onView(request);
                  setIsOpen(false);
                }}
                className="w-full px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-sky-50 hover:text-sky-600 flex items-center gap-2 transition cursor-pointer"
              >
                <Eye size={14} className="text-sky-500" />
                <span>View Details</span>
              </button>

              {/* Approve / Reject (if Pending) */}
              {request.status === "Pending" && canApprove && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onApprove(request.id);
                      setIsOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50 flex items-center gap-2 transition cursor-pointer"
                    title="Approve"
                  >
                    <CheckCircle size={14} className="text-emerald-500" />
                    <span>Approve</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onReject(request.id);
                      setIsOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-xs font-bold text-amber-800 hover:bg-amber-50 flex items-center gap-2 transition cursor-pointer"
                    title="Reject"
                  >
                    <AlertCircle size={14} className="text-amber-500" />
                    <span>Reject</span>
                  </button>
                </>
              )}

              {canDelete && (
                <>
                  <div className="my-1 border-t border-slate-100" />
                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(request.id);
                      setIsOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 size={14} className="text-rose-500" />
                    <span>Delete</span>
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </td>
    </tr>
  );
};

export default LeaveRequestRow;


