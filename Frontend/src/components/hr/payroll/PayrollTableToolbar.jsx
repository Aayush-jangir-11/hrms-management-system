import React from "react";
import { Search, Plus, Calculator, FileDown, Save, Loader } from "lucide-react";

const PayrollTableToolbar = ({
  searchTerm,
  setSearchTerm,
  departments,
  filterDept,
  setFilterDept,
  filterStatus,
  setFilterStatus,
  onOpenGenerateModal,
  onAutoCalculateAll,
  onExportCSV,
  onSaveAllGrid,
  savingAllGrid,
  dirtyRowCount,
  can = () => true,
}) => {
  const canProcess = can("process");
  const canDownload = can("download");

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        {/* Search */}
        <div className="relative xl:col-span-2">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, ID or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
          />
        </div>

        {/* Department */}
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 cursor-pointer"
        >
          <option>All Departments</option>
          {departments.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>

        {/* Status */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 cursor-pointer"
        >
          <option>All Status</option>
          <option>Paid</option>
          <option>Pending</option>
          <option>Processing</option>
          <option>On Hold</option>
        </select>

        {/* Generate Button */}
        {canProcess && (
          <button
            onClick={onOpenGenerateModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 cursor-pointer"
            title="Generate Payroll"
          >
            <Plus size={18} />
            Generate Payroll
          </button>
        )}
      </div>

      {/* Excel Quick Controls */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-100 text-xs font-semibold">
        <div className="flex items-center gap-2">
          {canProcess && (
            <button
              onClick={onAutoCalculateAll}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Auto calculate Basic 50%, HRA 20% & PF 12% for all employees"
            >
              <Calculator size={14} className="text-emerald-600" />
              Auto-Calculate 50/20
            </button>
          )}

          {canDownload && (
            <button
              onClick={onExportCSV}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Download payroll spreadsheet CSV"
            >
              <FileDown size={14} className="text-sky-600" />
              Export CSV / Excel
            </button>
          )}

          {canProcess && dirtyRowCount > 0 && (
            <button
              onClick={onSaveAllGrid}
              disabled={savingAllGrid}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50"
              title="Save All Changes"
            >
              {savingAllGrid ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
              Save All Changes ({dirtyRowCount})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(PayrollTableToolbar);
