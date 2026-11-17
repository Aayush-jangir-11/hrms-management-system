import React from "react";
import { X, Loader, Plus } from "lucide-react";
import { MONTHS, currentYear } from "./PayslipModal";

const GeneratePayrollModal = ({
  show,
  onClose,
  genMonth,
  setGenMonth,
  genYear,
  setGenYear,
  genBonus,
  setGenBonus,
  genRemarks,
  setGenRemarks,
  onGenerate,
  generating,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Generate Payroll</h2>
            <p className="mt-0.5 text-xs text-slate-500 font-medium">
              Calculate and create payroll for all active employees
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {/* Month */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Payroll Month
            </label>
            <select
              value={genMonth}
              onChange={(e) => setGenMonth(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all cursor-pointer"
            >
              {MONTHS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Year
            </label>
            <select
              value={genYear}
              onChange={(e) => setGenYear(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all cursor-pointer"
            >
              {Array.from({ length: 25 }, (_, i) => currentYear - 5 + i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Bonus */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Bonus (Optional)
            </label>
            <input
              type="number"
              min="0"
              value={genBonus}
              onChange={(e) => setGenBonus(e.target.value)}
              placeholder="e.g. 5000"
              className={`w-full rounded-xl border px-4 py-2.5 text-sm font-medium outline-none transition-all ${
                Number(genBonus) < 0
                  ? "border-rose-400 bg-rose-50/40 text-rose-900 focus:ring-2 focus:ring-rose-200"
                  : "border-slate-200 text-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              }`}
            />
            {Number(genBonus) < 0 && (
              <p className="mt-1 text-[11px] font-bold text-rose-600 flex items-center gap-1">
                <span>⚠️</span> Bonus cannot be a negative number.
              </p>
            )}
          </div>

          {/* Remarks */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Remarks (Optional)
            </label>
            <input
              type="text"
              value={genRemarks}
              onChange={(e) => setGenRemarks(e.target.value)}
              placeholder="e.g. Festival bonus included"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
            />
          </div>

          {/* Info box */}
          <div className="rounded-xl bg-sky-50/80 border border-sky-100 p-4 text-xs text-sky-800">
            <p className="font-bold mb-1">What this does:</p>
            <ul className="space-y-0.5 list-disc list-inside text-sky-700 font-medium">
              <li>Calculates Basic (50%), HRA (20%), Special Allowance</li>
              <li>Applies PF (12% of basic, max ₹1800) &amp; Professional Tax</li>
              <li>Deducts LWP based on unpaid/sandwiched leaves</li>
              <li>Adds overtime pay from attendance records</li>
              <li>Shift hours sourced from active Working Policy</li>
            </ul>
          </div>

          <button
            onClick={onGenerate}
            disabled={generating || Number(genBonus) < 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 py-3 text-sm font-bold text-white shadow-md shadow-blue-200 transition hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {generating ? (
              <>
                <Loader size={16} className="animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Plus size={16} /> Generate Payroll
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(GeneratePayrollModal);
