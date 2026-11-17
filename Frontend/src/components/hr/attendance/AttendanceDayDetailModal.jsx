import React from "react";
import { X } from "lucide-react";

const AttendanceDayDetailModal = ({
  isOpen,
  onClose,
  record,
  onEdit,
}) => {
  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-white font-bold text-base shadow-sm">
                {record.initials}
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  {record.employeeName}
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  {record.employeeId} · {record.department}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Grid details */}
          <div className="space-y-3 bg-slate-50/80 rounded-2xl p-4.5 text-xs border border-slate-100">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-400 font-medium">Date</span>
              <span className="font-bold text-slate-700">
                {record.date}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-400 font-medium">Status</span>
              <span className="font-bold text-slate-800">
                {record.status}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-400 font-medium">Check-In Time</span>
              <span className="font-mono font-bold text-slate-700">
                {record.checkIn || "—"}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-400 font-medium">Check-Out Time</span>
              <span className="font-mono font-bold text-slate-700">
                {record.checkOut || "—"}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-400 font-medium">Total Worked</span>
              <span className="font-mono font-bold text-sky-700">
                {record.workingHours || "—"}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400 font-medium">Remark / Note</span>
              <span className="font-medium text-slate-700">
                {record.remark || "None"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 mt-5">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(record);
              }}
              className="flex-1 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md shadow-sky-200"
            >
              Edit Record
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceDayDetailModal;
