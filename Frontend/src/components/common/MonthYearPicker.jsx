import React, { useState, useEffect, useRef } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MonthYearPicker = ({
  selectedMonth,
  selectedYear,
  onSelect,
  label = "Payroll Month",
  className = "",
}) => {
  const currentRealYear = new Date().getFullYear();
  const currentRealMonth = MONTHS[new Date().getMonth()];

  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(Number(selectedYear) || currentRealYear);
  const containerRef = useRef(null);

  // Sync viewYear when selectedYear changes or modal opens
  useEffect(() => {
    if (selectedYear) {
      setViewYear(Number(selectedYear));
    }
  }, [selectedYear, isOpen]);

  // Handle click outside to close popover
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (m) => {
    if (onSelect) {
      onSelect(m, String(viewYear));
    }
    setIsOpen(false);
  };

  const handleJumpToCurrent = (e) => {
    e.stopPropagation();
    setViewYear(currentRealYear);
    if (onSelect) {
      onSelect(currentRealMonth, String(currentRealYear));
    }
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* Calendar Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center gap-3 rounded-xl border bg-white px-3.5 py-2 text-left shadow-sm transition-all duration-200 hover:border-blue-400 hover:shadow-md ${
          isOpen
            ? "border-blue-500 ring-2 ring-blue-500/20 shadow-blue-500/10"
            : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
          <CalendarDays size={16} />
        </div>
        <div className="flex flex-col">
          {label && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {label}
            </span>
          )}
          <span className="text-xs font-bold text-slate-800">
            {selectedMonth} {selectedYear}
          </span>
        </div>
        <ChevronDown
          size={15}
          className={`ml-1 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-blue-600" : "group-hover:text-slate-600"
          }`}
        />
      </button>

      {/* Calendar Popover */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 origin-top-right animate-in fade-in zoom-in-95 duration-150 rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl ring-1 ring-black/5">
          {/* Popover Header: Year Switcher & Current Month button */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setViewYear((prev) => prev - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                title="Previous Year"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 text-sm font-black tracking-tight text-slate-900">
                {viewYear}
              </span>
              <button
                type="button"
                onClick={() => setViewYear((prev) => prev + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                title="Next Year"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleJumpToCurrent}
              className="rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-600 transition-colors hover:bg-blue-100"
            >
              Current
            </button>
          </div>

          {/* 12-Month Calendar Grid */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {MONTHS.map((m, idx) => {
              const isSelected =
                m === selectedMonth && String(viewYear) === String(selectedYear);
              const isCurrentRealMonth =
                m === currentRealMonth && viewYear === currentRealYear;
              const shortName = m.slice(0, 3);

              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleSelect(m)}
                  className={`group relative flex flex-col items-center justify-center rounded-xl py-2.5 text-xs font-semibold transition-all duration-150 ${
                    isSelected
                      ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-500/25 ring-2 ring-blue-500"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span className="text-xs font-bold">{shortName}</span>
                  <span
                    className={`text-[9px] ${
                      isSelected
                        ? "text-blue-100"
                        : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>

                  {/* Indicator dot for real current month */}
                  {isCurrentRealMonth && !isSelected && (
                    <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-blue-600" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Popover Footer Info */}
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-400">
            <span>
              Selected: {selectedMonth} {selectedYear}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="font-medium text-slate-500 hover:text-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthYearPicker;
