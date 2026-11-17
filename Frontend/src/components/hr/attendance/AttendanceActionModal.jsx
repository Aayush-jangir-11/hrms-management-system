import React from "react";
import {
  X,
  Calendar,
  Eye,
  Edit2,
  UserCheck,
  UserX,
  Clock,
  Clock3,
} from "lucide-react";

const AttendanceActionModal = ({
  record,
  onClose,
  onOpenMonthly,
  onView,
  onEdit,
  onQuickStatus,
  canEdit,
  canStatusAction,
  actionLoading,
}) => {
  if (!record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-sky-500 to-blue-600 p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 font-bold backdrop-blur-md">
                {record.initials}
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">
                  {record.employeeName}
                </h3>
                <p className="text-[11px] text-sky-100">
                  {record.employeeId} · {record.date}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-white/80 hover:bg-white/10 hover:text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Actions List */}
        <div className="p-5 space-y-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
            Record Operations
          </div>

          {/* View Full Month Record Container */}
          <button
            onClick={() => onOpenMonthly(record)}
            className="flex w-full items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50/80 px-4 py-3 text-xs font-bold text-sky-700 hover:bg-sky-100 transition-all cursor-pointer"
          >
            <Calendar size={16} className="text-sky-600" />
            <span>View Full Month Record &amp; Punch Logs</span>
          </button>

          {/* View Day Details */}
          <button
            onClick={() => onView(record)}
            className="flex w-full items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <Eye size={16} className="text-slate-600" />
            <span>View Single Day Details</span>
          </button>

          {/* Edit Record */}
          {canEdit && (
            <button
              onClick={() => onEdit(record)}
              className="flex w-full items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 px-4 py-3 text-xs font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-all cursor-pointer"
              title="Edit Timings & Remarks"
            >
              <Edit2 size={16} className="text-amber-500" />
              <span>Edit Timings &amp; Remarks</span>
            </button>
          )}

          {canStatusAction && (
            <div className="border-t border-slate-100 pt-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">
                Quick Set Status
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Mark Present */}
                <button
                  onClick={() => onQuickStatus(record.id, "Present")}
                  disabled={actionLoading}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition cursor-pointer disabled:opacity-50"
                  title="Mark Present"
                >
                  <UserCheck size={14} /> Present
                </button>

                {/* Mark Absent */}
                <button
                  onClick={() => onQuickStatus(record.id, "Absent")}
                  disabled={actionLoading}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer disabled:opacity-50"
                  title="Mark Absent"
                >
                  <UserX size={14} /> Absent
                </button>

                {/* Mark Late */}
                <button
                  onClick={() => onQuickStatus(record.id, "Late")}
                  disabled={actionLoading}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100 transition cursor-pointer disabled:opacity-50"
                  title="Mark Late"
                >
                  <Clock size={14} /> Late
                </button>

                {/* Mark Half Day */}
                <button
                  onClick={() => onQuickStatus(record.id, "Half Day")}
                  disabled={actionLoading}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 transition cursor-pointer disabled:opacity-50"
                  title="Mark Half Day"
                >
                  <Clock3 size={14} /> Half Day
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceActionModal;
