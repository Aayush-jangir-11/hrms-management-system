import React from "react";
import { Search, Plus, Loader, Users, Check, Edit2, Calendar } from "lucide-react";
import { formatCurrency } from "./PayslipModal";
import TableSkeleton from "../../common/TableSkeleton";

const SalarySetupTab = ({
  searchTerm,
  setSearchTerm,
  onOpenGenerateModal,
  loadingSalaries,
  filteredEmployeeSalaries,
  totalEmployeesCount,
  editingSalaryId,
  setEditingSalaryId,
  editSalaryValue,
  setEditSalaryValue,
  savingSalaryId,
  onSaveSalary,
  onViewReport,
  can = () => true,
}) => {
  const canProcess = can("process");

  return (
    <div className="space-y-6">
      {/* Salary Setup Banner & Search Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee by name, ID or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
            />
          </div>

          {canProcess && (
            <button
              onClick={onOpenGenerateModal}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 cursor-pointer"
              title="Generate Payroll Now"
            >
              <Plus size={18} />
              Generate Payroll Now
            </button>
          )}
        </div>
      </div>

      {/* Salary Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Employee Base Salaries</h2>
            <p className="mt-0.5 text-xs text-slate-400 font-medium">
              Set base monthly gross salary for each active employee before generating monthly payroll.
            </p>
          </div>
          <span className="rounded-full bg-sky-50 px-3.5 py-1 text-xs font-bold text-sky-600">
            {totalEmployeesCount} Employees
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/50 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Department &amp; Position</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Annual CTC (₹ / Per Annum)</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingSalaries ? (
                <TableSkeleton rows={6} cols={5} hasAvatar={true} />
              ) : filteredEmployeeSalaries.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center">
                    <Users size={36} className="mx-auto text-slate-300" />
                    <p className="mt-2 text-sm font-bold text-slate-700">No employees found</p>
                  </td>
                </tr>
              ) : (
                filteredEmployeeSalaries.map((emp) => {
                  const isEditing = editingSalaryId === emp._id;
                  const isSaving = savingSalaryId === emp._id;
                  const currentCtc = emp.ctc || (emp.salary || 0) * 12;

                  return (
                    <tr key={emp._id} className="transition hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{emp.name}</div>
                        <div className="text-xs text-slate-400">{emp.employeeId} • {emp.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-700">{emp.department}</div>
                        <div className="text-xs text-slate-400">{emp.position}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${emp.status === "Active"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-slate-100 text-slate-500"
                            }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${emp.status === "Active" ? "bg-emerald-500" : "bg-slate-400"
                              }`}
                          />
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (() => {
                          const numVal = Number(editSalaryValue);
                          const isInvalid = !editSalaryValue || isNaN(numVal) || numVal <= 0;

                          return (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-400">₹</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={editSalaryValue}
                                  onChange={(e) => setEditSalaryValue(e.target.value)}
                                  className={`w-44 rounded-lg border px-3 py-1.5 text-sm font-bold outline-none transition ${isInvalid
                                      ? "border-rose-400 bg-rose-50/40 text-rose-900 focus:ring-2 focus:ring-rose-200"
                                      : "border-sky-300 bg-sky-50/50 text-slate-800 focus:ring-2 focus:ring-sky-200"
                                    }`}
                                  placeholder="Annual CTC e.g. 600000"
                                  autoFocus
                                />
                              </div>
                              {isInvalid ? (
                                <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                                  <span>⚠️</span> Salary must be greater than 0
                                </span>
                              ) : (
                                <span className="text-[11px] font-semibold text-sky-600">
                                  Monthly: ₹{Math.round(numVal / 12).toLocaleString("en-IN")}/mo
                                </span>
                              )}
                            </div>
                          );
                        })() : (
                          <div>
                            <span className="font-bold text-slate-800 text-base">
                              {formatCurrency(currentCtc)}
                            </span>
                            <div className="text-[11px] font-medium text-slate-400">
                              Monthly: ₹{(emp.salary || 0).toLocaleString("en-IN")}/mo
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isEditing ? (() => {
                          const numVal = Number(editSalaryValue);
                          const isInvalid = !editSalaryValue || isNaN(numVal) || numVal <= 0;

                          return (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => !isInvalid && onSaveSalary(emp._id, editSalaryValue)}
                                disabled={isSaving || isInvalid}
                                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                              >
                                {isSaving ? (
                                  <Loader size={14} className="animate-spin" />
                                ) : (
                                  <Check size={14} />
                                )}
                                Save CTC
                              </button>
                              <button
                                onClick={() => setEditingSalaryId(null)}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          );
                        })() : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onViewReport(emp._id, emp.name)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-600 cursor-pointer"
                              title="View Monthly Attendance & LOP Breakdown"
                            >
                              <Calendar size={13} className="text-sky-500" />
                              Attendance Report
                            </button>
                            {canProcess && (
                              <button
                                onClick={() => {
                                  setEditingSalaryId(emp._id);
                                  setEditSalaryValue(String(currentCtc));
                                }}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-600 cursor-pointer"
                              >
                                <Edit2 size={13} />
                                Set CTC
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default React.memo(SalarySetupTab);
