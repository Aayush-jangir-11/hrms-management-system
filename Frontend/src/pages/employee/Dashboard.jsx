import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  CalendarDays,
  Wallet,
  ListChecks,
  Check,
  Sparkles,
  Fingerprint,
  LogOut,
  Calendar,
  Flame,
  Zap,
  Minus,
  ArrowDown,
  ChevronRight,
  ChevronLeft,
  X,
  Loader,
} from "lucide-react";
import LeaveItem from "../../components/employee/LeaveItem";
import StatCard from "../../components/common/StatCard";
import { useAuth } from "../../context/AuthContext";
import { getGreeting } from "../../utils/greeting";
import { getArrayData } from "../../utils/helpers";
import DashboardCalendar from "../../components/common/DashboardCalendar";
import { useGet, usePost, usePut } from "../../hooks/useApi";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [taskFilterTab, setTaskFilterTab] = useState("All");

  // Attendance & Punch Clock State
  const [clockIn, setClockIn] = useState(false);
  const [seconds, setSeconds] = useState(0);

  // Weekly Attendance Stats State
  const [weeklyHours, setWeeklyHours] = useState(0);
  const [weeklyChartData, setWeeklyChartData] = useState([
    { day: "Mon", hours: 0, height: 10 },
    { day: "Tue", hours: 0, height: 10 },
    { day: "Wed", hours: 0, height: 10 },
    { day: "Thu", hours: 0, height: 10 },
    { day: "Fri", hours: 0, height: 10 },
    { day: "Sat", hours: 0, height: 10 },
    { day: "Sun", hours: 0, height: 10 },
  ]);

  /* ── TanStack Query 1: Fetch today's tasks ── */
  const { data: tasksData, isLoading: tasksLoading } = useGet(
    "/tasks/today",
    "employee-today-tasks"
  );
  const tasks = getArrayData(tasksData, "tasks");

  /* ── TanStack Query 2: Fetch today attendance ── */
  const { data: todayAttendanceRes } = useGet(
    "/attendance/today",
    "employee-today-attendance"
  );

  useEffect(() => {
    const attData = todayAttendanceRes?.data || todayAttendanceRes;
    if (attData && typeof attData === "object") {
      setClockIn(Boolean(attData.isPunchedIn));
      if (attData.liveTotalSeconds !== undefined) {
        setSeconds(attData.liveTotalSeconds);
      }
    }
  }, [todayAttendanceRes]);

  /* ── TanStack Query 3: Fetch weekly attendance ── */
  const { data: historyRes } = useGet(
    "/attendance/my-history",
    "employee-attendance-history"
  );

  useEffect(() => {
    const records = getArrayData(historyRes, "records");
    if (records.length > 0) {
      const now = new Date();
      const currentDayOfWeek = now.getDay();
      const distanceToMon = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
      const monday = new Date(now);
      monday.setDate(now.getDate() + distanceToMon);
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const thisWeekRecords = records.filter((r) => {
        const rDate = new Date(r.date);
        return rDate >= monday && rDate <= sunday;
      });

      const total = thisWeekRecords.reduce(
        (sum, r) => sum + (Number(r.totalHours) || 0),
        0
      );
      setWeeklyHours(Number(total.toFixed(1)));

      const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayHours = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };

      thisWeekRecords.forEach((r) => {
        const dayName = dayMap[new Date(r.date).getDay()];
        if (dayHours[dayName] !== undefined) {
          dayHours[dayName] += Number(r.totalHours) || 0;
        }
      });

      const maxDaily = Math.max(...Object.values(dayHours), 8);
      const chart = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => {
        const hrs = Number(dayHours[d].toFixed(1));
        const height = hrs > 0 ? Math.min(100, Math.max(15, Math.round((hrs / maxDaily) * 100))) : 8;
        return { day: d, hours: hrs, height };
      });

      setWeeklyChartData(chart);
    }
  }, [historyRes]);

  /* ── TanStack Query 4: Fetch leaves ── */
  const { data: leavesRes, isLoading: leavesLoading } = useGet(
    "/leave/my-leaves",
    "employee-leaves"
  );
  const leaves = getArrayData(leavesRes, "leaves");

  /* ── TanStack Query 5: Fetch Working Policies (matching Leave.jsx) ── */
  const { data: policiesRes } = useGet(
    "/policies",
    "working-policies"
  );

  const policies = useMemo(() => {
    return policiesRes?.success && Array.isArray(policiesRes.data) ? policiesRes.data : [];
  }, [policiesRes]);

  const activePolicy = useMemo(() => {
    // 1. Employee's specific assigned shift from attendance/today or user
    const assignedShift = todayAttendanceRes?.data?.shift || user?.shift;
    if (assignedShift && assignedShift.paidLeavesPerMonth) return assignedShift;

    // 2. Fallback to active company policy from /policies
    return policies.find((p) => p.status === "Active") || policies[0] || null;
  }, [todayAttendanceRes, user, policies]);

  // Dynamic Leave Calculation: extract quota from policy or fallback to default 2/month (24/year)
  const monthlyQuota = useMemo(() => {
    if (!activePolicy || !activePolicy.paidLeavesPerMonth) return 2;
    const numeric = parseFloat(
      activePolicy.paidLeavesPerMonth.toString().replace(/[^0-9.]/g, "")
    );
    return !isNaN(numeric) && numeric > 0 ? numeric : 2;
  }, [activePolicy]);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const totalEarnedTillNow = currentMonth * monthlyQuota;
  const approvedLeavesUsed = Array.isArray(leaves)
    ? leaves
      .filter(
        (l) =>
          l.status === "Approved" &&
          new Date(l.fromDate || l.rawFrom || l.createdAt).getFullYear() === currentYear
      )
      .reduce((sum, l) => sum + (Number(l.days) || 0), 0)
    : 0;
  const leaveBalance = Math.max(0, parseFloat((totalEarnedTillNow - approvedLeavesUsed).toFixed(1)));

  // Timer Ticker
  useEffect(() => {
    if (!clockIn) return;

    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [clockIn]);

  // Format timer HH:MM:SS
  const formatTime = () => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0",
    )}:${String(secs).padStart(2, "0")}`;
  };

  // ── TanStack Query Mutations ──
  const { mutate: punchAction, isPending: punchLoading } = usePost("/attendance/punch", {
    invalidateKeys: ["employee-today-attendance", "employee-attendance-history"],
    onError: (err) => {
      console.error("Dashboard punch error:", err);
    },
  });

  const { mutate: toggleTaskAction } = usePut("/tasks", {
    invalidateKeys: ["employee-today-tasks"],
    onError: (err) => {
      console.error("Failed to toggle task:", err);
    },
  });

  // Handle Punch In / Out from Dashboard
  const handlePunchToggle = () => {
    const punchType = clockIn ? "OUT" : "IN";
    punchAction({ punchType });
  };

  // Toggle Task Completed State
  const toggleTask = (id) => {
    toggleTaskAction({ id: `${id}/toggle` });
  };

  // Calculate Due Info for Tasks
  const formatDueBadge = (dueDate, status) => {
    if (status === "Completed") {
      return {
        label: "Completed",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    }
    if (!dueDate) {
      return {
        label: "No Deadline",
        color: "bg-slate-50 text-slate-500 border-slate-200",
      };
    }

    const today = new Date();
    const due = new Date(dueDate);
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: `Overdue by ${Math.abs(diffDays)}d`,
        color: "bg-rose-50 text-rose-700 border-rose-200 font-bold",
      };
    }
    if (diffDays === 0) {
      return {
        label: "Due Today",
        color: "bg-amber-50 text-amber-700 border-amber-200 font-bold",
      };
    }
    if (diffDays === 1) {
      return {
        label: "Due Tomorrow",
        color: "bg-sky-50 text-sky-700 border-sky-200",
      };
    }

    return {
      label: `Due ${due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      color: "bg-slate-50 text-slate-600 border-slate-200",
    };
  };

  // Priority Badge Renderer with Lucide Icons
  const renderPriorityBadge = (priority) => {
    switch (priority) {
      case "Urgent":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 bg-rose-50 text-rose-600 border border-rose-200">
            <Flame size={11} className="text-rose-500 fill-rose-500/20" />
            Urgent
          </span>
        );
      case "High":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 bg-amber-50 text-amber-700 border border-amber-200">
            <Zap size={11} className="text-amber-500 fill-amber-500/20" />
            High
          </span>
        );
      case "Low":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 bg-slate-100 text-slate-600 border border-slate-200">
            <ArrowDown size={11} className="text-slate-400" />
            Low
          </span>
        );
      case "Medium":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 bg-sky-50 text-sky-700 border border-sky-200">
            <Minus size={11} className="text-sky-500" />
            Medium
          </span>
        );
    }
  };

  // Filter tasks based on selected tab
  const displayedTasks = tasks.filter((t) => {
    if (taskFilterTab === "Pending") return t.status !== "Completed";
    if (taskFilterTab === "Completed") return t.status === "Completed";
    return true;
  });

  const pendingTasksCount = tasks.filter((t) => t.status !== "Completed").length;

  // Format Salary Display
  const formattedSalary = user?.salary
    ? `₹${Number(user.salary).toLocaleString("en-IN")}`
    : "₹35,000";

  return (
    <>
      {/* Welcome Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 md:text-3xl">
            {getGreeting()}, {user?.name || "Employee"} 👋
          </h2>

          <p className="text-slate-500 mt-1 text-sm font-medium">
            Here's your live operational overview and daily workload.
          </p>
        </div>

        <button
          onClick={() => setCalendarOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-bold shadow-md shadow-sky-200 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer shrink-0"
        >
          <CalendarDays size={16} />
          My Calendar
        </button>
      </div>

      {/* ================= DYNAMIC STAT CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard
          icon={<CalendarDays />}
          title="Leave Balance"
          value={`${leaveBalance} Days`}
          description="Available balance"
          accent="from-sky-400 to-blue-600"
          iconBg="bg-sky-50"
          iconColor="text-sky-600"
        />

        <StatCard
          icon={<Clock />}
          title="Working Hours"
          value={`${weeklyHours} Hrs`}
          description="This current week"
          accent="from-blue-400 to-indigo-600"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />

        <StatCard
          icon={<Wallet />}
          title="Base Salary"
          value={formattedSalary}
          description="Monthly compensation"
          accent="from-emerald-400 to-teal-600"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />

        <StatCard
          icon={<ListChecks />}
          title="Assigned Tasks"
          value={String(pendingTasksCount)}
          description={pendingTasksCount === 1 ? "Pending Deliverable" : "Pending Deliverables"}
          accent="from-amber-400 to-orange-600"
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* ================= TOP GRID (ATTENDANCE & WEEKLY HOURS) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Light Blue Gradient Clock Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600 text-white rounded-3xl p-6 shadow-xl shadow-sky-200/80 flex flex-col justify-between">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-blue-700/20 blur-2xl" />

          <div className="relative z-10 flex items-center justify-between">
            <p className="text-sky-100 text-xs font-bold uppercase tracking-wider">Today's Attendance</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-extrabold text-white border border-white/30 backdrop-blur-md">
              <Sparkles size={11} /> {clockIn ? "Active Shift" : "Shift Off"}
            </span>
          </div>

          <div className="relative z-10 flex flex-col items-center py-6">
            <div className="w-36 h-36 rounded-full border-8 border-white/30 bg-white/10 backdrop-blur-md flex items-center justify-center shadow-inner transition-transform hover:scale-105 duration-300">
              <div className="text-center">
                <p className="text-3xl font-black text-white tracking-tight drop-shadow-xs">{formatTime()}</p>
                <p className="text-[11px] font-semibold text-sky-100 mt-0.5">Live Working Time</p>
              </div>
            </div>
          </div>

          <button
            onClick={handlePunchToggle}
            disabled={punchLoading}
            className={`relative z-10 w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-extrabold transition-all duration-200 shadow-md active:scale-[0.98] cursor-pointer ${clockIn
              ? "bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-rose-900/30 hover:from-rose-600 hover:to-red-700"
              : "bg-white text-sky-700 hover:bg-sky-50 shadow-sky-900/20"
              }`}
          >
            {clockIn ? (
              <>
                <LogOut size={17} />
                Punch Out Shift
              </>
            ) : (
              <>
                <Fingerprint size={17} />
                Punch In Shift
              </>
            )}
          </button>
        </div>

        {/* Dynamic Weekly Working Hours Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-extrabold text-lg text-slate-800">Weekly Working Hours</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Live attendance calculated for this week
              </p>
            </div>

            <span className="text-sky-600 font-extrabold text-sm bg-sky-50 px-3.5 py-1 rounded-full border border-sky-100 shadow-xs">
              {weeklyHours} hrs Total
            </span>
          </div>

          {/* Dynamic Interactive Chart */}
          <div className="flex items-end justify-between h-48 gap-3 sm:gap-4 pt-4 border-t border-slate-50">
            {weeklyChartData.map((item) => (
              <div
                key={item.day}
                className="flex flex-col items-center gap-2 flex-1 group"
              >
                <div className="text-[10px] font-bold text-slate-400 group-hover:text-sky-600 transition-colors">
                  {item.hours > 0 ? `${item.hours}h` : "—"}
                </div>
                <div className="w-full h-36 flex items-end">
                  <div
                    className={`w-full rounded-t-xl transition-all duration-300 ${item.hours > 0
                      ? "bg-gradient-to-t from-sky-500 to-blue-600 shadow-xs group-hover:from-sky-600 group-hover:to-blue-700"
                      : "bg-slate-100"
                      }`}
                    style={{
                      height: `${item.height}%`,
                    }}
                  />
                </div>

                <span className="text-xs font-bold text-slate-500 group-hover:text-slate-800">{item.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= BOTTOM GRID (LEAVES & TASKS) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dynamic Leave Requests */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="font-extrabold text-lg text-slate-800">Recent Leave Requests</h3>
                <p className="text-xs text-slate-400 mt-0.5">Your recent leave applications status</p>
              </div>

              <button
                onClick={() => navigate("/employee/leave")}
                className="text-xs font-bold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1 cursor-pointer"
              >
                View All <ChevronRight size={14} />
              </button>
            </div>

            {leavesLoading ? (
              <div className="py-10 text-center text-xs text-slate-400 flex flex-col items-center justify-center">
                <Loader size={20} className="animate-spin text-sky-500 mb-2" />
                <span>Loading leave history...</span>
              </div>
            ) : leaves.length > 0 ? (
              <div className="space-y-2.5">
                {leaves.slice(0, 3).map((leave) => {
                  const from = new Date(leave.fromDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                  const to = new Date(leave.toDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                  const dateLabel = from === to ? from : `${from} - ${to}`;

                  return (
                    <LeaveItem
                      key={leave._id}
                      type={leave.leaveType}
                      date={`${dateLabel} (${leave.days} ${leave.days === 1 ? "day" : "days"})`}
                      status={leave.status}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-xs font-bold text-slate-600">No Leave Applications</p>
                <p className="text-[11px] text-slate-400 mt-0.5">You have not applied for any leaves recently.</p>
                <button
                  onClick={() => navigate("/employee/leave")}
                  className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-50 text-sky-600 text-xs font-bold hover:bg-sky-100 transition cursor-pointer"
                >
                  Apply for Leave
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Tasks Section with Backend Connection */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            {/* Header & Filter Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-lg text-slate-800">My Assigned Tasks</h3>
                  <span className="text-[11px] font-bold text-sky-700 bg-sky-50 border border-sky-100 px-2.5 py-0.5 rounded-full">
                    {tasks.filter((t) => t.status === "Completed").length}/{tasks.length} Done
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Assigned deliverables and deadline tracking
                </p>
              </div>

              {/* Tabs */}
              <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
                {["All", "Pending", "Completed"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setTaskFilterTab(tab)}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer ${taskFilterTab === tab
                      ? "bg-white text-slate-800 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Task Items */}
            {tasksLoading ? (
              <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center">
                <Loader size={22} className="animate-spin text-sky-500 mb-2" />
                <span>Loading your assigned tasks...</span>
              </div>
            ) : displayedTasks.length > 0 ? (
              <div className="space-y-3">
                {displayedTasks.map((task) => {
                  const isCompleted = task.status === "Completed";
                  const dueInfo = formatDueBadge(task.dueDate, task.status);

                  return (
                    <div
                      key={task._id}
                      onClick={() => toggleTask(task._id)}
                      className={`group w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl transition-all cursor-pointer border ${isCompleted
                        ? "bg-slate-50/70 border-slate-200/80 opacity-75 hover:opacity-100"
                        : dueInfo.color.includes("rose")
                          ? "bg-rose-50/20 border-rose-200 hover:border-rose-300"
                          : "bg-white border-slate-200 hover:border-sky-300 hover:shadow-xs"
                        }`}
                    >
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        {/* Custom Checkbox */}
                        <div
                          className={`mt-0.5 w-5 h-5 rounded-lg border shrink-0 flex items-center justify-center transition-all ${isCompleted
                            ? "bg-emerald-500 border-emerald-500 shadow-xs"
                            : "border-slate-300 bg-white group-hover:border-sky-500"
                            }`}
                        >
                          {isCompleted && <Check size={13} className="text-white stroke-[3]" />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs font-bold leading-snug transition-colors ${isCompleted ? "line-through text-slate-400" : "text-slate-800"
                              }`}
                          >
                            {task.title}
                          </p>

                          {task.description && (
                            <p className="text-[11px] font-medium text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          {task.assignedBy?.name && (
                            <p className="text-[10px] font-semibold text-slate-400 mt-1.5">
                              Assigned by: <span className="text-slate-600">{task.assignedBy.name}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Due Date, Hourly Slot & Priority Badges */}
                      <div className="flex items-center gap-2 shrink-0 self-start sm:self-center pl-8 sm:pl-0 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${dueInfo.color}`}
                        >
                          <Calendar size={11} />
                          {dueInfo.label}
                        </span>

                        {(task.isHourly || (task.startTime && task.endTime)) && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200">
                            <Clock size={11} className="text-sky-600" />
                            {`${task.startTime} - ${task.endTime}`}
                          </span>
                        )}

                        {renderPriorityBadge(task.priority)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-2.5 border border-emerald-100">
                  <Check size={22} className="stroke-[2.5]" />
                </div>
                <p className="text-xs font-bold text-slate-700">
                  {taskFilterTab === "Completed"
                    ? "No completed tasks yet"
                    : taskFilterTab === "Pending"
                      ? "No pending tasks remaining!"
                      : "No Tasks Assigned"}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs mx-auto">
                  {taskFilterTab === "Pending"
                    ? "Great job! You've cleared all your tasks."
                    : "You're all caught up with your daily assignments."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dashboard Calendar Modal (Read-Only) */}
      <DashboardCalendar
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        portalType="employee"
      />
    </>
  );
};

export default Dashboard;
