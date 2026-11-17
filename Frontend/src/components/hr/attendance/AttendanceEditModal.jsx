import React, { useMemo } from "react";
import { X, AlertCircle } from "lucide-react";

const AttendanceEditModal = ({
  isOpen,
  onClose,
  record,
  editForm,
  setEditForm,
  onSubmit,
  loading,
}) => {
  if (!isOpen || !record) return null;

  // Validate that check-out is after check-in
  const timeError = useMemo(() => {
    if (editForm.checkIn && editForm.checkOut) {
      const [hIn, mIn] = editForm.checkIn.split(":").map(Number);
      const [hOut, mOut] = editForm.checkOut.split(":").map(Number);
      const inMinutes = hIn * 60 + mIn;
      const outMinutes = hOut * 60 + mOut;

      if (outMinutes <= inMinutes) {
        return "Check-out time must be later than check-in time.";
      }
    }
    return "";
  }, [editForm.checkIn, editForm.checkOut]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (timeError) return;
    onSubmit(e);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Edit Attendance Record
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {record.employeeName} ({record.employeeId})
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Status Select */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Attendance Status
            </label>
            <select
              value={editForm.status}
              onChange={(e) =>
                setEditForm({ ...editForm, status: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none cursor-pointer"
            >
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Half Day">Half Day</option>
              <option value="On Leave">On Leave</option>
              <option value="Absent">Absent</option>
            </select>
          </div>

          {/* Time inputs */}
          <div className="space-y-1.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Check-In Time
                </label>
                <input
                  type="time"
                  value={editForm.checkIn}
                  onChange={(e) =>
                    setEditForm({ ...editForm, checkIn: e.target.value })
                  }
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-mono font-semibold outline-none transition ${
                    timeError
                      ? "border border-rose-300 bg-rose-50/40 text-rose-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                      : "bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Check-Out Time
                </label>
                <input
                  type="time"
                  value={editForm.checkOut}
                  onChange={(e) =>
                    setEditForm({ ...editForm, checkOut: e.target.value })
                  }
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-mono font-semibold outline-none transition ${
                    timeError
                      ? "border border-rose-300 bg-rose-50/40 text-rose-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                      : "bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  }`}
                />
              </div>
            </div>

            {/* Inline validation message for timing */}
            {timeError && (
              <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1">
                <AlertCircle size={13} className="shrink-0" />
                <span>{timeError}</span>
              </p>
            )}
          </div>

          {/* Remark */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Remark / Note
            </label>
            <input
              type="text"
              placeholder="e.g. Approved leave / Manager manual entry"
              value={editForm.remark}
              onChange={(e) =>
                setEditForm({ ...editForm, remark: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || Boolean(timeError)}
              className="flex-1 py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-200"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AttendanceEditModal;
