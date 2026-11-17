import React, { memo } from "react";
import { Eye, CheckCircle2, XCircle, Trash2, Calendar, Clock, AlertCircle } from "lucide-react";

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return "N/A";
  if (/^\d{1,2}\s+[A-Za-z]{3,}\s+\d{4}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/**
 * Mobile Card View for Leave Management
 * Replaces wide 1050px table on mobile phones with a high-clarity, thumb-friendly card.
 */
const LeaveRequestCard = memo(({
  request,
  onView,
  onApprove,
  onReject,
  onDelete,
  canApprove = true,
  canDelete = true,
}) => {
  const isPending = request.status === "Pending";
  const initials = (request.employeeName || "E")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition hover:shadow-md space-y-3.5">
      {/* Top Header: Employee + Status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-slate-800 truncate">
              {request.employeeName}
            </h4>
            <p className="text-[11px] font-semibold text-slate-400">
              {request.employeeId}
            </p>
          </div>
        </div>

        <span
          className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold shrink-0 ${
            request.status === "Approved"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
              : request.status === "Rejected"
              ? "bg-rose-50 text-rose-700 border border-rose-200/60"
              : "bg-amber-50 text-amber-700 border border-amber-200/60"
          }`}
        >
          {request.status}
        </span>
      </div>

      {/* Leave Type & Days */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="px-2.5 py-1 bg-sky-50 text-sky-800 rounded-lg text-xs font-bold border border-sky-200/70">
          {request.leaveType}
        </span>
        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200/70">
          {request.days || 1} {request.days === 1 ? "Day" : "Days"}
        </span>
      </div>

      {/* Dates Box */}
      <div className="rounded-xl bg-slate-50/80 p-3 text-xs space-y-1.5 border border-slate-100 text-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-medium">From:</span>
          <span className="font-bold flex items-center gap-1.5 text-slate-800">
            <Calendar size={13} className="text-sky-500" />
            {formatDateDisplay(request.fromDate)}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200/60 pt-1">
          <span className="text-slate-400 font-medium">To:</span>
          <span className="font-bold flex items-center gap-1.5 text-slate-800">
            <Calendar size={13} className="text-blue-500" />
            {formatDateDisplay(request.toDate)}
          </span>
        </div>
      </div>

      {/* Reason */}
      {request.reason && (
        <div className="text-xs text-slate-600 bg-amber-50/40 p-2.5 rounded-xl border border-amber-100/60">
          <span className="font-bold text-slate-500 block text-[10px] uppercase mb-0.5">Reason:</span>
          <p className="line-clamp-2">{request.reason}</p>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={() => onView(request)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
        >
          <Eye size={14} />
          Details
        </button>

        {isPending && canApprove && (
          <>
            <button
              type="button"
              onClick={() => onApprove(request.id)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition cursor-pointer border border-emerald-200"
            >
              <CheckCircle2 size={14} />
              Approve
            </button>
            <button
              type="button"
              onClick={() => onReject(request.id)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition cursor-pointer border border-amber-200"
            >
              <XCircle size={14} />
              Reject
            </button>
          </>
        )}

        {canDelete && (
          <button
            type="button"
            onClick={() => onDelete(request.id)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition cursor-pointer border border-rose-100"
            title="Delete Request"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
});

LeaveRequestCard.displayName = "LeaveRequestCard";

export default LeaveRequestCard;
