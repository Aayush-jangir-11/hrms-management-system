import React from "react";
import { X, UserCheck, Search } from "lucide-react";

const PolicyAssignModal = ({
  isOpen,
  onClose,
  onSubmit,
  selectedPolicy,
  filteredEmployeesForAssign,
  selectedEmployeesForAssign,
  setSelectedEmployeesForAssign,
  employeeSearchAssign,
  setEmployeeSearchAssign,
}) => {
  if (!isOpen || !selectedPolicy) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-sky-500 to-blue-600 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-xl p-2 text-white/80 hover:bg-white/20 hover:text-white cursor-pointer"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
              <UserCheck size={22} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold">Assign Work Policy</h3>
              <p className="text-xs text-sky-100">{selectedPolicy.name}</p>
            </div>
          </div>
        </div>

        {/* Body / Form */}
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <p className="text-xs font-semibold text-slate-600">
            Select employees to assign to <span className="font-bold text-slate-800">{selectedPolicy.name}</span> ({selectedPolicy.startTime} - {selectedPolicy.endTime}):
          </p>

          {/* Employee Search Bar */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee by name, ID, department, or role..."
              value={employeeSearchAssign}
              onChange={(e) => setEmployeeSearchAssign(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-medium text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 rounded-2xl border border-slate-200 bg-slate-50/50 p-3">
            {filteredEmployeesForAssign.length > 0 ? (
              filteredEmployeesForAssign.map((emp) => {
                const isChecked = selectedEmployeesForAssign.includes(emp.id);
                return (
                  <div
                    key={emp.id}
                    onClick={() =>
                      setSelectedEmployeesForAssign((prev) =>
                        prev.includes(emp.id) ? prev.filter((id) => id !== emp.id) : [...prev, emp.id]
                      )
                    }
                    className={`flex items-center justify-between rounded-xl p-3 border transition cursor-pointer ${isChecked
                      ? "bg-sky-50 border-sky-300 text-sky-900"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                  >
                    <div>
                      <p className="text-xs font-bold">{emp.name} ({emp.id})</p>
                      <p className="text-[11px] text-slate-400">
                        {emp.department} • {emp.role}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => { }}
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-400 font-medium bg-white rounded-xl border border-dashed border-slate-200">
                No employee found matching "{employeeSearchAssign}"
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-600">
              {selectedEmployeesForAssign.length} Selected
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:from-sky-600 hover:to-blue-700 cursor-pointer"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PolicyAssignModal;
