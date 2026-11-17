import React, { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  CalendarDays,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  Circle,
  Trash2,
  Filter,
  Search,
  Check,
  X,
  Briefcase,
  Coffee,
  RotateCw,
  CheckSquare,
  Sparkles,
  Tag,
  Repeat,
} from "lucide-react";
import StatCard from "./StatCard";
import API from "../../services/api";
import { useDebounce } from "../../hooks/useDebounce";

class CalendarErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("FullCalendar Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <p className="text-sm font-bold text-slate-700">Calendar view encountered a temporary display issue.</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
          >
            Reload Calendar View
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const getTodayStr = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const CalendarPage = ({
  portalType = "employee",
  title = "Calendar & Schedule",
  subtitle = "Monitor and manage events, deadlines, tasks, and team milestones",
}) => {
  const queryClient = useQueryClient();
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [filterCategory, setFilterCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Add Item State
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemTime, setNewItemTime] = useState("All Day");
  const [newItemCategory, setNewItemCategory] = useState("Task");
  const [newItemPriority, setNewItemPriority] = useState("Medium");
  const [newItemRecurrence, setNewItemRecurrence] = useState("NONE");
  const [newItemNote, setNewItemNote] = useState("");
  const [pastDateError, setPastDateError] = useState("");

  const currentYear = calendarDate.getFullYear();
  const currentMonth = calendarDate.getMonth(); // 0 to 11
  const pad = (n) => String(n).padStart(2, "0");
  const monthPrefix = `${currentYear}-${pad(currentMonth + 1)}`;

  /* ── TanStack Query: Fetch Calendar Events ── */
  const { data: calRes, isLoading: loading, refetch: fetchEvents } = useQuery({
    queryKey: ["calendar-events", portalType, monthPrefix],
    queryFn: () => API.get(`/calendar?portalType=${portalType}&month=${monthPrefix}`).then(res => res.data),
  });

  const events = useMemo(() => {
    if (calRes?.success && Array.isArray(calRes.data)) {
      return calRes.data.map((item) => ({
        ...item,
        id: item._id || item.id,
      }));
    }
    return [];
  }, [calRes]);

  const calendarRef = useRef(null);

  // Sync FullCalendar view with calendarDate state whenever month/year changes
  useEffect(() => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      const viewDate = api.getDate();
      if (
        viewDate.getFullYear() !== currentYear ||
        viewDate.getMonth() !== currentMonth
      ) {
        api.gotoDate(new Date(currentYear, currentMonth, 1));
      }
    }
  }, [currentYear, currentMonth]);

  // Calendar Calculation
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Align Mon = 0

  const calDays = [];
  for (let i = 0; i < adjustedFirstDay; i++) {
    calDays.push(null);
  }
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    calDays.push(d);
  }

  const today = new Date();

  // Navigation handlers
  const handlePrevMonth = () => {
    const newDate = new Date(currentYear, currentMonth - 1, 1);
    setCalendarDate(newDate);
    setSelectedDay(1);
    setIsAddingItem(false);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentYear, currentMonth + 1, 1);
    setCalendarDate(newDate);
    setSelectedDay(1);
    setIsAddingItem(false);
  };

  const handleGoToday = () => {
    const now = new Date();
    setCalendarDate(now);
    setSelectedDay(now.getDate());
    setIsAddingItem(false);
  };

  // FullCalendar event drag & drop handler
  const handleEventDrop = async (info) => {
    const eventId = info.event.id.split("-")[0];
    const newDateStr = info.event.startStr.split("T")[0];

    // Optimistic UI update
    setEvents((prev) =>
      prev.map((ev) => (ev.id === eventId ? { ...ev, date: newDateStr } : ev))
    );

    try {
      await API.patch(`/calendar/${eventId}`, { date: newDateStr });
    } catch (err) {
      try {
        await API.put(`/calendar/${eventId}`, { date: newDateStr });
      } catch (err2) {
        console.error("Failed to update event date:", err2);
        info.revert();
      }
    }
  };

  const getCategoryHexColor = (category) => {
    switch (category) {
      case "Meeting":
        return { bg: "#dbeafe", text: "#1e40af", border: "#93c5fd" };
      case "Task":
        return { bg: "#e0e7ff", text: "#3730a3", border: "#a5b4fc" };
      case "Reminder":
        return { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" };
      case "Holiday":
        return { bg: "#d1fae5", text: "#065f46", border: "#6ee7b7" };
      case "Shift Note":
        return { bg: "#e0f2fe", text: "#075985", border: "#7dd3fc" };
      default:
        return { bg: "#f1f5f9", text: "#334155", border: "#cbd5e1" };
    }
  };

  // Helper: check if event is active on a specific target date
  const isEventActiveOnDate = (ev, targetYear, targetMonth, targetDay) => {
    if (!ev || !ev.date || typeof ev.date !== "string") return false;
    const targetDateStr = `${targetYear}-${pad(targetMonth + 1)}-${pad(targetDay)}`;

    // Exact match for non-recurring or specific date
    if (ev.date === targetDateStr) return true;

    // Recurring event match
    if (ev.isRecurring || ev.rrule) {
      const parts = ev.date.split("-");
      if (parts.length === 3) {
        const origY = parseInt(parts[0], 10);
        const origM = parseInt(parts[1], 10) - 1; // 0-indexed
        const origD = parseInt(parts[2], 10);

        // Must be on or after original start date
        const targetDateObj = new Date(targetYear, targetMonth, targetDay);
        const origDateObj = new Date(origY, origM, origD);
        if (targetDateObj < origDateObj) return false;

        const isWeekly = Boolean(ev.rrule && ev.rrule.includes("WEEKLY"));
        const isYearly = Boolean(ev.rrule && ev.rrule.includes("YEARLY"));
        if (isWeekly) {
          return targetDateObj.getDay() === origDateObj.getDay();
        } else if (isYearly) {
          const maxDays = new Date(targetYear, targetMonth + 1, 0).getDate();
          const effectiveDay = Math.min(origD, maxDays);
          return targetMonth === origM && targetDay === effectiveDay;
        } else {
          // Monthly recurrence: match day of month (capped at month length)
          const maxDays = new Date(targetYear, targetMonth + 1, 0).getDate();
          const effectiveDay = Math.min(origD, maxDays);
          return targetDay === effectiveDay;
        }
      }
    }

    return false;
  };

  // Helper: check if event is active in a target month
  const isEventActiveInMonth = (ev, targetYear, targetMonth) => {
    if (!ev || !ev.date || typeof ev.date !== "string") return false;
    const targetMonthPrefix = `${targetYear}-${pad(targetMonth + 1)}`;

    if (ev.date.startsWith(targetMonthPrefix)) return true;

    if (ev.isRecurring || ev.rrule) {
      const parts = ev.date.split("-");
      if (parts.length === 3) {
        const origY = parseInt(parts[0], 10);
        const origM = parseInt(parts[1], 10) - 1;
        const isYearly = Boolean(ev.rrule && ev.rrule.includes("YEARLY"));
        if (isYearly) {
          return targetYear >= origY && targetMonth === origM;
        } else {
          // Month must be on or after original start month/year
          if (targetYear > origY || (targetYear === origY && targetMonth >= origM)) {
            return true;
          }
        }
      }
    }

    return false;
  };

  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const selectedDateKey = selectedDay
    ? `${currentYear}-${pad(currentMonth + 1)}-${pad(selectedDay)}`
    : null;

  const selectedDateObj = selectedDay
    ? new Date(currentYear, currentMonth, selectedDay)
    : null;

  const isPastSelectedDate = selectedDateObj ? selectedDateObj < todayMidnight : false;

  // Map events to FullCalendar event objects (projects recurring events into current view)
  const fullCalendarEvents = events.flatMap((ev) => {
    const colors = getCategoryHexColor(ev.category);
    const baseObj = {
      id: ev.id,
      title: ev.title || "Untitled Event",
      backgroundColor: colors.bg,
      borderColor: colors.border,
      textColor: colors.text,
      extendedProps: ev,
    };

    if ((ev.isRecurring || ev.rrule) && ev.date && typeof ev.date === "string") {
      const parts = ev.date.split("-");
      if (parts.length === 3) {
        const origY = parseInt(parts[0], 10);
        const origM = parseInt(parts[1], 10) - 1;
        const origD = parseInt(parts[2], 10);

        if (currentYear > origY || (currentYear === origY && currentMonth >= origM)) {
          const isWeekly = Boolean(ev.rrule && ev.rrule.includes("WEEKLY"));
          const isYearly = Boolean(ev.rrule && ev.rrule.includes("YEARLY"));
          if (isWeekly) {
            const origDayOfWeek = new Date(origY, origM, origD).getDay();
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            const instances = [];
            for (let d = 1; d <= daysInMonth; d++) {
              const dObj = new Date(currentYear, currentMonth, d);
              if (dObj >= new Date(origY, origM, origD) && dObj.getDay() === origDayOfWeek) {
                const targetDate = `${currentYear}-${pad(currentMonth + 1)}-${pad(d)}`;
                instances.push({
                  ...baseObj,
                  id: `${ev.id}-${targetDate}`,
                  date: targetDate,
                });
              }
            }
            return instances;
          } else if (isYearly) {
            if (currentMonth === origM && currentYear >= origY) {
              const maxDays = new Date(currentYear, currentMonth + 1, 0).getDate();
              const targetDay = Math.min(origD, maxDays);
              const targetDate = `${currentYear}-${pad(currentMonth + 1)}-${pad(targetDay)}`;
              return [
                {
                  ...baseObj,
                  id: `${ev.id}-${targetDate}`,
                  date: targetDate,
                },
              ];
            }
            return [];
          } else {
            // Monthly recurrence
            const maxDays = new Date(currentYear, currentMonth + 1, 0).getDate();
            const targetDay = Math.min(origD, maxDays);
            const targetDate = `${currentYear}-${pad(currentMonth + 1)}-${pad(targetDay)}`;
            return [
              {
                ...baseObj,
                id: `${ev.id}-${targetDate}`,
                date: targetDate,
              },
            ];
          }
        }
      }
    }

    return [
      {
        ...baseObj,
        date: ev.date || selectedDateKey,
      },
    ];
  });

  // Filtered Events for selected day
  const selectedDateEvents = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    return events.filter((ev) => {
      if (!ev) return false;

      const matchesDate = isEventActiveOnDate(
        ev,
        currentYear,
        currentMonth,
        selectedDay
      );
      if (!matchesDate) return false;

      if (filterCategory !== "All" && ev.category !== filterCategory) return false;

      if (term) {
        const titleMatch = ev.title && ev.title.toLowerCase().includes(term);
        const noteMatch = ev.note && ev.note.toLowerCase().includes(term);
        if (!titleMatch && !noteMatch) return false;
      }

      return true;
    });
  }, [events, currentYear, currentMonth, selectedDay, filterCategory, debouncedSearch]);

  const [selectedRangeDates, setSelectedRangeDates] = useState([]);

  // Date range drag-selection handler for FullCalendar
  const handleDateRangeSelect = (selectInfo) => {
    const startStr = selectInfo.startStr.split("T")[0];
    const endStr = selectInfo.endStr.split("T")[0];

    const [sy, sm, sd] = startStr.split("-").map(Number);
    const [ey, em, ed] = endStr.split("-").map(Number);
    const start = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);

    const dates = [];
    const curr = new Date(start);
    while (curr < end) {
      const year = curr.getFullYear();
      const month = String(curr.getMonth() + 1).padStart(2, "0");
      const day = String(curr.getDate()).padStart(2, "0");
      dates.push(`${year}-${month}-${day}`);
      curr.setDate(curr.getDate() + 1);
    }

    setSelectedRangeDates(dates);
    setCalendarDate(start);
    setSelectedDay(start.getDate());

    if (start < todayMidnight) {
      setIsAddingItem(false);
      setPastDateError("Cannot schedule events for past dates.");
    } else {
      setPastDateError("");
      setIsAddingItem(true);
    }
  };

  // Month-wide events for quick stats calculation
  const monthEvents = events.filter((ev) =>
    isEventActiveInMonth(ev, currentYear, currentMonth)
  );

  // Add event handler (supports single & multi-selected dates)
  const handleAddItem = async (e) => {
    e.preventDefault();
    setPastDateError("");
    const targetDates =
      selectedRangeDates.length > 0
        ? selectedRangeDates
        : selectedDateKey
          ? [selectedDateKey]
          : [];

    if (!newItemTitle.trim() || targetDates.length === 0) return;

    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    const hasPastDate = targetDates.some((d) => d < todayStr);
    if (hasPastDate) {
      setPastDateError("Cannot schedule events for past dates.");
      return;
    }

    let rruleStr = null;
    let isRec = false;
    if (newItemRecurrence === "YEARLY") {
      rruleStr = `FREQ=YEARLY`;
      isRec = true;
    } else if (newItemRecurrence === "MONTHLY") {
      rruleStr = `FREQ=MONTHLY;BYMONTHDAY=${selectedDay}`;
      isRec = true;
    } else if (newItemRecurrence === "WEEKLY") {
      rruleStr = `FREQ=WEEKLY`;
      isRec = true;
    }

    const payload = {
      title: newItemTitle.trim(),
      dates: targetDates,
      date: targetDates[0],
      time: newItemTime.trim() || "All Day",
      category: newItemCategory,
      priority: newItemPriority,
      completed: false,
      note: newItemNote.trim(),
      portalType,
      rrule: rruleStr,
      isRecurring: isRec,
    };

    try {
      const { data } = await API.post("/calendar", payload);
      if (data?.success) {
        queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      }
    } catch (err) {
      console.error("Failed to add calendar event(s):", err);
    }

    setNewItemTitle("");
    setNewItemNote("");
    setNewItemRecurrence("NONE");
    setSelectedRangeDates([]);
    setIsAddingItem(false);
  };

  // Toggle complete
  const handleToggleComplete = async (id) => {
    try {
      await API.patch(`/calendar/${id}/toggle`);
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
    } catch (err) {
      console.error("Failed to toggle event:", err);
      fetchEvents();
    }
  };

  // Delete event
  const handleDeleteItem = async (id) => {
    try {
      await API.delete(`/calendar/${id}`);
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
    } catch (err) {
      console.error("Failed to delete event:", err);
      fetchEvents();
    }
  };

  // Category & Priority styling matching HRMS project tokens
  const getCategoryColor = (category) => {
    switch (category) {
      case "Meeting":
        return { bg: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" };
      case "Task":
        return { bg: "bg-indigo-50 text-indigo-700 border-indigo-200", dot: "bg-indigo-500" };
      case "Reminder":
        return { bg: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" };
      case "Holiday":
        return { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" };
      case "Shift Note":
        return { bg: "bg-sky-50 text-sky-700 border-sky-200", dot: "bg-sky-500" };
      default:
        return { bg: "bg-slate-50 text-slate-700 border-slate-200", dot: "bg-slate-500" };
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "Urgent":
        return "bg-rose-50 text-rose-700 border border-rose-200";
      case "High":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "Medium":
        return "bg-sky-50 text-sky-700 border border-sky-200";
      default:
        return "bg-slate-100 text-slate-600 border border-slate-200";
    }
  };

  // Quick stats
  const totalMonthEvents = monthEvents.length;
  const completedMonthEvents = monthEvents.filter((e) => e.completed).length;
  const meetingsCount = monthEvents.filter((e) => e.category === "Meeting").length;
  const tasksCount = monthEvents.filter((e) => e.category === "Task").length;

  const stats = [
    {
      icon: CalendarDays,
      title: "Scheduled Events",
      value: String(totalMonthEvents),
      subtitle: `${calendarDate.toLocaleString("en-US", { month: "short" })} total items`,
      accent: "from-sky-500 to-blue-600",
      iconBg: "bg-sky-50",
      iconColor: "text-sky-600",
    },
    {
      icon: Briefcase,
      title: "Meetings",
      value: String(meetingsCount),
      subtitle: "Scheduled discussions",
      accent: "from-blue-500 to-indigo-600",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      icon: CheckSquare,
      title: "Tasks & Deadlines",
      value: String(tasksCount),
      subtitle: "Action deliverables",
      accent: "from-indigo-500 to-purple-600",
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
    },
    {
      icon: CheckCircle2,
      title: "Completed",
      value: String(completedMonthEvents),
      subtitle:
        totalMonthEvents > 0
          ? `${Math.round((completedMonthEvents / totalMonthEvents) * 100)}% completed`
          : "0% completed",
      accent: "from-emerald-400 to-teal-600",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
  ];

  // Calculate today's active reminders
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const todayDayNum = today.getDate();
  const todayReminders = events.filter((ev) => {
    if (!ev) return false;
    let isToday = ev.date === todayStr;
    if (!isToday && (ev.isRecurring || ev.rrule) && ev.date && typeof ev.date === "string") {
      const parts = ev.date.split("-");
      if (parts.length === 3) {
        const origY = parseInt(parts[0], 10);
        const origM = parseInt(parts[1], 10) - 1;
        const origD = parseInt(parts[2], 10);
        const isWeekly = Boolean(ev.rrule && ev.rrule.includes("WEEKLY"));
        const isYearly = Boolean(ev.rrule && ev.rrule.includes("YEARLY"));
        if (isWeekly) {
          isToday = today.getDay() === new Date(origY, origM, origD).getDay();
        } else if (isYearly) {
          isToday = today.getMonth() === origM && todayDayNum === origD && today.getFullYear() >= origY;
        } else {
          isToday = todayDayNum === origD && (today.getFullYear() > origY || (today.getFullYear() === origY && today.getMonth() >= origM));
        }
      }
    }
    return isToday;
  });

  return (
    <div className="space-y-6">
      {/* ================= HEADER SECTION (Project Matching Layout) ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        {/* Toolbar: Month Navigation & Actions */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Today Button */}
          <button
            type="button"
            onClick={handleGoToday}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition cursor-pointer"
          >
            Today
          </button>

          {/* Month Switcher */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 text-xs font-bold text-slate-800 min-w-[110px] text-center">
              {calendarDate.toLocaleString("en-US", { month: "short", year: "numeric" })}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer"
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Add Item Action Button */}
          <button
            type="button"
            onClick={() => {
              if (isPastSelectedDate) {
                setPastDateError("Cannot schedule events for past dates.");
                setIsAddingItem(false);
              } else {
                setPastDateError("");
                setIsAddingItem(true);
              }
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-300 transition-all duration-200 cursor-pointer"
          >
            <Plus size={15} />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* ================= TODAY'S REMINDER NOTIFICATION BANNER ================= */}
      {todayReminders.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 flex items-center justify-between gap-3 transition-all">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Today's Active Reminders ({todayReminders.length})
              </p>
              <p className="text-xs font-semibold text-amber-900 mt-0.5">
                {todayReminders.map((r) => r.title).join(" • ")}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-200/80 text-amber-900 shrink-0">
            Active Today
          </span>
        </div>
      )}

      {/* ================= STATS ROW (Project Standard StatCard) ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      {/* ================= MAIN CONTENT: CALENDAR GRID + AGENDA ================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* LEFT: MONTH MATRIX (8 Columns) */}
        <div className="xl:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">

          {/* Header Bar with Month Title & Legend */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-100 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-200 shrink-0">
                <CalendarIcon size={17} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  {calendarDate.toLocaleString("en-US", { month: "long", year: "numeric" })}
                </h2>
                <p className="text-xs text-slate-400">
                  Click on any day to inspect and schedule events
                </p>
              </div>
            </div>

            {/* Category Badges Legend */}
            <div className="flex items-center gap-2.5 flex-wrap text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500" /> Meeting
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-500" /> Task
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> Reminder
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Holiday
              </span>
            </div>
          </div>

          {/* FullCalendar Component Integration */}
          <div className="fullcalendar-container relative">
            <style>{`
              .fullcalendar-container .fc-highlight {
                background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%) !important;
                border: none !important;
                outline: none !important;
                box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3) !important;
                border-radius: 8px !important;
              }
              .fullcalendar-container .selected-day-highlight,
              .fullcalendar-container .selected-day-highlight .fc-daygrid-day-frame {
                background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%) !important;
                border: none !important;
                outline: none !important;
                box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35) !important;
                border-radius: 8px !important;
              }
              .fullcalendar-container .selected-day-highlight .fc-daygrid-day-number,
              .fullcalendar-container .fc-highlight .fc-daygrid-day-number {
                color: #ffffff !important;
                font-weight: 800 !important;
              }
              .fullcalendar-container .fc-daygrid-day {
                transition: background-color 0.2s ease, box-shadow 0.2s ease;
              }
              .fullcalendar-container .fc-daygrid-day-number {
                font-weight: 700;
                font-size: 0.75rem;
                color: #0369a1;
              }
              .fullcalendar-container .fc-event {
                border-radius: 6px !important;
                font-size: 11px !important;
                font-weight: 600 !important;
                padding: 2px 4px !important;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04) !important;
                transition: transform 0.15s ease, box-shadow 0.15s ease;
              }
              .fullcalendar-container .fc-event:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 10px rgba(14, 165, 233, 0.2) !important;
              }
            `}</style>
            <CalendarErrorBoundary>
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                editable={true}
                selectable={true}
                selectMirror={true}
                displayEventTime={false}
                select={handleDateRangeSelect}
                selectAllow={(selectInfo) => {
                  const todayStr = getTodayStr();
                  return selectInfo.startStr >= todayStr;
                }}
                validRange={{
                  start: getTodayStr(),
                }}
                dayCellClassNames={(arg) => {
                  const year = arg.date.getFullYear();
                  const month = String(arg.date.getMonth() + 1).padStart(2, "0");
                  const day = String(arg.date.getDate()).padStart(2, "0");
                  const dateStr = `${year}-${month}-${day}`;

                  if (selectedRangeDates.includes(dateStr) || dateStr === selectedDateKey) {
                    return ["selected-day-highlight"];
                  }
                  return [];
                }}
                events={fullCalendarEvents}
                headerToolbar={false}
                eventDrop={handleEventDrop}
                dateClick={(info) => {
                  const [y, m, d] = info.dateStr.split("-").map(Number);
                  const clickedDate = new Date(y, m - 1, d);
                  setCalendarDate(clickedDate);
                  setSelectedDay(d);
                  setSelectedRangeDates([info.dateStr]);
                  if (clickedDate < todayMidnight) {
                    setIsAddingItem(false);
                    setPastDateError("Cannot schedule events for past dates.");
                  } else {
                    setPastDateError("");
                    setIsAddingItem(true);
                  }
                }}
                eventClick={(info) => {
                  const targetDate = info.event.startStr || info.event.start;
                  if (targetDate) {
                    const dateStr = typeof targetDate === "string" ? targetDate.split("T")[0] : "";
                    if (dateStr && dateStr.includes("-")) {
                      const [y, m, d] = dateStr.split("-").map(Number);
                      setCalendarDate(new Date(y, m - 1, d));
                      setSelectedDay(d);
                      setSelectedRangeDates([dateStr]);
                      setPastDateError("");
                    }
                  }
                }}
                height="auto"
              />
            </CalendarErrorBoundary>
          </div>
        </div>

        {/* RIGHT: SELECTED DATE AGENDA (4 Columns) */}
        <div className="xl:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">

            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                  <Clock size={16} className="text-sky-600" />
                  {selectedDateObj
                    ? selectedDateObj.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                    : "Select a Date"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedDateEvents.length} items scheduled
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (isPastSelectedDate) {
                    setPastDateError("Cannot schedule events for past dates.");
                    setIsAddingItem(false);
                  } else {
                    setPastDateError("");
                    if (isAddingItem) {
                      setSelectedRangeDates([]);
                    }
                    setIsAddingItem(!isAddingItem);
                  }
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${isAddingItem
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  : "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-300"
                  }`}
              >
                {isAddingItem ? (
                  <>
                    <X size={13} /> Cancel
                  </>
                ) : (
                  <>
                    <Plus size={13} /> Schedule
                  </>
                )}
              </button>
            </div>

            {/* Filter Category Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {["All", "Meeting", "Task", "Reminder", "Holiday", "Shift Note"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all duration-200 cursor-pointer shrink-0 ${filterCategory === cat
                    ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-blue-200"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search within Date */}
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search agenda items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8.5 pr-3 py-2 text-xs font-medium text-slate-700 placeholder:text-slate-400 outline-none focus:bg-white focus:border-sky-500"
              />
            </div>

            {/* Past Date Warning Alert Banner */}
            {pastDateError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-between animate-fadeIn">
                <span>{pastDateError}</span>
                <button
                  type="button"
                  onClick={() => setPastDateError("")}
                  className="text-rose-500 hover:text-rose-800 font-bold text-sm leading-none cursor-pointer"
                >
                  ×
                </button>
              </div>
            )}

            {/* ================= INLINE FORM: SCHEDULE EVENT ================= */}
            {isAddingItem && (
              <form
                onSubmit={handleAddItem}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-sky-600" />
                    {selectedRangeDates.length > 1
                      ? `Schedule for ${selectedRangeDates.length} Selected Dates (${selectedRangeDates[0]} to ${selectedRangeDates[selectedRangeDates.length - 1]})`
                      : `Schedule for ${selectedDay} ${calendarDate.toLocaleString("en-US", { month: "short" })}`}
                  </span>
                </div>

                <div>
                  <input
                    type="text"
                    required
                    placeholder="Event title or deliverable..."
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      Category
                    </label>
                    <select
                      value={newItemCategory}
                      onChange={(e) => setNewItemCategory(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-sky-500"
                    >
                      <option value="Task">Task</option>
                      <option value="Meeting">Meeting</option>
                      <option value="Reminder">Reminder</option>
                      <option value="Shift Note">Shift Note</option>
                      <option value="Holiday">Holiday</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      Priority
                    </label>
                    <select
                      value={newItemPriority}
                      onChange={(e) => setNewItemPriority(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-sky-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      Repeat
                    </label>
                    <select
                      value={newItemRecurrence}
                      onChange={(e) => setNewItemRecurrence(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-sky-500"
                    >
                      <option value="NONE">No Repeat</option>
                      <option value="YEARLY">Every Year (Annual)</option>
                      <option value="MONTHLY">Every Month</option>
                      <option value="WEEKLY">Every Week</option>
                    </select>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Optional notes or description..."
                    value={newItemNote}
                    onChange={(e) => setNewItemNote(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingItem(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-300 transition-all cursor-pointer"
                  >
                    Save Event
                  </button>
                </div>
              </form>
            )}

            {/* ================= SCHEDULED ITEMS LIST ================= */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {selectedDateEvents.length === 0 ? (
                <div className="py-8 text-center flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                    <Coffee size={20} />
                  </div>
                  <p className="text-xs font-bold text-slate-700">
                    No scheduled items for this date
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
                    Click "Schedule" above to add meetings, shift notes or deliverables.
                  </p>
                </div>
              ) : (
                selectedDateEvents.map((item) => {
                  const catStyle = getCategoryColor(item.category);
                  const priBadge = getPriorityBadge(item.priority);

                  return (
                    <div
                      key={item.id}
                      className={`group p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${item.completed
                        ? "bg-slate-50/80 border-slate-200 opacity-60"
                        : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                    >
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        {/* Check toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleComplete(item.id)}
                          className={`mt-0.5 shrink-0 transition cursor-pointer ${item.completed
                            ? "text-emerald-600"
                            : "text-slate-400 hover:text-sky-600"
                            }`}
                          title={item.completed ? "Mark Incomplete" : "Mark Completed"}
                        >
                          {item.completed ? (
                            <CheckCircle2 size={17} />
                          ) : (
                            <Circle size={17} />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <span
                            className={`text-xs font-bold block truncate mb-1 ${item.completed
                              ? "line-through text-slate-400"
                              : "text-slate-800"
                              }`}
                          >
                            {item.title}
                          </span>

                          <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                            <span
                              className={`px-2 py-0.5 rounded-md font-bold border ${catStyle.bg}`}
                            >
                              {item.category}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md font-semibold ${priBadge}`}>
                              {item.priority}
                            </span>
                            {(item.isRecurring || item.rrule) && (
                              <span className="px-2 py-0.5 rounded-md font-bold bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
                                <Repeat size={10} /> Recurring
                              </span>
                            )}
                          </div>

                          {item.note && (
                            <p className="text-[11px] text-slate-500 mt-1.5 font-normal bg-slate-50 p-2 rounded-lg border border-slate-100">
                              {item.note}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Delete item button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition cursor-pointer shrink-0"
                        title="Delete event"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
