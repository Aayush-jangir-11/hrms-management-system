import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Sparkles,
  Loader,
  Info,
} from "lucide-react";
import API from "../../services/api";

const DashboardCalendar = ({ isOpen, onClose, portalType = "employee" }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [events, setEvents] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all"); // 'all', 'leaves', 'events', 'holidays'

  // Fetch data when modal opens or portalType changes
  useEffect(() => {
    if (isOpen) {
      fetchAllData();
    }
  }, [isOpen, portalType]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Leaves based on portalType
      const leaveEndpoint =
        portalType === "employee" ? "/leave/my-leaves" : "/leave/all";

      const [leaveRes, calendarRes] = await Promise.allSettled([
        API.get(leaveEndpoint),
        API.get(`/calendar?portalType=${portalType}`),
      ]);

      if (leaveRes.status === "fulfilled" && leaveRes.value.data?.success) {
        setLeaves(leaveRes.value.data.data || []);
      } else {
        setLeaves([]);
      }

      if (calendarRes.status === "fulfilled" && calendarRes.value.data?.success) {
        setEvents(calendarRes.value.data.data || []);
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.error("Error fetching dashboard calendar data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format date string to YYYY-MM-DD local
  const formatDateKey = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Calculate calendar grid days for current month view
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun, 1 = Mon...
  const totalDays = lastDayOfMonth.getDate();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(formatDateKey(today));
  };

  // Process data into day map
  // Key: YYYY-MM-DD -> Array of items { type: 'leave' | 'event', ... }
  const itemsByDateMap = useMemo(() => {
    const map = {};

    const addItemToMap = (dateStr, item) => {
      if (!map[dateStr]) {
        map[dateStr] = [];
      }
      map[dateStr].push(item);
    };

    // 1. Process Leaves
    leaves.forEach((leave) => {
      if (!leave.fromDate) return;
      const start = new Date(leave.fromDate);
      const end = leave.toDate ? new Date(leave.toDate) : new Date(leave.fromDate);

      // Normalize time for loop
      const curr = new Date(start);
      curr.setHours(0, 0, 0, 0);
      const endDate = new Date(end);
      endDate.setHours(0, 0, 0, 0);

      // Safeguard against infinite loops (max 60 days range)
      let count = 0;
      while (curr <= endDate && count < 60) {
        const dateKey = formatDateKey(curr);
        addItemToMap(dateKey, {
          id: `leave-${leave._id}-${dateKey}`,
          categoryType: "leave",
          title: `Leave: ${leave.employee?.name || "Employee"}`,
          subtitle: `${leave.leaveType || "Leave"} (${leave.status || "Pending"})`,
          status: leave.status || "Pending",
          leaveType: leave.leaveType || "Leave",
          employeeName: leave.employee?.name || "Employee",
          reason: leave.reason || "No reason provided",
          raw: leave,
        });
        curr.setDate(curr.getDate() + 1);
        count++;
      }
    });

    // 2. Process Calendar Events
    events.forEach((ev) => {
      if (!ev.date) return;
      const dateKey = ev.date; // assuming YYYY-MM-DD
      const cat = ev.category || "Event";

      addItemToMap(dateKey, {
        id: `event-${ev._id}`,
        categoryType: cat.toLowerCase() === "holiday" ? "holiday" : "event",
        title: ev.title,
        subtitle: `${cat} • ${ev.time || "All Day"}`,
        time: ev.time || "All Day",
        category: cat,
        priority: ev.priority || "Medium",
        note: ev.note || "",
        raw: ev,
      });
    });

    return map;
  }, [leaves, events]);

  // Calendar cells generation
  const calendarCells = useMemo(() => {
    const cells = [];

    // Empty padding cells before 1st day of month
    for (let i = 0; i < startingDayOfWeek; i++) {
      cells.push({ isPadding: true, key: `pad-prev-${i}` });
    }

    // Days of current month
    const todayStr = formatDateKey(new Date());

    for (let day = 1; day <= totalDays; day++) {
      const dateObj = new Date(year, month, day);
      const dateKey = formatDateKey(dateObj);
      const dayItems = itemsByDateMap[dateKey] || [];

      cells.push({
        isPadding: false,
        dayNumber: day,
        dateKey,
        isToday: dateKey === todayStr,
        items: dayItems,
      });
    }

    return cells;
  }, [year, month, startingDayOfWeek, totalDays, itemsByDateMap]);

  // Get items for currently selected date
  const selectedDateItems = useMemo(() => {
    let items = itemsByDateMap[selectedDate] || [];

    if (activeFilter === "leaves") {
      items = items.filter((i) => i.categoryType === "leave");
    } else if (activeFilter === "events") {
      items = items.filter((i) => i.categoryType === "event");
    } else if (activeFilter === "holidays") {
      items = items.filter((i) => i.categoryType === "holiday");
    }

    return items;
  }, [itemsByDateMap, selectedDate, activeFilter]);

  // Overall counts for month header summary
  const monthSummary = useMemo(() => {
    let leaveCount = 0;
    let eventCount = 0;
    let holidayCount = 0;

    // Check all dates in current month prefix
    const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;

    Object.keys(itemsByDateMap).forEach((dateKey) => {
      if (dateKey.startsWith(monthPrefix)) {
        const items = itemsByDateMap[dateKey];
        items.forEach((item) => {
          if (item.categoryType === "leave") leaveCount++;
          else if (item.categoryType === "holiday") holidayCount++;
          else eventCount++;
        });
      }
    });

    return { leaveCount, eventCount, holidayCount };
  }, [itemsByDateMap, year, month]);

  if (!isOpen) return null;

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const portalHeaderGradients = {
    admin: "bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-700",
    hr: "bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600",
    employee: "bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-700",
  };

  const headerGradient = portalHeaderGradients[portalType] || portalHeaderGradients.employee;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-5 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-100">
        {/* =========================================
            HEADER (VIEW ONLY BANNER)
        ========================================= */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 ${headerGradient} px-6 py-5 text-white shadow-md`}>
          <div className="flex items-center gap-3 mb-3 sm:mb-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-white border border-white/20 backdrop-blur-md shadow-sm">
              <CalendarIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {monthNames[month]} {year}
                </h2>
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white border border-white/30 backdrop-blur-md">
                  {portalType === "admin" ? "Admin Portal" : portalType === "hr" ? "HR Portal" : "Employee Portal"}
                </span>
                <span className="rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-200 border border-emerald-300/30 backdrop-blur-md">
                  View-Only
                </span>
              </div>
              <p className="text-xs text-white/80 mt-0.5 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-white/90" />
                Scheduled leaves, upcoming company events & holidays
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick stats pills */}
            <div className="hidden md:flex items-center gap-2 text-xs bg-white/10 p-1.5 rounded-lg border border-white/10">
              <div className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-200 font-medium border border-amber-400/20">
                Leaves: <span className="font-bold">{monthSummary.leaveCount}</span>
              </div>
              <div className="px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-200 font-medium border border-indigo-400/20">
                Events: <span className="font-bold">{monthSummary.eventCount}</span>
              </div>
              <div className="px-2.5 py-1 rounded bg-purple-500/20 text-purple-200 font-medium border border-purple-400/20">
                Holidays: <span className="font-bold">{monthSummary.holidayCount}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
              title="Close Calendar"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* =========================================
            MAIN BODY (GRID + DETAILS PANEL)
        ========================================= */}
        <div className="flex flex-1 flex-col lg:flex-row overflow-hidden bg-slate-50/50">
          {/* LEFT: CALENDAR GRID */}
          <div className="flex-1 flex flex-col p-5 border-r border-slate-200/80 bg-white overflow-y-auto">
            {/* Navigation & Controls */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                  title="Previous Month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={handleToday}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                  title="Next Month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Loader indicator */}
              {loading && (
                <div className="flex items-center gap-2 text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                  <Loader className="h-3.5 w-3.5 animate-spin" />
                  Syncing backend events...
                </div>
              )}
            </div>

            {/* Weekday Labels Header */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
                <div
                  key={day}
                  className={`text-xs font-bold py-1.5 ${idx === 0 || idx === 6 ? "text-slate-400" : "text-slate-600"
                    }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Month Grid */}
            <div className="grid grid-cols-7 gap-1.5 flex-1 min-h-[300px]">
              {calendarCells.map((cell, idx) => {
                if (cell.isPadding) {
                  return (
                    <div
                      key={cell.key}
                      className="rounded-xl border border-dashed border-slate-100 bg-slate-50/50 p-2 min-h-[64px]"
                    />
                  );
                }

                const isSelected = cell.dateKey === selectedDate;
                const hasLeaves = cell.items.some(
                  (i) => i.categoryType === "leave"
                );
                const hasEvents = cell.items.some(
                  (i) => i.categoryType === "event"
                );
                const hasHolidays = cell.items.some(
                  (i) => i.categoryType === "holiday"
                );

                return (
                  <button
                    key={cell.dateKey}
                    onClick={() => setSelectedDate(cell.dateKey)}
                    className={`group relative flex flex-col justify-between rounded-xl p-2 min-h-[64px] transition-all text-left border ${isSelected
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-200"
                        : cell.isToday
                          ? "bg-indigo-50 text-indigo-900 border-indigo-200 font-semibold"
                          : "bg-white text-slate-700 border-slate-200/80 hover:border-indigo-300 hover:bg-slate-50"
                      }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-bold ${isSelected
                            ? "text-white"
                            : cell.isToday
                              ? "text-indigo-600"
                              : "text-slate-700"
                          }`}
                      >
                        {cell.dayNumber}
                      </span>

                      {cell.isToday && !isSelected && (
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                      )}
                    </div>

                    {/* Indicator Dots / Badges */}
                    {cell.items.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {hasLeaves && (
                          <span
                            className={`h-2 w-2 rounded-full ${isSelected ? "bg-amber-300" : "bg-amber-500"
                              }`}
                            title="Scheduled Leave"
                          />
                        )}
                        {hasEvents && (
                          <span
                            className={`h-2 w-2 rounded-full ${isSelected ? "bg-cyan-200" : "bg-indigo-500"
                              }`}
                            title="Scheduled Event / Task"
                          />
                        )}
                        {hasHolidays && (
                          <span
                            className={`h-2 w-2 rounded-full ${isSelected ? "bg-purple-200" : "bg-purple-500"
                              }`}
                            title="Company Holiday"
                          />
                        )}
                        {cell.items.length > 3 && (
                          <span
                            className={`text-[9px] font-bold leading-none ${isSelected ? "text-indigo-100" : "text-slate-400"
                              }`}
                          >
                            +{cell.items.length}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Legend:</span>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span>Leaves</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                <span>Events & Meetings</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                <span>Holidays</span>
              </div>
            </div>
          </div>

          {/* RIGHT: DETAILS PANEL FOR SELECTED DATE */}
          <div className="w-full lg:w-96 flex flex-col bg-slate-50 p-5 overflow-y-auto border-t lg:border-t-0 lg:border-l border-slate-200/80">
            {/* Selected Date Header */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Details for Date
                </h3>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                  {selectedDate}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                  "en-US",
                  { weekday: "long", month: "long", day: "numeric", year: "numeric" }
                )}
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 mb-4 p-1 bg-white rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setActiveFilter("all")}
                className={`flex-1 py-1 px-2 rounded-md font-medium transition-all ${activeFilter === "all"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                All ({itemsByDateMap[selectedDate]?.length || 0})
              </button>
              <button
                onClick={() => setActiveFilter("leaves")}
                className={`py-1 px-2 rounded-md font-medium transition-all ${activeFilter === "leaves"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                Leaves
              </button>
              <button
                onClick={() => setActiveFilter("events")}
                className={`py-1 px-2 rounded-md font-medium transition-all ${activeFilter === "events"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                Events
              </button>
            </div>

            {/* Event List */}
            <div className="flex-1 space-y-3 min-h-[220px]">
              {selectedDateItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center p-4 bg-white rounded-xl border border-dashed border-slate-200">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                    <CalendarIcon className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-600">
                    No scheduled items on this date
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                    Select another date on the calendar to view leaves or company events.
                  </p>
                </div>
              ) : (
                selectedDateItems.map((item) => {
                  const isLeave = item.categoryType === "leave";
                  const isHoliday = item.categoryType === "holiday";

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl bg-white border shadow-sm transition-all hover:shadow-md ${isLeave
                          ? "border-amber-200/80 bg-gradient-to-r from-amber-50/30 to-white"
                          : isHoliday
                            ? "border-purple-200/80 bg-gradient-to-r from-purple-50/30 to-white"
                            : "border-indigo-200/80 bg-gradient-to-r from-indigo-50/30 to-white"
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${isLeave
                                ? "bg-amber-100 text-amber-700"
                                : isHoliday
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-indigo-100 text-indigo-700"
                              }`}
                          >
                            {isLeave ? (
                              <User className="h-3.5 w-3.5" />
                            ) : isHoliday ? (
                              <Sparkles className="h-3.5 w-3.5" />
                            ) : (
                              <Clock className="h-3.5 w-3.5" />
                            )}
                          </span>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">
                              {item.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-medium">
                              {item.subtitle}
                            </p>
                          </div>
                        </div>

                        {/* Status / Category Tag */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${isLeave
                              ? item.status === "Approved"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : item.status === "Rejected"
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              : isHoliday
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : "bg-indigo-50 text-indigo-700 border-indigo-200"
                            }`}
                        >
                          {isLeave ? item.status : item.category || "Event"}
                        </span>
                      </div>

                      {/* Additional detail notes */}
                      {isLeave && (
                        <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600 flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-slate-500">
                            <span className="font-semibold text-slate-700">Reason:</span>{" "}
                            {item.reason}
                          </div>
                          {item.raw?.fromDate && (
                            <div className="text-[10px] text-slate-400">
                              Duration: {new Date(item.raw.fromDate).toLocaleDateString()} -{" "}
                              {new Date(item.raw.toDate || item.raw.fromDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      )}

                      {!isLeave && item.note && (
                        <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                          <span className="font-semibold text-slate-700">Note:</span> {item.note}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* View-only bottom hint */}
            <div className="mt-4 p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-800 flex items-center gap-2">
              <Info className="h-4 w-4 text-indigo-600 shrink-0" />
              <span>
                To submit leave requests, please visit the <strong>Leave</strong> section.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCalendar;
