import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Clock,
  CheckCircle2,
  Circle,
  Trash2,
  Sparkles,
  Tag,
  Bell,
  Briefcase,
  Coffee,
  Check,
  Calendar as CalendarIcon,
  Filter,
} from "lucide-react";

/**
 * Default Seed Events based on portal type and date
 */
const getDefaultEvents = (portalType, year, month) => {
  const pad = (n) => String(n).padStart(2, "0");
  const prefix = `${year}-${pad(month + 1)}`;

  if (portalType === "admin") {
    return [
      {
        id: "ev-adm-1",
        date: `${prefix}-05`,
        title: "Executive Board Quarterly Review",
        time: "10:30 AM",
        category: "Meeting",
        priority: "High",
        completed: false,
        note: "Review overall corporate KPIs, budgets, and headcount goals.",
      },
      {
        id: "ev-adm-2",
        date: `${prefix}-12`,
        title: "HR & Department Heads Sync",
        time: "02:00 PM",
        category: "Meeting",
        priority: "Medium",
        completed: true,
        note: "Evaluate quarterly promotions, department budget expansions.",
      },
      {
        id: "ev-adm-3",
        date: `${prefix}-20`,
        title: "System Security & Compliance Audit",
        time: "04:00 PM",
        category: "Task",
        priority: "High",
        completed: false,
        note: "Verify cloud backups, database security policies and access logs.",
      },
      {
        id: "ev-adm-4",
        date: `${prefix}-28`,
        title: "Monthly Payroll Approval Deadline",
        time: "05:00 PM",
        category: "Reminder",
        priority: "Urgent",
        completed: false,
        note: "Final sign-off on organization-wide payroll disbursement.",
      },
    ];
  }

  if (portalType === "hr") {
    return [
      {
        id: "ev-hr-1",
        date: `${prefix}-03`,
        title: "New Employee Onboarding Batch",
        time: "09:30 AM",
        category: "Shift Note",
        priority: "Medium",
        completed: true,
        note: "Induction session for new joiners in Engineering & Sales.",
      },
      {
        id: "ev-hr-2",
        date: `${prefix}-10`,
        title: "Attendance & Overtime Verification",
        time: "11:00 AM",
        category: "Task",
        priority: "High",
        completed: false,
        note: "Reconcile punch logs and approve monthly overtime hours.",
      },
      {
        id: "ev-hr-3",
        date: `${prefix}-18`,
        title: "Company Wellness & Team Event",
        time: "03:30 PM",
        category: "Holiday",
        priority: "Low",
        completed: false,
        note: "Virtual team trivia and quarterly award announcements.",
      },
      {
        id: "ev-hr-4",
        date: `${prefix}-25`,
        title: "Payroll Computation & Tax Filing Cutoff",
        time: "04:00 PM",
        category: "Reminder",
        priority: "Urgent",
        completed: false,
        note: "Generate pay slips and lock payroll changes for this month.",
      },
    ];
  }

  // Employee Portal Default Events
  return [
    {
      id: "ev-emp-1",
      date: `${prefix}-02`,
      title: "Daily Standup & Sprint Planning",
      time: "10:00 AM",
      category: "Meeting",
      priority: "Medium",
      completed: true,
      note: "Sprint goals alignment and backlog grooming with team lead.",
    },
    {
      id: "ev-emp-2",
      date: `${prefix}-09`,
      title: "Submit Bi-Weekly Project Milestone",
      time: "05:00 PM",
      category: "Task",
      priority: "High",
      completed: false,
      note: "Commit code and push release branch for staging deployment.",
    },
    {
      id: "ev-emp-3",
      date: `${prefix}-15`,
      title: "Leave / Casual Day Off",
      time: "All Day",
      category: "Holiday",
      priority: "Low",
      completed: false,
      note: "Approved casual leave for personal work.",
    },
    {
      id: "ev-emp-4",
      date: `${prefix}-24`,
      title: "1-on-1 Performance & Mentorship Sync",
      time: "03:00 PM",
      category: "Meeting",
      priority: "Medium",
      completed: false,
      note: "Monthly sync with Engineering Manager.",
    },
  ];
};

/**
 * Universal Phone-Style Calendar Modal for all 3 portals (Admin, HR, Employee)
 */
const CalendarModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  portalType = "employee",
  actionButton,
  footerNote,
}) => {
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [events, setEvents] = useState([]);
  const [filterCategory, setFilterCategory] = useState("All");

  // Inline Add Item Form State
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemTime, setNewItemTime] = useState("10:00 AM");
  const [newItemCategory, setNewItemCategory] = useState("Task");
  const [newItemPriority, setNewItemPriority] = useState("Medium");
  const [newItemNote, setNewItemNote] = useState("");

  const currentYear = calendarDate.getFullYear();
  const currentMonth = calendarDate.getMonth(); // 0 to 11
  const pad = (n) => String(n).padStart(2, "0");

  const storageKey = `hrms_calendar_events_${portalType}`;

  // Load events from localStorage or initialize defaults
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setEvents(JSON.parse(saved));
      } else {
        const defaults = getDefaultEvents(portalType, currentYear, currentMonth);
        setEvents(defaults);
        localStorage.setItem(storageKey, JSON.stringify(defaults));
      }
    } catch (e) {
      console.warn("Calendar load error:", e);
      setEvents(getDefaultEvents(portalType, currentYear, currentMonth));
    }
  }, [portalType, currentYear, currentMonth, storageKey]);

  // Save events helper
  const saveEvents = (updatedList) => {
    setEvents(updatedList);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedList));
    } catch (e) {
      console.warn("Calendar save error:", e);
    }
  };

  if (!isOpen) return null;

  // Selected date key format: YYYY-MM-DD
  const selectedDateKey = selectedDay
    ? `${currentYear}-${pad(currentMonth + 1)}-${pad(selectedDay)}`
    : null;

  const selectedDateObj = selectedDay
    ? new Date(currentYear, currentMonth, selectedDay)
    : null;

  // Calendar Calculation
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Align Monday = 0

  const calDays = [];
  for (let i = 0; i < adjustedFirstDay; i++) {
    calDays.push(null);
  }
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    calDays.push(d);
  }

  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const isPastSelectedDate = selectedDateObj ? selectedDateObj < todayMidnight : false;
  const isCurrentMonth =
    today.getFullYear() === currentYear && today.getMonth() === currentMonth;

  // Handlers for month switcher
  const handlePrevMonth = () => {
    setCalendarDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDay(1);
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDay(1);
  };

  const handleTodayMonth = () => {
    const now = new Date();
    setCalendarDate(now);
    setSelectedDay(now.getDate());
  };

  // Add Item to specific date
  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemTitle.trim() || !selectedDateKey) return;

    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    if (selectedDateKey < todayStr) return;

    const newEvent = {
      id: `ev-${Date.now()}`,
      date: selectedDateKey,
      title: newItemTitle.trim(),
      time: newItemTime || "All Day",
      category: newItemCategory,
      priority: newItemPriority,
      completed: false,
      note: newItemNote.trim(),
    };

    const updated = [newEvent, ...events];
    saveEvents(updated);

    // Reset Form
    setNewItemTitle("");
    setNewItemNote("");
    setIsAddingItem(false);
  };

  // Toggle item completion
  const handleToggleComplete = (eventId) => {
    const updated = events.map((ev) =>
      ev.id === eventId ? { ...ev, completed: !ev.completed } : ev
    );
    saveEvents(updated);
  };

  // Delete item
  const handleDeleteItem = (eventId) => {
    const updated = events.filter((ev) => ev.id !== eventId);
    saveEvents(updated);
  };

  // Events on currently selected date
  const selectedDateEvents = events.filter(
    (ev) =>
      ev.date === selectedDateKey &&
      (filterCategory === "All" || ev.category === filterCategory)
  );

  // Dynamic colors by portal
  const theme =
    portalType === "admin"
      ? {
          gradient: "from-purple-600 via-indigo-600 to-sky-600",
          accent: "bg-purple-600",
          ring: "ring-purple-500",
          light: "bg-purple-50 text-purple-700",
        }
      : portalType === "hr"
      ? {
          gradient: "from-sky-500 via-blue-600 to-indigo-600",
          accent: "bg-sky-600",
          ring: "ring-sky-500",
          light: "bg-sky-50 text-sky-700",
        }
      : {
          gradient: "from-teal-500 via-emerald-600 to-sky-600",
          accent: "bg-emerald-600",
          ring: "ring-emerald-500",
          light: "bg-emerald-50 text-emerald-700",
        };

  // Category Color Map
  const getCategoryBadge = (category) => {
    switch (category) {
      case "Meeting":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Task":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Reminder":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Holiday":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getPriorityDot = (priority) => {
    switch (priority) {
      case "Urgent":
        return "bg-rose-500";
      case "High":
        return "bg-amber-500";
      case "Medium":
        return "bg-sky-500";
      default:
        return "bg-emerald-500";
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl rounded-3xl bg-white shadow-2xl border border-slate-100/90 max-h-[92vh] flex flex-col overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Gradient */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${theme.gradient}`}></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${theme.gradient} text-white font-bold shadow-md shadow-sky-500/20`}
            >
              <CalendarDays size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
                  {title ||
                    (portalType === "admin"
                      ? "Master Corporate Calendar"
                      : portalType === "hr"
                      ? "HR Department & Shift Planner"
                      : "My Schedule & Event Calendar")}
                </h3>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700">
                  Phone Calendar Mode
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                {subtitle ||
                  "Tap any date to view, schedule, and set reminders, tasks, and meetings"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body: Two-Column Responsive Layout */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          
          {/* ================= LEFT: PHONE-LIKE CALENDAR GRID (6 Cols) ================= */}
          <div className="lg:col-span-6 p-5 sm:p-6 space-y-4 bg-slate-50/30">
            {/* Month Switcher Header */}
            <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft size={18} />
                </button>
                <h4 className="text-sm sm:text-base font-black text-slate-800">
                  {calendarDate.toLocaleString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </h4>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <button
                onClick={handleTodayMonth}
                className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Today
              </button>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] sm:text-[11px] font-black uppercase text-slate-400">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Days Matrix */}
            <div className="grid grid-cols-7 gap-1.5">
              {calDays.map((dayNum, idx) => {
                if (!dayNum) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="h-10 sm:h-12 rounded-2xl bg-slate-100/30"
                    />
                  );
                }

                const thisDateKey = `${currentYear}-${pad(currentMonth + 1)}-${pad(dayNum)}`;
                const dayEvents = events.filter((ev) => ev.date === thisDateKey);
                const hasEvents = dayEvents.length > 0;
                const isSelected = selectedDay === dayNum;
                const isToday = isCurrentMonth && today.getDate() === dayNum;

                const dateObj = new Date(currentYear, currentMonth, dayNum);
                const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => {
                      setSelectedDay(dayNum);
                      setIsAddingItem(false);
                    }}
                    className={`h-10 sm:h-12 p-1 rounded-2xl border text-center flex flex-col items-center justify-between transition-all cursor-pointer relative ${
                      isSelected
                        ? `bg-gradient-to-br ${theme.gradient} text-white font-black shadow-md ring-2 ${theme.ring}`
                        : isToday
                        ? "border-sky-400 bg-sky-50/70 text-sky-700 font-extrabold shadow-xs"
                        : isWeekend
                        ? "border-slate-100 bg-slate-100/50 text-slate-400 hover:bg-white"
                        : "border-slate-200/70 bg-white hover:border-sky-300 hover:bg-sky-50/30 text-slate-700 shadow-xs"
                    }`}
                  >
                    <span className="text-xs sm:text-sm font-bold leading-tight">
                      {dayNum}
                    </span>

                    {/* Date Indicator Dots (Phone Calendar Style) */}
                    <div className="flex items-center justify-center gap-0.5 mb-0.5">
                      {hasEvents &&
                        dayEvents.slice(0, 3).map((ev, i) => (
                          <span
                            key={i}
                            className={`h-1 w-1 rounded-full ${
                              isSelected
                                ? "bg-white"
                                : ev.category === "Meeting"
                                ? "bg-blue-500"
                                : ev.category === "Task"
                                ? "bg-purple-500"
                                : ev.category === "Reminder"
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                          />
                        ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Legend Info */}
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span> Meeting
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-purple-500"></span> Task
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500"></span> Reminder
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Holiday
              </span>
            </div>
          </div>

          {/* ================= RIGHT: DATE AGENDA & SET THINGS (6 Cols) ================= */}
          <div className="lg:col-span-6 p-5 sm:p-6 flex flex-col justify-between space-y-4 bg-white">
            
            {/* Selected Date Header */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-sm sm:text-base font-black text-slate-800 flex items-center gap-2">
                    <CalendarIcon size={17} className="text-sky-600" />
                    {selectedDateObj
                      ? selectedDateObj.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Select a Date"}
                  </h4>
                  <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                    {selectedDateEvents.length} items scheduled for this day
                  </p>
                </div>

                {!isPastSelectedDate && (
                  <button
                    type="button"
                    onClick={() => setIsAddingItem(!isAddingItem)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                      isAddingItem
                        ? "bg-slate-200 text-slate-700"
                        : `bg-gradient-to-r ${theme.gradient} text-white`
                    }`}
                  >
                    {isAddingItem ? (
                      <>
                        <X size={13} /> Cancel
                      </>
                    ) : (
                      <>
                        <Plus size={14} /> Set for Date
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 text-xs">
                {["All", "Meeting", "Task", "Reminder", "Holiday"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFilterCategory(cat)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer shrink-0 ${
                      filterCategory === cat
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* ================= INLINE FORM: SET THINGS FOR SPECIFIC DATE ================= */}
            {isAddingItem && (
              <form
                onSubmit={handleAddItem}
                className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80 space-y-3 animate-scale-up"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
                    <Sparkles size={14} /> Schedule on {selectedDay} {calendarDate.toLocaleString("en-US", { month: "short" })}
                  </span>
                  <span className="text-[10px] font-bold text-sky-600">Specific Date Event</span>
                </div>

                {/* Title Input */}
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Event title, meeting or deliverable..."
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    className="w-full rounded-xl border border-sky-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>

                {/* Meta Inputs: Category, Time, Priority */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Category</label>
                    <select
                      value={newItemCategory}
                      onChange={(e) => setNewItemCategory(e.target.value)}
                      className="w-full rounded-xl border border-sky-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                    >
                      <option value="Task">Task</option>
                      <option value="Meeting">Meeting</option>
                      <option value="Reminder">Reminder</option>
                      <option value="Shift Note">Shift Note</option>
                      <option value="Holiday">Holiday</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Time Slot</label>
                    <input
                      type="text"
                      placeholder="e.g. 11:30 AM"
                      value={newItemTime}
                      onChange={(e) => setNewItemTime(e.target.value)}
                      className="w-full rounded-xl border border-sky-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-700 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Priority</label>
                    <select
                      value={newItemPriority}
                      onChange={(e) => setNewItemPriority(e.target.value)}
                      className="w-full rounded-xl border border-sky-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Optional Note */}
                <div>
                  <input
                    type="text"
                    placeholder="Short description or notes (optional)..."
                    value={newItemNote}
                    onChange={(e) => setNewItemNote(e.target.value)}
                    className="w-full rounded-xl border border-sky-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 outline-none"
                  />
                </div>

                {/* Submit button */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingItem(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r ${theme.gradient} text-white shadow-md cursor-pointer`}
                  >
                    Save to Date
                  </button>
                </div>
              </form>
            )}

            {/* ================= LIST OF SCHEDULED ITEMS FOR THE DATE ================= */}
            <div className="flex-1 overflow-y-auto max-h-[260px] space-y-2.5 pr-1">
              {selectedDateEvents.length === 0 ? (
                <div className="py-8 text-center flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                    <Coffee size={20} />
                  </div>
                  <p className="text-xs font-bold text-slate-700">No scheduled items for this date</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
                    Click "Set for Date" above to add meetings, shift notes, deliverables or reminders.
                  </p>
                </div>
              ) : (
                selectedDateEvents.map((item) => (
                  <div
                    key={item.id}
                    className={`group p-3 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      item.completed
                        ? "bg-slate-50/80 border-slate-200 opacity-60"
                        : "bg-white border-slate-200/90 hover:border-sky-300 hover:shadow-xs"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      {/* Check off toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleComplete(item.id)}
                        className={`mt-0.5 shrink-0 transition cursor-pointer ${
                          item.completed ? "text-emerald-600" : "text-slate-400 hover:text-sky-600"
                        }`}
                        title={item.completed ? "Mark Incomplete" : "Mark Completed"}
                      >
                        {item.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-xs font-bold truncate ${
                              item.completed ? "line-through text-slate-500" : "text-slate-800"
                            }`}
                          >
                            {item.title}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryBadge(
                              item.category
                            )}`}
                          >
                            {item.category}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mt-1 text-[11px] font-semibold text-slate-400">
                          <span className="flex items-center gap-1 text-slate-600">
                            <Clock size={12} /> {item.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className={`h-1.5 w-1.5 rounded-full ${getPriorityDot(item.priority)}`} />
                            {item.priority}
                          </span>
                        </div>

                        {item.note && (
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {item.note}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Delete item button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      title="Delete item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Modal Bottom Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400 font-semibold">
                {footerNote || "Changes automatically synced across your sessions"}
              </span>

              <button
                onClick={onClose}
                className="px-5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default CalendarModal;
