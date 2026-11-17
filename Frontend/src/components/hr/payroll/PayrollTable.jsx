import React, { useRef, useState, useEffect } from "react";
import {
  Briefcase,
  Loader,
  CheckCircle,
  MoreVertical,
  Eye,
  Download,
  Calendar,
  Clock3,
  Trash2,
  Save,
} from "lucide-react";
import { formatCurrency, getRowData, earnings, deductions } from "./PayslipModal";
import TableSkeleton from "../../common/TableSkeleton";

const TABLE_HEADERS = [
  "Employee",
  "Dept",
  "Basic (₹)",
  "HRA (₹)",
  "Special Allow. (₹)",
  "Overtime (₹)",
  "Bonus (₹)",
  "Total Earnings",
  "PF (₹)",
  "Prof. Tax (₹)",
  "LWP (₹)",
  "Total Deductions",
  "Net Salary",
  "Status",
  "Actions",
];

const PayrollTable = ({
  payrolls,
  loading,
  filterMonth,
  filterYear,
  gridEdits,
  dirtyRowIds,
  savingGridId,
  statusUpdatingId,
  showAction,
  setShowAction,
  onGridCellChange,
  onSaveGridRow,
  onStatusChange,
  onDeleteRecord,
  onSelectRecord,
  onSelectPayslipRecord,
  onViewReport,
  can = () => true,
  isAdmin = false,
}) => {
  const canProcess = can("process");
  const canApprove = can("approve");
  const canDownload = can("download");
  const canDelete = can("delete");

  const tableContainerRef = useRef(null);
  const [isSliding, setIsSliding] = useState(false);
  const dragRef = useRef({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
  });

  const handleHeaderMouseDown = (e) => {
    if (e.button !== 0) return;
    if (!tableContainerRef.current) return;
    dragRef.current.isDown = true;
    dragRef.current.startX = e.pageX - tableContainerRef.current.getBoundingClientRect().left;
    dragRef.current.scrollLeft = tableContainerRef.current.scrollLeft;
    setIsSliding(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragRef.current.isDown || !tableContainerRef.current) return;
      e.preventDefault();
      const currentX = e.pageX - tableContainerRef.current.getBoundingClientRect().left;
      const walk = (currentX - dragRef.current.startX) * 1.5;
      tableContainerRef.current.scrollLeft = dragRef.current.scrollLeft - walk;
    };

    const handleMouseUp = () => {
      if (dragRef.current.isDown) {
        dragRef.current.isDown = false;
        setIsSliding(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Payroll Records (Excel Editable Table)</h2>
          <p className="mt-0.5 text-xs text-slate-400 font-medium">
            {filterMonth} {filterYear} — Edit Basic, HRA, Allowances, OT, Bonus, PF &amp; Deductions directly in table cells
          </p>
        </div>
        <div>
          {dirtyRowIds.size > 0 ? (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-300">
              {dirtyRowIds.size} Unsaved Row(s)
            </span>
          ) : (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
              0 Unsaved Rows
            </span>
          )}
        </div>
      </div>

      {/* Desktop Table */}
      <div
        ref={tableContainerRef}
        className={`hidden overflow-x-auto lg:block ${isSliding ? "cursor-grabbing select-none" : ""}`}
      >
        <table className="w-full min-w-[1350px]">
          <thead
            onMouseDown={handleHeaderMouseDown}
            className={`border-b border-slate-200 transition-colors select-none ${isSliding
                ? "cursor-grabbing bg-sky-50/80"
                : "cursor-grab bg-slate-50/90 hover:bg-slate-100/90"
              }`}
            title="Click and slide header to scroll horizontally"
          >
            <tr>
              {TABLE_HEADERS.map((h) => (
                <th
                  key={h}
                  className={`px-3 py-3.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap select-none ${h.includes("Basic") || h.includes("HRA") || h.includes("Special")
                      ? "bg-emerald-50/70 text-emerald-800 text-right"
                      : h.includes("Overtime")
                        ? "bg-blue-50/70 text-blue-800 text-right"
                        : h.includes("Bonus")
                          ? "bg-violet-50/70 text-violet-800 text-right"
                          : h.includes("Total Earnings")
                            ? "bg-emerald-100/70 text-emerald-900 text-right"
                            : h.includes("PF") || h.includes("Prof") || h.includes("LWP")
                              ? "bg-rose-50/70 text-rose-800 text-right"
                              : h.includes("Total Deductions")
                                ? "bg-rose-100/70 text-rose-900 text-right"
                                : h.includes("Net Salary")
                                  ? "bg-slate-100 text-slate-900 text-right"
                                  : "text-left text-slate-500"
                    }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className={`divide-y divide-slate-100 ${isSliding ? "select-none pointer-events-none" : ""}`}>
            {loading ? (
              <TableSkeleton rows={6} cols={TABLE_HEADERS.length} hasAvatar={true} />
            ) : payrolls.length > 0 ? (
              payrolls.map((record, index) => {
                const isTopRows = index < 3;
                const emp = record.employee || {};
                const row = getRowData(record, gridEdits);
                const isDirty = dirtyRowIds.has(record._id);
                const isSaving = savingGridId === record._id;

                return (
                  <tr
                    key={record._id}
                    className={`transition-all duration-200 ${isDirty ? "bg-amber-50/60" : "hover:bg-sky-50/40"
                      }`}
                  >
                    {/* Employee */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 font-bold text-white text-sm shadow-xs">
                          {emp.name?.charAt(0) || "E"}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-slate-800 text-sm whitespace-nowrap">
                              {emp.name || "—"}
                            </p>
                            {isDirty && (
                              <span className="h-2 w-2 rounded-full bg-amber-500" title="Unsaved edits" />
                            )}
                          </div>
                          <p className="text-xs text-slate-400">{emp.employeeId || "—"}</p>
                        </div>
                      </div>
                    </td>

                    {/* Dept */}
                    <td className="px-3 py-3 text-xs font-medium text-slate-600 whitespace-nowrap">
                      {emp.department || "—"}
                    </td>

                    {/* Basic Input */}
                    <td className="p-1.5 text-right">
                      <input
                        type="number"
                        min="0"
                        value={row.basicSalary}
                        onChange={(e) => onGridCellChange(record._id, "basicSalary", e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 text-right text-xs font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-emerald-50/40 focus:ring-2 focus:ring-emerald-200"
                      />
                    </td>

                    {/* HRA Input */}
                    <td className="p-1.5 text-right">
                      <input
                        type="number"
                        min="0"
                        value={row.hra}
                        onChange={(e) => onGridCellChange(record._id, "hra", e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 text-right text-xs font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-emerald-50/40 focus:ring-2 focus:ring-emerald-200"
                      />
                    </td>

                    {/* Special Allowance Input */}
                    <td className="p-1.5 text-right">
                      <input
                        type="number"
                        min="0"
                        value={row.specialAllowance}
                        onChange={(e) => onGridCellChange(record._id, "specialAllowance", e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 text-right text-xs font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-emerald-50/40 focus:ring-2 focus:ring-emerald-200"
                      />
                    </td>

                    {/* Overtime Input */}
                    <td className="p-1.5 text-right">
                      <input
                        type="number"
                        min="0"
                        value={row.overtimePay}
                        onChange={(e) => onGridCellChange(record._id, "overtimePay", e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 text-right text-xs font-semibold text-blue-700 outline-none transition focus:border-blue-500 focus:bg-blue-50/40 focus:ring-2 focus:ring-blue-200"
                      />
                    </td>

                    {/* Bonus Input */}
                    <td className="p-1.5 text-right">
                      <input
                        type="number"
                        min="0"
                        value={row.bonus}
                        onChange={(e) => onGridCellChange(record._id, "bonus", e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 text-right text-xs font-semibold text-violet-700 outline-none transition focus:border-violet-500 focus:bg-violet-50/40 focus:ring-2 focus:ring-violet-200"
                      />
                    </td>

                    {/* Total Earnings (Computed Live) */}
                    <td className="px-3 py-3 text-sm font-bold text-emerald-700 bg-emerald-50/40 whitespace-nowrap text-right">
                      {formatCurrency(row.totalEarnings)}
                    </td>

                    {/* PF Input */}
                    <td className="p-1.5 text-right">
                      <input
                        type="number"
                        min="0"
                        value={row.providentFund}
                        onChange={(e) => onGridCellChange(record._id, "providentFund", e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 text-right text-xs font-semibold text-rose-700 outline-none transition focus:border-rose-500 focus:bg-rose-50/40 focus:ring-2 focus:ring-rose-200"
                      />
                    </td>

                    {/* Professional Tax Input */}
                    <td className="p-1.5 text-right">
                      <input
                        type="number"
                        min="0"
                        value={row.professionalTax}
                        onChange={(e) => onGridCellChange(record._id, "professionalTax", e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1 text-right text-xs font-semibold text-rose-700 outline-none transition focus:border-rose-500 focus:bg-rose-50/40 focus:ring-2 focus:ring-rose-200"
                      />
                    </td>

                    {/* LWP Input */}
                    <td className="p-1.5 text-right">
                      <input
                        type="number"
                        min="0"
                        value={row.lwp}
                        onChange={(e) => onGridCellChange(record._id, "lwp", e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1 text-right text-xs font-semibold text-rose-700 outline-none transition focus:border-rose-500 focus:bg-rose-50/40 focus:ring-2 focus:ring-rose-200"
                      />
                    </td>

                    {/* Total Deductions (Computed Live) */}
                    <td className="px-3 py-3 text-sm font-bold text-rose-600 bg-rose-50/40 whitespace-nowrap text-right">
                      -{formatCurrency(row.totalDeductions)}
                    </td>

                    {/* Net Salary (Computed Live) */}
                    <td className="px-4 py-3 whitespace-nowrap bg-slate-50 text-right">
                      <span className="text-base font-extrabold text-slate-900">
                        {formatCurrency(row.netSalary)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      {record.status === "Paid" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                          <CheckCircle size={12} /> Paid
                        </span>
                      ) : record.status === "Processing" ? (
                        <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
                          Processing
                        </span>
                      ) : record.status === "On Hold" ? (
                        <span className="inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
                          On Hold
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                          Pending
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="relative px-4 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {isDirty && canProcess && (
                          <button
                            onClick={() => onSaveGridRow(record._id)}
                            disabled={isSaving}
                            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition cursor-pointer"
                            title="Save edited values for this employee"
                          >
                            {isSaving ? <Loader size={12} className="animate-spin" /> : <Save size={12} />}
                            Save
                          </button>
                        )}

                        <button
                          onClick={() => setShowAction(showAction === record._id ? null : record._id)}
                          className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>

                      {showAction === record._id && (
                        <>
                          <div
                            className="fixed inset-0 z-20 cursor-default"
                            onClick={() => setShowAction(null)}
                          />
                          <div
                            className={`absolute right-5 ${isTopRows ? "top-12" : "bottom-12"
                              } z-30 w-48 rounded-2xl border border-slate-200/80 bg-white p-2 text-left shadow-xl animate-in fade-in zoom-in-95 duration-100`}
                          >
                            <button
                              onClick={() => {
                                onSelectRecord(record);
                                setShowAction(null);
                              }}
                              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-600 transition-colors cursor-pointer"
                            >
                              <Eye size={14} /> View Details
                            </button>
                            {canDownload && (
                              <button
                                onClick={() => {
                                  onSelectPayslipRecord(record);
                                  setShowAction(null);
                                }}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-600 transition-colors cursor-pointer"
                              >
                                <Download size={14} /> Payslip / Print
                              </button>
                            )}
                            <button
                              onClick={() => {
                                const empId = record.employee?._id || record.employee;
                                const empName = record.employee?.name || "Employee";
                                onViewReport(empId, empName);
                                setShowAction(null);
                              }}
                              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-600 transition-colors cursor-pointer"
                            >
                              <Calendar size={14} /> Attendance Report
                            </button>

                            {canApprove && (
                              <>
                                <div className="my-1 border-t border-slate-100" />
                                <div className="px-3 py-1 text-[10px] font-bold uppercase text-slate-400">
                                  Set Status
                                </div>

                                {record.status !== "Paid" && (
                                  <button
                                    onClick={() => onStatusChange(record._id, "Paid")}
                                    disabled={statusUpdatingId === record._id}
                                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                                  >
                                    <CheckCircle size={13} /> Mark as Paid
                                  </button>
                                )}

                                {record.status !== "Processing" && (
                                  <button
                                    onClick={() => onStatusChange(record._id, "Processing")}
                                    disabled={statusUpdatingId === record._id}
                                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                  >
                                    <Clock3 size={13} /> Mark Processing
                                  </button>
                                )}

                                {record.status !== "Pending" && (
                                  <button
                                    onClick={() => onStatusChange(record._id, "Pending")}
                                    disabled={statusUpdatingId === record._id}
                                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                                  >
                                    <Clock3 size={13} /> Mark Pending
                                  </button>
                                )}
                              </>
                            )}

                            {(isAdmin || canDelete) && (
                              <>
                                <div className="my-1 border-t border-slate-100" />
                                <button
                                  onClick={() => onDeleteRecord(record._id)}
                                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                >
                                  <Trash2 size={13} /> Delete Record
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="15" className="px-5 py-16 text-center">
                  <Briefcase size={36} className="mx-auto mb-3 text-slate-200" />
                  <p className="font-semibold text-slate-600">No payroll records found</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Generate payroll for {filterMonth} {filterYear} to calculate salaries.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="divide-y divide-slate-100 lg:hidden">
        {loading ? (
          <div className="space-y-4 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-slate-200 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 w-28 bg-slate-200 rounded" />
                    <div className="h-2.5 w-36 bg-slate-100 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : payrolls.length > 0 ? (
          payrolls.map((record) => {
            const e = earnings(record);
            const d = deductions(record);
            const emp = record.employee || {};
            return (
              <div key={record._id} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 font-bold text-white shadow-xs">
                      {emp.name?.charAt(0) || "E"}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{emp.name || "—"}</p>
                      <p className="text-xs text-slate-400">{emp.employeeId} · {emp.department}</p>
                    </div>
                  </div>

                  {record.status === "Paid" ? (
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Paid
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700">
                      Pending
                    </span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                  <div className="rounded-xl bg-emerald-50/60 p-2.5 border border-emerald-100">
                    <p className="text-slate-400 mb-0.5">Basic</p>
                    <p className="font-bold text-slate-700">{formatCurrency(e.basicSalary)}</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50/60 p-2.5 border border-emerald-100">
                    <p className="text-slate-400 mb-0.5">Earnings</p>
                    <p className="font-bold text-emerald-700">{formatCurrency(e.totalEarnings)}</p>
                  </div>
                  <div className="rounded-xl bg-rose-50/60 p-2.5 border border-rose-100">
                    <p className="text-slate-400 mb-0.5">Deductions</p>
                    <p className="font-bold text-rose-600">-{formatCurrency(d.totalDeductions)}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                  <span className="text-xs font-semibold text-slate-500">Net Salary</span>
                  <span className="text-lg font-extrabold text-slate-900">{formatCurrency(record.netSalary)}</span>
                </div>

                <div className={`mt-3 grid gap-2 ${canDownload ? "grid-cols-2" : "grid-cols-1"}`}>
                  <button
                    onClick={() => onSelectRecord(record)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <Eye size={14} /> Details
                  </button>
                  {canDownload && (
                    <button
                      onClick={() => onSelectPayslipRecord(record)}
                      className="flex items-center justify-center gap-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 py-2.5 text-xs font-semibold hover:bg-sky-100 transition-colors cursor-pointer"
                    >
                      <Download size={14} /> Payslip
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="px-5 py-12 text-center">
            <p className="font-semibold text-slate-600">No payroll records found</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-4">
        <p className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-700">{payrolls.length}</span> records
        </p>
      </div>
    </div>
  );
};

export default React.memo(PayrollTable);
