import React from "react";
import { Sparkles, RotateCw, Search, CalendarDays } from "lucide-react";
import StatCard from "../../common/StatCard";

// ── 1. Hero Section ──
export const AttendanceHero = ({ onRefresh, loading }) => {
  return (
    <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-200/50 md:p-8">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-20 right-32 h-56 w-56 rounded-full bg-indigo-400/20 blur-xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 text-xs font-semibold backdrop-blur-md border border-white/20">
            <Sparkles size={14} className="text-sky-200" />
            <span className="tracking-wide">HR Security &amp; Operations</span>
          </div>

          <h1 className="text-2xl font-black tracking-tight sm:text-3xl md:text-4xl">
            Attendance &amp; Punch Audit Portal
          </h1>

          <p className="max-w-xl text-xs font-medium text-sky-100 sm:text-sm leading-relaxed">
            Monitor daily clock-in records, audit raw punch logs, and view complete monthly employee attendance history.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-4.5 py-3 text-xs font-bold text-white shadow-lg backdrop-blur-md border border-white/20 transition hover:bg-white/25 active:scale-95 cursor-pointer shrink-0 disabled:opacity-60"
        >
          <RotateCw size={16} className={loading ? "animate-spin" : ""} />
          <span>Refresh Audit Logs</span>
        </button>
      </div>
    </div>
  );
};

// ── 2. KPI Stats Grid ──
export const AttendanceStatsGrid = ({ stats }) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, idx) => (
        <StatCard key={idx} {...stat} />
      ))}
    </div>
  );
};

// ── 3. Filters & Search Toolbar ──
export const AttendanceToolbar = ({
  searchTerm,
  onSearchChange,
  filterDate,
  onDateChange,
  onClearDate,
  filterDept,
  onDeptChange,
  departments,
  filterStatus,
  onStatusChange,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search Box */}
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search by Employee name, ID, or email..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-11 pr-4 text-xs font-bold text-slate-800 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Filter */}
          <div className="relative flex items-center">
            <CalendarDays
              size={16}
              className="absolute left-3 text-slate-400 pointer-events-none"
            />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-3 text-xs font-bold text-slate-700 outline-none transition focus:border-sky-500 focus:bg-white cursor-pointer"
            />
            {filterDate && (
              <button
                onClick={onClearDate}
                className="ml-1 text-xs text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
                title="Clear Date"
              >
                Clear
              </button>
            )}
          </div>

          {/* Department Filter */}
          <div className="relative">
            <select
              value={filterDept}
              onChange={(e) => onDeptChange(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-4 text-xs font-bold text-slate-700 outline-none transition focus:border-sky-500 focus:bg-white cursor-pointer"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === "All" ? "All Departments" : dept}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-4 text-xs font-bold text-slate-700 outline-none transition focus:border-sky-500 focus:bg-white cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Half Day">Half Day</option>
              <option value="On Leave">On Leave</option>
              <option value="Absent">Absent</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Combined Header Component ──
const AttendanceHeader = ({
  onRefresh,
  loading,
  stats,
  searchTerm,
  onSearchChange,
  filterDate,
  onDateChange,
  onClearDate,
  filterDept,
  onDeptChange,
  departments,
  filterStatus,
  onStatusChange,
}) => {
  return (
    <div className="space-y-6">
      <AttendanceHero onRefresh={onRefresh} loading={loading} />
      <AttendanceStatsGrid stats={stats} />
      <AttendanceToolbar
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        filterDate={filterDate}
        onDateChange={onDateChange}
        onClearDate={onClearDate}
        filterDept={filterDept}
        onDeptChange={onDeptChange}
        departments={departments}
        filterStatus={filterStatus}
        onStatusChange={onStatusChange}
      />
    </div>
  );
};

export default AttendanceHeader;
