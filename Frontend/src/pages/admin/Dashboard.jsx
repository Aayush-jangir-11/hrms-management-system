import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  UserCog,
  Building2,
  ShieldCheck,
  Settings,
  BarChart3,
  FileText,
  UserPlus,
  MoreHorizontal,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Activity,
  TrendingUp,
  Clock3,
  ChevronRight,
  ChevronLeft,
  UserCheck,
  UserX,
  BriefcaseBusiness,
  Download,
  Loader,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getGreeting } from "../../utils/greeting";
import DashboardCalendar from "../../components/common/DashboardCalendar";
import PageLoader from "../../components/common/PageLoader";
import { useGet } from "../../hooks/useApi";

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  /* ── TanStack Query: Fetch Admin Dashboard Stats ── */
  const { data: responseData, isLoading: loading } = useGet(
    "/admin/dashboard-stats",
    ["admin-dashboard-stats", selectedYear],
    { year: selectedYear }
  );

  const dashboardData = responseData?.data || null;
  const availableYears = dashboardData?.availableYears || [currentYear];
  const employeeGrowth = dashboardData?.employeeGrowth || [];
  const todayAttendance = dashboardData?.todayAttendance || {
    present: 0,
    onLeave: 0,
    absent: 0,
    total: 0,
    percentage: 0,
  };

  const stats = [
    {
      title: "Total Employees",
      value: dashboardData?.totalEmployees ?? "0",
      change: "+1",
      icon: Users,
      description: "current workforce",
      gradient: "from-sky-500 to-blue-600",
      light: "bg-sky-50",
      path: "/admin/reports",
    },
    {
      title: "Active Employees",
      value: dashboardData?.activeEmployees ?? "0",
      change: "Stable",
      icon: UserCheck,
      description: "currently active",
      gradient: "from-emerald-500 to-teal-600",
      light: "bg-emerald-50",
      path: "/admin/reports",
    },
    {
      title: "Departments",
      value: dashboardData?.totalDepartments ?? "0",
      change: "Active",
      icon: Building2,
      description: "total departments",
      gradient: "from-violet-500 to-purple-600",
      light: "bg-violet-50",
      path: "/admin/reports",
    },
    {
      title: "HR Managers",
      value: dashboardData?.totalHR ?? "0",
      change: "Active",
      icon: ShieldCheck,
      description: "HR personnel count",
      gradient: "from-orange-500 to-amber-500",
      light: "bg-orange-50",
      path: "/admin/roles-permissions",
    },
  ];

  const departments = dashboardData?.deptStats || [];

  const activities = (dashboardData?.recentEmployees || []).map((emp) => ({
    icon: UserPlus,
    title: "New employee added",
    description: `${emp.name} joined as ${emp.position} in ${emp.department}`,
    time: new Date(emp.joinDate || emp.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  const users = (dashboardData?.recentEmployees || []).map((emp) => ({
    name: emp.name,
    email: emp.email,
    role: emp.role || "Employee",
    status: "Active",
  }));

  const quickActions = [
    {
      title: "Roles & Permissions",
      description: "Access controls",
      icon: ShieldCheck,
      path: "/admin/roles-permissions",
    },
    {
      title: "Reports",
      description: "View reports",
      icon: BarChart3,
      path: "/admin/reports",
    },
  ];

  if (loading) {
    return <PageLoader message="Loading Admin Dashboard..." />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* =====================================================
              WELCOME SECTION
          ====================================================== */}

      <section className="relative mb-7 overflow-hidden rounded-[28px] bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 p-6 shadow-xl shadow-blue-200/40 md:p-8">
        {/* Background Decoration */}
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10" />

        <div className="absolute -bottom-28 right-40 h-72 w-72 rounded-full bg-white/5" />

        <div className="absolute right-10 top-10 hidden opacity-10 md:block">
          <BriefcaseBusiness size={150} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-5">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                System Online
              </span>

              <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-blue-100 backdrop-blur-md">
                {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-white md:text-3xl lg:text-4xl">
              {getGreeting()}, {user?.name || "Admin"} 👋
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100 md:text-base">
              Manage your organization, monitor employees and keep your HRMS
              system running smoothly from one place.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/admin/reports")}
                className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-blue-600 shadow-lg transition hover:bg-blue-50 cursor-pointer"
              >
                View Reports
                <ArrowUpRight size={16} />
              </button>

              <button
                onClick={() => navigate("/admin/reports")}
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/20 cursor-pointer"
              >
                <Download size={16} />
                Export Data
              </button>

              <button
                onClick={() => setCalendarOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/20 cursor-pointer"
              >
                <CalendarDays size={16} />
                Calendar
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
              STAT CARDS
          ====================================================== */}

      <section className="mb-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <div
              key={index}
              onClick={() => navigate(stat.path)}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
            >
              {/* Decorative */}
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-slate-50 transition group-hover:bg-sky-50" />

              <div className="relative">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {stat.title}
                    </p>

                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-800">
                      {stat.value}
                    </h2>
                  </div>

                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg`}
                  >
                    <Icon size={22} />
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-600">
                    <TrendingUp size={12} />
                    {stat.change}
                  </span>

                  <span className="text-xs text-slate-400">
                    {stat.description}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* =====================================================
              ANALYTICS ROW (DYNAMIC CHARTS)
          ====================================================== */}

      {(() => {
        // Prepare Employee Growth Chart calculations
        const monthsList = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const growthData = employeeGrowth.length === 12
          ? employeeGrowth
          : monthsList.map((m) => {
            const found = employeeGrowth.find((d) => d.month === m);
            return found || { month: m, total: 0, newJoined: 0 };
          });

        const maxTotal = Math.max(...growthData.map((d) => d.total || 0), 5);
        const getNiceMax = (val) => {
          if (val <= 5) return 5;
          if (val <= 10) return 10;
          if (val <= 20) return 20;
          if (val <= 50) return 50;
          if (val <= 100) return 100;
          if (val <= 200) return 200;
          if (val <= 500) return 500;
          return Math.ceil(val / 100) * 100;
        };
        const niceMax = getNiceMax(maxTotal);
        const yTicks = [
          niceMax,
          Math.round(niceMax * 0.75),
          Math.round(niceMax * 0.5),
          Math.round(niceMax * 0.25),
          0,
        ];

        const svgWidth = 700;
        const svgHeight = 220;
        const padLeft = 35;
        const padRight = 25;
        const padTop = 20;
        const padBottom = 30;
        const chartWidth = svgWidth - padLeft - padRight;
        const chartHeight = svgHeight - padTop - padBottom;

        const points = growthData.map((item, index) => {
          const x = padLeft + index * (chartWidth / Math.max(1, growthData.length - 1));
          const ratio = niceMax > 0 ? (item.total || 0) / niceMax : 0;
          const y = padTop + chartHeight - ratio * chartHeight;
          return { ...item, x, y, index };
        });

        // Smooth cubic bezier spline
        let linePath = "";
        if (points.length > 0) {
          linePath = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
          for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i === 0 ? 0 : i - 1];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;
            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;

            linePath += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
          }
        }

        const baselineY = (padTop + chartHeight).toFixed(1);
        const areaPath = linePath
          ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${baselineY} L ${points[0].x.toFixed(1)} ${baselineY} Z`
          : "";

        // Today's Workforce Attendance calculations
        const totalToday = todayAttendance.total || 0;
        const presentCount = todayAttendance.present || 0;
        const onLeaveCount = todayAttendance.onLeave || 0;
        const absentCount = todayAttendance.absent || 0;
        const presentPct = todayAttendance.percentage || 0;

        const donutRadius = 60;
        const donutCircumference = 2 * Math.PI * donutRadius; // ≈ 376.99
        const presentStroke = totalToday > 0 ? (presentCount / totalToday) * donutCircumference : 0;
        const onLeaveStroke = totalToday > 0 ? (onLeaveCount / totalToday) * donutCircumference : 0;
        const absentStroke = totalToday > 0 ? (absentCount / totalToday) * donutCircumference : 0;

        return (
          <div className="mb-7 grid gap-6 xl:grid-cols-3">
            {/* 1. Dynamic Employee Growth Chart */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm xl:col-span-2">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-800">
                      Employee Overview
                    </h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-600">
                      Live Dynamic
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    Cumulative workforce growth and monthly hires for {selectedYear}
                  </p>
                </div>

                {/* Dynamic Year Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-400">Year:</span>
                  <div className="relative">
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                      className="appearance-none rounded-xl border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-sky-300 focus:border-sky-500 focus:outline-none cursor-pointer"
                    >
                      {availableYears.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                    <ChevronRight
                      size={14}
                      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Chart Container */}
              <div className="relative h-64 select-none">
                {/* Horizontal Y-Axis Grid Lines & Labels */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {yTicks.map((value, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="w-6 text-right text-[10px] font-medium text-slate-400">
                        {value}
                      </span>
                      <div className="h-px flex-1 bg-slate-100" />
                    </div>
                  ))}
                </div>

                {/* SVG Curves & Interactive Elements */}
                <div className="absolute inset-0 left-8">
                  <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="h-full w-full overflow-visible"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="dynamicGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.35" />
                        <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.10" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                      </linearGradient>
                      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#0284c7" floodOpacity="0.3" />
                      </filter>
                    </defs>

                    {/* Gradient Area Fill */}
                    {areaPath && (
                      <path
                        d={areaPath}
                        fill="url(#dynamicGrowthGradient)"
                        className="transition-all duration-500 ease-in-out"
                      />
                    )}

                    {/* Smooth Growth Line */}
                    {linePath && (
                      <path
                        d={linePath}
                        fill="none"
                        stroke="#0284c7"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#glow)"
                        className="transition-all duration-500 ease-in-out"
                      />
                    )}

                    {/* Hover Vertical Guide Line */}
                    {hoveredPoint && (
                      <line
                        x1={hoveredPoint.x}
                        y1={padTop}
                        x2={hoveredPoint.x}
                        y2={padTop + chartHeight}
                        stroke="#0284c7"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                        className="transition-all duration-150"
                      />
                    )}

                    {/* Data Points on Line */}
                    {points.map((pt) => {
                      const isHovered = hoveredPoint?.index === pt.index;
                      return (
                        <g key={pt.index}>
                          {/* Visible Dot */}
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isHovered ? 6 : 3.5}
                            fill="#ffffff"
                            stroke="#0284c7"
                            strokeWidth={isHovered ? 3 : 2}
                            className="transition-all duration-150"
                          />
                          {/* Invisible Wider Hover Target */}
                          <rect
                            x={pt.x - chartWidth / (points.length * 2)}
                            y={0}
                            width={chartWidth / points.length}
                            height={svgHeight}
                            fill="transparent"
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredPoint(pt)}
                            onMouseLeave={() => setHoveredPoint(null)}
                          />
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Floating Rich Tooltip */}
                {hoveredPoint && (
                  <div
                    className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-full rounded-xl border border-slate-700/80 bg-slate-900/95 px-3 py-2 text-white shadow-xl backdrop-blur-md transition-all duration-150"
                    style={{
                      left: `calc(2rem + ${(hoveredPoint.x / svgWidth) * 94}%)`,
                      top: `${Math.max(10, (hoveredPoint.y / svgHeight) * 90)}%`,
                    }}
                  >
                    <p className="text-[11px] font-bold tracking-wider text-sky-400">
                      {hoveredPoint.month} {selectedYear}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-xs">
                      <span className="text-slate-300">Total Workforce:</span>
                      <span className="font-extrabold text-white">{hoveredPoint.total}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-300">New Joined:</span>
                      <span className="font-bold text-emerald-400">+{hoveredPoint.newJoined || 0}</span>
                    </div>
                  </div>
                )}

                {/* Month Labels along Bottom */}
                <div className="absolute bottom-0 left-8 right-0 flex justify-between px-1">
                  {growthData.map((item, idx) => (
                    <span
                      key={item.month}
                      className={`text-[10px] font-medium transition-colors ${hoveredPoint?.index === idx ? "font-bold text-sky-600" : "text-slate-400"
                        }`}
                    >
                      {item.month}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* 2. Dynamic Workforce Today Attendance Donut */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-800">
                    Workforce Today
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-600">
                    Live
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-400">
                  Real-time employee attendance status
                </p>
              </div>

              {/* Dynamic SVG Donut */}
              <div className="flex justify-center py-2">
                <div className="relative flex h-48 w-48 items-center justify-center">
                  <svg className="h-full w-full" viewBox="0 0 160 160">
                    {/* Background Track Circle */}
                    <circle
                      cx="80"
                      cy="80"
                      r={donutRadius}
                      fill="transparent"
                      stroke="#f1f5f9"
                      strokeWidth="14"
                    />

                    {/* Absent Segment */}
                    {absentStroke > 0 && (
                      <circle
                        cx="80"
                        cy="80"
                        r={donutRadius}
                        fill="transparent"
                        stroke="#cbd5e1"
                        strokeWidth="14"
                        strokeDasharray={`${absentStroke} ${donutCircumference}`}
                        strokeDashoffset={-(presentStroke + onLeaveStroke)}
                        transform="rotate(-90 80 80)"
                        className="transition-all duration-700 ease-out"
                      />
                    )}

                    {/* On Leave Segment */}
                    {onLeaveStroke > 0 && (
                      <circle
                        cx="80"
                        cy="80"
                        r={donutRadius}
                        fill="transparent"
                        stroke="#fb923c"
                        strokeWidth="14"
                        strokeDasharray={`${onLeaveStroke} ${donutCircumference}`}
                        strokeDashoffset={-presentStroke}
                        transform="rotate(-90 80 80)"
                        className="transition-all duration-700 ease-out"
                      />
                    )}

                    {/* Present Segment */}
                    {presentStroke > 0 && (
                      <circle
                        cx="80"
                        cy="80"
                        r={donutRadius}
                        fill="transparent"
                        stroke="#0ea5e9"
                        strokeWidth="14"
                        strokeDasharray={`${presentStroke} ${donutCircumference}`}
                        strokeDashoffset={0}
                        transform="rotate(-90 80 80)"
                        className="transition-all duration-700 ease-out"
                      />
                    )}
                  </svg>

                  {/* Inner Text */}
                  <div className="absolute text-center">
                    <p className="text-3xl font-extrabold tracking-tight text-slate-800">
                      {totalToday > 0 ? `${presentPct}%` : "0%"}
                    </p>
                    <p className="text-xs font-semibold text-slate-400">
                      {totalToday > 0 ? "Present Today" : "No Active Staff"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Breakdown Legend with Real Dynamic Numbers */}
              <div className="mt-3 space-y-2.5">
                <div className="flex items-center justify-between rounded-xl px-2.5 py-1.5 transition hover:bg-slate-50">
                  <div className="flex items-center gap-2.5">
                    <span className="h-3 w-3 rounded-full bg-sky-500 shadow-sm shadow-sky-500/30" />
                    <span className="text-sm font-semibold text-slate-600">Present</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-sky-50 px-2 py-0.5 text-xs font-bold text-sky-600">
                      {totalToday > 0 ? Math.round((presentCount / totalToday) * 100) : 0}%
                    </span>
                    <span className="text-sm font-bold text-slate-800">{presentCount}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl px-2.5 py-1.5 transition hover:bg-slate-50">
                  <div className="flex items-center gap-2.5">
                    <span className="h-3 w-3 rounded-full bg-orange-400 shadow-sm shadow-orange-400/30" />
                    <span className="text-sm font-semibold text-slate-600">On Leave</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-orange-50 px-2 py-0.5 text-xs font-bold text-orange-600">
                      {totalToday > 0 ? Math.round((onLeaveCount / totalToday) * 100) : 0}%
                    </span>
                    <span className="text-sm font-bold text-slate-800">{onLeaveCount}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl px-2.5 py-1.5 transition hover:bg-slate-50">
                  <div className="flex items-center gap-2.5">
                    <span className="h-3 w-3 rounded-full bg-slate-300" />
                    <span className="text-sm font-semibold text-slate-600">Absent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
                      {totalToday > 0 ? Math.round((absentCount / totalToday) * 100) : 0}%
                    </span>
                    <span className="text-sm font-bold text-slate-800">{absentCount}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 px-2.5 pt-2 text-xs font-medium text-slate-400">
                  <span>Total Active Workforce</span>
                  <span className="font-bold text-slate-700">{totalToday} Employees</span>
                </div>
              </div>
            </section>
          </div>
        );
      })()}

      {/* =====================================================
              QUICK ACTIONS
          ====================================================== */}

      <section className="mb-7">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-800">
            Quick Actions
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Frequently used admin operations
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {quickActions.map((action, index) => {
            const Icon = action.icon;

            return (
              <button
                key={index}
                onClick={() => navigate(action.path)}
                className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-lg cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600 transition group-hover:bg-orange-300 group-hover:text-white">
                    <Icon size={20} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      {action.title}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {action.description}
                    </p>
                  </div>
                </div>

                <ChevronRight
                  size={17}
                  className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-sky-500"
                />
              </button>
            );
          })}
        </div>
      </section>

      {/* =====================================================
              DEPARTMENT + ACTIVITY
          ====================================================== */}

      <div className="mb-7 grid gap-6 xl:grid-cols-2">
        {/* Departments */}

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Department Overview
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Employee distribution
              </p>
            </div>

            <button className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
              <MoreHorizontal size={20} />
            </button>
          </div>

          <div className="space-y-5">
            {departments.map((department, index) => (
              <div key={index}>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-sky-500" />

                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        {department.name}
                      </p>

                      <p className="text-xs text-slate-400">
                        {department.employees} employees
                      </p>
                    </div>
                  </div>

                  <span className="text-sm font-bold text-slate-700">
                    {department.percentage}%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-600 transition-all duration-700"
                    style={{
                      width: `${department.percentage}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Activity */}

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Recent Activity
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Latest system activities
              </p>
            </div>

            <Activity size={20} className="text-sky-500" />
          </div>

          <div className="relative space-y-6">
            <div className="absolute left-5 top-3 h-[calc(100%-25px)] w-px bg-slate-200" />

            {activities.map((activity, index) => {
              const Icon = activity.icon;

              return (
                <div key={index} className="relative flex gap-4">
                  <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-4 border-white bg-sky-50 text-sky-600">
                    <Icon size={16} />
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-700">
                        {activity.title}
                      </p>

                      <span className="whitespace-nowrap text-[11px] text-slate-400">
                        {activity.time}
                      </span>
                    </div>

                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      {activity.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* =====================================================
              RECENT USERS
          ====================================================== */}

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Recent Employees
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Recently created employee profiles
            </p>
          </div>

          <button
            onClick={() => navigate("/admin/reports")}
            className="flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-100 transition hover:bg-sky-700 cursor-pointer"
          >
            View System Reports
            <ArrowUpRight size={16} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  User
                </th>

                <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Role
                </th>

                <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Status
                </th>

                <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {users.map((user, index) => (
                <tr
                  key={index}
                  className="group transition hover:bg-sky-50/40"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-xs font-bold text-white">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          {user.name}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                      {user.role}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    {user.status === "Active" ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-600">
                        <Clock3 size={12} />
                        Pending
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <button className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* =====================================================
              SYSTEM STATUS
          ====================================================== */}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white p-3 text-emerald-600 shadow-sm">
              <CheckCircle2 size={20} />
            </div>

            <div>
              <p className="text-xs font-medium text-emerald-600">
                System Status
              </p>

              <p className="mt-1 text-sm font-bold text-slate-700">
                All Systems Operational
              </p>
            </div>
          </div>
        </div>

        <div
          onClick={() => navigate("/admin/calendar")}
          className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5 cursor-pointer transition-all hover:bg-blue-50 hover:shadow-xs hover:-translate-y-0.5"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white p-3 text-blue-600 shadow-sm">
              <CalendarDays size={20} />
            </div>

            <div>
              <p className="text-xs font-medium text-blue-600">
                Today's Date
              </p>

              <p className="mt-1 text-sm font-bold text-slate-700">
                {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white p-3 text-orange-600 shadow-sm">
              <AlertCircle size={20} />
            </div>

            <div>
              <p className="text-xs font-medium text-orange-600">
                Pending Requests
              </p>

              <p className="mt-1 text-sm font-bold text-slate-700">
                08 Requests
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Calendar Modal (Read-Only) */}
      <DashboardCalendar
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        portalType="admin"
      />
    </div>
  );
};

export default AdminDashboard;
