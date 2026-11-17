import { useEffect, useState, useMemo } from "react";
import {
  Clock,
  CheckCircle2,
  Timer,
  MapPin,
  Fingerprint,
  LogOut,
  Search,
  Activity,
  AlertCircle,
  Building2,
  Coffee,
  AlertTriangle,
  X,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getArrayData } from "../../utils/helpers";
import { useGet, usePost } from "../../hooks/useApi";
import { useDebounce } from "../../hooks/useDebounce";
import { usePermission } from "../../hooks/usePermission";
import { useToast } from "../../hooks/useToast";

const formatAttendance = (item) => {
  const date = new Date(item.date);

  return {
    id: item._id,
    date: date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    day: date.toLocaleDateString("en-US", {
      weekday: "long",
    }),
    punchIn: item.checkIn
      ? new Date(item.checkIn).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      : "-",
    punchOut: item.checkOut
      ? new Date(item.checkOut).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      : "-",
    hours:
      item.totalHours > 0
        ? `${Math.floor(item.totalHours)}h ${Math.round(
          (item.totalHours % 1) * 60
        )}m`
        : "-",
    numericHours: item.totalHours || 0,
    status: item.status || "Present",
    remark: item.remark || "",
  };
};

const Attendance = () => {
  const { user } = useAuth();
  const { can } = usePermission("attendance");
  const { showToast } = useToast();
  const [punchedIn, setPunchedIn] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [todayPunchIn, setTodayPunchIn] = useState("-");
  const [todayPunchOut, setTodayPunchOut] = useState("-");
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [punchStatusAlert, setPunchStatusAlert] = useState(null);
  const [deptInfo, setDeptInfo] = useState({
    department: user?.department || "General",
    office: "Headquarters - Mumbai",
    shift: null,
  });

  /* ── TanStack Query 1: Fetch History ── */
  const { data: historyRes, isLoading: loadingHistory } = useGet(
    "/attendance/my-history",
    "employee-attendance-history"
  );

  const attendance = useMemo(() => {
    const list = getArrayData(historyRes, "records");
    return list.map(formatAttendance);
  }, [historyRes]);

  /* ── TanStack Query 2: Fetch Today's Status ── */
  const { data: todayRes } = useGet(
    "/attendance/today",
    "employee-today-status"
  );

  useEffect(() => {
    const attData = todayRes?.data || todayRes;
    if (!attData || typeof attData !== "object") return;

    const {
      isPunchedIn,
      isCompleted: completed,
      attendance: todayRec,
      liveTotalSeconds,
      department,
      office,
      headquarter,
      shift,
      latestPunch,
    } = attData;

    setPunchedIn(Boolean(isPunchedIn));
    setIsCompleted(Boolean(completed));

    if (department || office || headquarter || shift || latestPunch) {
      setDeptInfo({
        department: department || user?.department || "General",
        office: office || headquarter || "Headquarters - Mumbai",
        shift: shift || null,
      });
    }

    if (liveTotalSeconds !== undefined) {
      setSeconds(liveTotalSeconds);
    }

    if (todayRec) {
      if (todayRec.checkIn) {
        const checkInDate = new Date(todayRec.checkIn);
        setTodayPunchIn(
          checkInDate.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        );
      }

      if (todayRec.checkOut && !isPunchedIn) {
        setTodayPunchOut(
          new Date(todayRec.checkOut).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        );
      } else if (isPunchedIn) {
        setTodayPunchOut("-");
      }
    }
  }, [todayRes, user]);

  // Timer Effect when Punched In
  useEffect(() => {
    if (!punchedIn) return;

    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [punchedIn]);

  // Format Timer HH:MM:SS
  const formatTimerDisplay = (totalSecs = seconds) => {
    const hours = Math.floor(totalSecs / 3600)
      .toString()
      .padStart(2, "0");
    const minutes = Math.floor((totalSecs % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const secs = (totalSecs % 60).toString().padStart(2, "0");

    return `${hours}:${minutes}:${secs}`;
  };

  // Format Duration helper
  const formatDuration = (secs) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    if (hrs === 0 && mins === 0) return "< 1m";
    if (hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins}m`;
  };

  // ── TanStack Query Mutation: Punch Attendance ──
  const { mutate: punchAttendance, isPending: loading } = usePost("/attendance/punch", {
    invalidateKeys: ["employee-today-status", "employee-attendance-history"],
    onSuccess: (data, variables) => {
      if (!data?.success) return;

      const detectedStatus = data.data?.detectedStatus;
      const policyApplied = data.data?.policyApplied;
      const currentTimeStr = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      if (detectedStatus && detectedStatus !== "Present") {
        const alertMessages = {
          Late: `Arrival exceeded the ${policyApplied?.gracePeriod || "grace period"} allowed by your shift policy.`,
          "Half Day": `Total logged hours are below the ${policyApplied?.halfDayThreshold || "half-day threshold"} required.`,
        };
        setPunchStatusAlert({
          type: detectedStatus,
          title: detectedStatus === "Late" ? "Late Arrival Recorded" : "Half-Day Status Warning",
          message: alertMessages[detectedStatus] || `Marked as ${detectedStatus}`,
          time: currentTimeStr,
          policy: policyApplied?.shiftName || deptInfo.shift?.shiftName || null,
        });
        setTimeout(() => setPunchStatusAlert(null), 6000);
      } else if (variables?.punchType === "IN") {
        setPunchStatusAlert({
          type: "Present",
          title: "Punch In Successful",
          message: "You are clocked in on time. Have a productive workday!",
          time: currentTimeStr,
          policy: policyApplied?.shiftName || deptInfo.shift?.shiftName || null,
        });
        setTimeout(() => setPunchStatusAlert(null), 5000);
      } else if (variables?.punchType === "OUT") {
        setPunchStatusAlert({
          type: "Out",
          title: "Punch Out Completed",
          message: "Work session recorded. Have a restful evening!",
          time: currentTimeStr,
          policy: policyApplied?.shiftName || deptInfo.shift?.shiftName || null,
        });
        setTimeout(() => setPunchStatusAlert(null), 5000);
      }
    },
    onError: (error) => {
      const errorMsg =
        error.response?.data?.message || "Punch action failed. Please try again.";
      console.warn("Punch action error:", errorMsg);
    },
  });

  // Punch In / Punch Out Handler
  const handlePunch = () => {
    if (!can("mark")) {
      showToast("Permission Denied: Attendance marking not allowed for your role", "error");
      return;
    }
    const punchType = punchedIn ? "OUT" : "IN";
    punchAttendance({
      punchType,
      location: deptInfo.office,
    });
  };

  // Current Date
  const today = new Date();
  const dateFormatted = today.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const dayFormatted = today.toLocaleDateString("en-US", { weekday: "long" });

  // Dynamic Monthly KPI calculations from attendance records
  const presentCount = attendance.filter((a) => a.status === "Present").length;
  const lateCount = attendance.filter((a) => a.status === "Late").length;
  const leaveCount = attendance.filter((a) => a.status === "On Leave").length;
  const totalHoursSum = attendance
    .reduce((acc, item) => acc + (parseFloat(item.numericHours) || 0), 0)
    .toFixed(1);

  // Filtered Attendance Records
  const filteredAttendance = useMemo(() => {
    const query = debouncedSearchQuery.trim().toLowerCase();
    return attendance.filter((record) => {
      const matchesStatus =
        filterStatus === "All" ||
        record.status.toLowerCase() === filterStatus.toLowerCase() ||
        (filterStatus === "Leave" && record.status === "On Leave");

      const matchesSearch =
        !query ||
        record.date.toLowerCase().includes(query) ||
        record.day.toLowerCase().includes(query) ||
        record.status.toLowerCase().includes(query) ||
        (record.remark && record.remark.toLowerCase().includes(query));

      return matchesStatus && matchesSearch;
    });
  }, [attendance, filterStatus, debouncedSearchQuery]);

  // ─────────────────────────────────────────────────────────────────────────
  // WHY WE READ SHIFT HOURS DYNAMICALLY:
  //   The progress ring on the punch card was always targeting 8 hours,
  //   even for employees on a 9-hour Regular Shift or a 6-hour Night Shift.
  //
  //   BEFORE: A Night Shift employee working 6 hours would see 75% progress
  //   instead of 100% — confusing and inaccurate.
  //
  //   NOW: We parse the shift's workingHours string ("9 Hours", "8 Hours",
  //   "6 Hours") and use that as the target. If no shift is assigned, we
  //   safely fall back to 8 hours.
  //
  //   parseFloat("9 Hours") = 9 → shiftTargetSecs = 9 * 3600 = 32400 ✅
  //   parseFloat("8 Hours") = 8 → shiftTargetSecs = 8 * 3600 = 28800 ✅
  //   No shift assigned → defaults to 8 hours ✅
  // ─────────────────────────────────────────────────────────────────────────
  const shiftWorkingHours = deptInfo.shift?.workingHours
    ? parseFloat(deptInfo.shift.workingHours) || 8
    : 8;
  const shiftTargetSecs = shiftWorkingHours * 3600;
  const progressPercent = Math.min(
    100,
    Math.round((seconds / shiftTargetSecs) * 100)
  );

  return (
    <div className="space-y-6">
      {/* ================= HEADER SECTION ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 md:text-3xl tracking-tight">
            Attendance & Work Shift
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time punch logging, shift tracking, and monthly attendance overview.
          </p>
        </div>

        {/* Dynamic Department & Headquarter Badge */}
        <div className="inline-flex items-center gap-2 self-start sm:self-auto bg-sky-50 border border-sky-100 px-3.5 py-1.5 rounded-2xl text-xs font-bold text-sky-700 shadow-2xs">
          <Building2 size={14} className="text-sky-600" />
          <span>{deptInfo.office}</span>
          <span className="text-sky-300">•</span>
          <span className="text-slate-700 font-semibold">{deptInfo.department}</span>
        </div>
      </div>


      {/* ================= PUNCH IN / PUNCH OUT & TODAY DETAILS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sleek Gradient Punch Card */}
        <div className="relative overflow-hidden lg:col-span-1 rounded-[28px] bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-200/50 flex flex-col justify-between">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-indigo-900/30 blur-2xl" />

          <div className="relative z-10">
            {/* Card Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 backdrop-blur-md flex items-center justify-center text-white shadow-xs">
                  <Fingerprint size={22} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-sky-100 uppercase tracking-wider">
                    Today's Attendance
                  </p>
                  <h2 className="text-sm font-extrabold text-white">
                    {punchedIn
                      ? "Shift In Progress"
                      : todayPunchOut !== "-"
                        ? "On Break / Checked Out"
                        : "Not Punched In"}
                  </h2>
                </div>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold backdrop-blur-md border ${punchedIn
                    ? "bg-emerald-400/20 text-emerald-200 border-emerald-300/40"
                    : todayPunchOut !== "-"
                      ? "bg-amber-400/20 text-amber-200 border-amber-300/40"
                      : "bg-white/15 text-white border-white/20"
                  }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${punchedIn
                      ? "bg-emerald-300 animate-pulse"
                      : todayPunchOut !== "-"
                        ? "bg-amber-300"
                        : "bg-white/60"
                    }`}
                />
                {punchedIn ? "Active" : todayPunchOut !== "-" ? "Break / Out" : "Offline"}
              </span>
            </div>

            {/* Circular Timer Visual */}
            <div className="flex flex-col items-center py-4">
              <div className="relative flex items-center justify-center w-36 h-36 rounded-full border-4 border-white/20 bg-white/10 backdrop-blur-md shadow-inner transition-transform hover:scale-105 duration-300">
                <div className="text-center">
                  <p className="text-3xl font-black tracking-tight text-white font-mono drop-shadow-xs">
                    {formatTimerDisplay()}
                  </p>
                  <p className="text-[11px] font-semibold text-sky-100 mt-1">
                    {punchedIn
                      ? "Logged Time"
                      : todayPunchOut !== "-"
                        ? "Shift Paused"
                        : `Target: ${deptInfo.shift?.workingHours || "8 Hours"}`}
                  </p>
                </div>
              </div>

              {/* Progress bar towards shift hours */}
              {(punchedIn || todayPunchOut !== "-") && (
                <div className="w-full mt-4 bg-black/20 rounded-full h-2 p-0.5 backdrop-blur-sm overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          {can("mark") && (
            <div className="relative z-10 mt-4">
              <button
                onClick={handlePunch}
                disabled={loading}
                className={`w-full py-3.5 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2.5 transition-all duration-200 shadow-lg active:scale-[0.98] cursor-pointer ${
                  punchedIn
                    ? "bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-rose-900/30 hover:from-rose-600 hover:to-red-700"
                    : "bg-white text-blue-700 hover:bg-sky-50 shadow-blue-900/20"
                }`}
                title={punchedIn ? "Punch Out" : "Punch In"}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : punchedIn ? (
                  <>
                    <LogOut size={18} />
                    <span>Punch Out</span>
                  </>
                ) : (
                  <>
                    <Fingerprint size={18} />
                    <span>Punch In</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 mt-3 text-xs font-medium text-sky-100">
                <MapPin size={13} className="text-sky-200" />
                <span>{deptInfo.office} • GPS Verified</span>
              </div>
            </div>
          )}
        </div>

        {/* Today's Punch Information & Metrics */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-[28px] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-extrabold text-slate-800">
                  Today's Punch Summary
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  {dayFormatted}, {dateFormatted}
                </p>
              </div>
            </div>

            {/* 3 Metric Boxes: Punch In, Punch Out, Working Time */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Punch In */}
              <div className="bg-emerald-50/50 border border-emerald-100/80 rounded-2xl p-4 transition hover:shadow-xs">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                    Punch In
                  </p>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <p className="text-xl font-extrabold text-slate-800 mt-2 font-mono">
                  {todayPunchIn}
                </p>
                <p className="text-[11px] font-medium text-slate-400 mt-1">
                  Shift Starts {deptInfo.shift?.startTime || "09:00 AM"}
                </p>
              </div>

              {/* Punch Out */}
              <div className="bg-rose-50/50 border border-rose-100/80 rounded-2xl p-4 transition hover:shadow-xs">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                    Punch Out
                  </p>
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                </div>
                <p className="text-xl font-extrabold text-slate-800 mt-2 font-mono">
                  {todayPunchOut}
                </p>
                <p className="text-[11px] font-medium text-slate-400 mt-1">
                  Shift Ends {deptInfo.shift?.endTime || "06:00 PM"}
                </p>
              </div>

              {/* Working Hours */}
              <div className="bg-sky-50/50 border border-sky-100/80 rounded-2xl p-4 transition hover:shadow-xs">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">
                    Working Hours
                  </p>
                  <Clock size={14} className="text-sky-600" />
                </div>
                <p className="text-xl font-black text-sky-600 mt-2 font-mono">
                  {punchedIn
                    ? formatTimerDisplay()
                    : todayPunchOut !== "-"
                      ? formatDuration(seconds)
                      : "00:00:00"}
                </p>
                <p className="text-[11px] font-medium text-slate-400 mt-1">
                  Target: {deptInfo.shift?.workingHours || "8h 00m"}
                </p>
              </div>
            </div>
          </div>

          {/* Location & Shift Status Bar */}
          <div className="mt-5 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {deptInfo.office} • {deptInfo.department}
                </p>
                <p className="text-[11px] text-slate-500">
                  Geofence Verified
                </p>
              </div>
            </div>

            <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white border border-slate-200 text-slate-700 shadow-2xs">
              <Activity size={13} className="text-sky-600" />
              {deptInfo.shift?.name || deptInfo.shift?.shiftType || "Regular Shift"} ({deptInfo.shift?.startTime || "09:00 AM"} - {deptInfo.shift?.endTime || "06:00 PM"})
            </span>
          </div>
        </div>
      </div>

      {/* ================= MONTHLY SUMMARY KPI CARDS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Present */}
        <div className="bg-white border border-slate-200/80 rounded-[24px] p-5 shadow-xs transition hover:-translate-y-0.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Present
              </p>
              <p className="text-xl font-extrabold text-slate-800">
                {presentCount} Days
              </p>
            </div>
          </div>
        </div>

        {/* Late */}
        <div className="bg-white border border-slate-200/80 rounded-[24px] p-5 shadow-xs transition hover:-translate-y-0.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Late Marks
              </p>
              <p className="text-xl font-extrabold text-slate-800">
                {lateCount} Days
              </p>
            </div>
          </div>
        </div>

        {/* Leaves */}
        <div className="bg-white border border-slate-200/80 rounded-[24px] p-5 shadow-xs transition hover:-translate-y-0.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
              <Coffee size={20} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                On Leave
              </p>
              <p className="text-xl font-extrabold text-slate-800">
                {leaveCount} Days
              </p>
            </div>
          </div>
        </div>

        {/* Total Hours */}
        <div className="bg-white border border-slate-200/80 rounded-[24px] p-5 shadow-xs transition hover:-translate-y-0.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
              <Timer size={20} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Hours
              </p>
              <p className="text-xl font-extrabold text-slate-800">
                {totalHoursSum} Hrs
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= ATTENDANCE HISTORY LOGS ================= */}
      <div className="bg-white border border-slate-200/80 rounded-[28px] overflow-hidden shadow-xs">
        {/* Table Header Controls */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800">
              Punch & Attendance History
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Verified daily punch-in, punch-out times and calculated working durations.
            </p>
          </div>

          {/* Filter Pills & Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search date or status..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-sky-500 focus:bg-white transition"
              />
            </div>

            {/* Filter Pills */}
            {["All", "Present", "Late", "Leave"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${filterStatus === status
                  ? "bg-sky-600 text-white shadow-xs"
                  : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Table View */}
        {/* DESKTOP TABLE VIEW (Screens >= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                <th className="text-left px-6 py-4">Date & Day</th>
                <th className="text-left px-6 py-4">Punch In</th>
                <th className="text-left px-6 py-4">Punch Out</th>
                <th className="text-left px-6 py-4">Working Hours</th>
                <th className="text-left px-6 py-4">Remark / Note</th>
                <th className="text-left px-6 py-4">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredAttendance.length > 0 ? (
                filteredAttendance.map((item) => (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-sky-50/30"
                  >
                    {/* Date & Day */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                          {item.date.split(" ")[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs">
                            {item.date}
                          </p>
                          <p className="text-[11px] text-slate-400">{item.day}</p>
                        </div>
                      </div>
                    </td>

                    {/* Punch In */}
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-700">
                        {item.punchIn !== "-" && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        )}
                        {item.punchIn}
                      </div>
                    </td>

                    {/* Punch Out */}
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-700">
                        {item.punchOut !== "-" && (
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                        )}
                        {item.punchOut}
                      </div>
                    </td>

                    {/* Working Hours */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold font-mono ${item.hours !== "-"
                          ? "bg-slate-100 text-slate-700"
                          : "text-slate-400"
                          }`}
                      >
                        <Clock size={12} className="opacity-70" />
                        {item.hours}
                      </span>
                    </td>

                    {/* Remark */}
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {item.remark || "-"}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${item.status === "Present"
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : item.status === "Late"
                            ? "bg-amber-100 text-amber-700 border border-amber-200"
                            : item.status === "Half Day"
                              ? "bg-purple-100 text-purple-700 border border-purple-200"
                              : item.status === "On Leave"
                                ? "bg-blue-100 text-blue-700 border border-blue-200"
                                : item.status === "Absent"
                                  ? "bg-rose-100 text-rose-700 border border-rose-200"
                                  : "bg-slate-100 text-slate-600"
                          }`}
                      >
                        {item.status === "Present" && <CheckCircle2 size={12} />}
                        {item.status === "Late" && <AlertCircle size={12} />}
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-slate-400 text-xs"
                  >
                    No attendance records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARD VIEW (Phone screens < 768px) */}
        <div className="md:hidden p-3.5 space-y-3 bg-slate-50/50">
          {filteredAttendance.length > 0 ? (
            filteredAttendance.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3"
              >
                {/* Header: Date circle + Date text + Status pill */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      {item.date.split(" ")[0]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">
                        {item.date}
                      </p>
                      <p className="text-[11px] font-medium text-slate-400">{item.day}</p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                      item.status === "Present"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : item.status === "Late"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : item.status === "Half Day"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : item.status === "On Leave"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : item.status === "Absent"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {item.status === "Present" && <CheckCircle2 size={12} />}
                    {item.status === "Late" && <AlertCircle size={12} />}
                    <span>{item.status}</span>
                  </span>
                </div>

                {/* Timing Grid */}
                <div className="rounded-xl bg-slate-50/80 p-3 text-xs border border-slate-100 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Punch In</span>
                      <span className="font-mono font-bold text-slate-800 text-xs">
                        {item.punchIn !== "-" ? (
                          <span className="text-emerald-700">{item.punchIn}</span>
                        ) : (
                          "—"
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Punch Out</span>
                      <span className="font-mono font-bold text-slate-800 text-xs">
                        {item.punchOut !== "-" ? (
                          <span className="text-rose-700">{item.punchOut}</span>
                        ) : (
                          "—"
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span className="text-[11px] text-slate-500 font-medium">Working Hours:</span>
                    <span
                      className={`font-mono font-bold text-xs ${
                        item.hours !== "-"
                          ? "bg-sky-50 text-sky-700 px-2 py-0.5 rounded border border-sky-100"
                          : "text-slate-400"
                      }`}
                    >
                      {item.hours}
                    </span>
                  </div>
                </div>

                {/* Remark if present */}
                {item.remark && (
                  <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <strong className="text-slate-600">Note:</strong> {item.remark}
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="py-10 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/80 p-6 text-xs">
              No attendance records found.
            </div>
          )}
        </div>
      </div>

      {/* ================= CREATIVE PUNCH STATUS TOAST ================= */}
      {punchStatusAlert && (
        <div className="fixed top-6 right-6 z-[9999] max-w-sm sm:max-w-md w-full pointer-events-auto transition-all duration-300">
          <div
            className={`relative overflow-hidden rounded-2xl bg-white/95 backdrop-blur-xl border p-4 shadow-2xl transition-all duration-300 ${
              punchStatusAlert.type === "Late"
                ? "border-amber-200/90 shadow-amber-500/15"
                : punchStatusAlert.type === "Half Day"
                ? "border-orange-200/90 shadow-orange-500/15"
                : punchStatusAlert.type === "Out"
                ? "border-sky-200/90 shadow-sky-500/15"
                : "border-emerald-200/90 shadow-emerald-500/15"
            }`}
          >
            {/* Top Vivid Accent Gradient Bar */}
            <div
              className={`absolute top-0 left-0 right-0 h-1.5 ${
                punchStatusAlert.type === "Late"
                  ? "bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600"
                  : punchStatusAlert.type === "Half Day"
                  ? "bg-gradient-to-r from-orange-400 via-amber-500 to-red-500"
                  : punchStatusAlert.type === "Out"
                  ? "bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600"
                  : "bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600"
              }`}
            />

            <div className="flex items-start gap-3.5 pt-1">
              {/* Creative Icon Container */}
              <div
                className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center relative shadow-sm ${
                  punchStatusAlert.type === "Late"
                    ? "bg-gradient-to-br from-amber-100 to-yellow-200 text-amber-800 ring-1 ring-amber-300/70"
                    : punchStatusAlert.type === "Half Day"
                    ? "bg-gradient-to-br from-orange-100 to-amber-200 text-orange-800 ring-1 ring-orange-300/70"
                    : punchStatusAlert.type === "Out"
                    ? "bg-gradient-to-br from-sky-100 to-blue-200 text-sky-800 ring-1 ring-sky-300/70"
                    : "bg-gradient-to-br from-emerald-100 to-teal-200 text-emerald-800 ring-1 ring-emerald-300/70"
                }`}
              >
                {punchStatusAlert.type === "Late" ? (
                  <AlertTriangle className="w-5 h-5 text-amber-700" />
                ) : punchStatusAlert.type === "Half Day" ? (
                  <Clock className="w-5 h-5 text-orange-700" />
                ) : punchStatusAlert.type === "Out" ? (
                  <LogOut className="w-5 h-5 text-sky-700" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                )}

                {/* Status Ping Dot */}
                <span
                  className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ring-2 ring-white animate-pulse ${
                    punchStatusAlert.type === "Late"
                      ? "bg-amber-500"
                      : punchStatusAlert.type === "Half Day"
                      ? "bg-orange-500"
                      : punchStatusAlert.type === "Out"
                      ? "bg-sky-500"
                      : "bg-emerald-500"
                  }`}
                />
              </div>

              {/* Main Content Area */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                      {punchStatusAlert.title}
                    </h4>
                    {punchStatusAlert.time && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {punchStatusAlert.time}
                      </span>
                    )}
                  </div>

                  {/* Close Action */}
                  <button
                    onClick={() => setPunchStatusAlert(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    aria-label="Dismiss notification"
                  >
                    <X size={15} />
                  </button>
                </div>

                <p className="mt-1 text-xs text-slate-600 leading-relaxed font-medium">
                  {punchStatusAlert.message}
                </p>

                {/* Shift policy badge */}
                {punchStatusAlert.policy && (
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <span>Policy: <strong className="text-slate-700 font-semibold">{punchStatusAlert.policy}</strong></span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
