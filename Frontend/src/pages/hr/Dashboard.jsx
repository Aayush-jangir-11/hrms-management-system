import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  UserCheck,
  Clock,
  AlertCircle,
  Plus,
  Eye,
  Zap,
  Loader,
  Building2,
  CheckCircle2,
  ListChecks,
  X,
  Calendar,
  CalendarDays,
  CalendarClock,
  Flag,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  FileText,
  Tag,
} from "lucide-react";
import ActivityItem from "../../components/hr/ActivityItem";
import StatCard from "../../components/common/StatCard";
import { useAuth } from "../../context/AuthContext";
import { getGreeting } from "../../utils/greeting";
import API from "../../services/api";
import { usePost, usePut } from "../../hooks/useApi";
import { getArrayData } from "../../utils/helpers";
import DashboardCalendar from "../../components/common/DashboardCalendar";
import PageLoader from "../../components/common/PageLoader";

const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

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

const HrDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [taskFilter, setTaskFilter] = useState("All");
  const [taskDeptFilter, setTaskDeptFilter] = useState("All");

  // Task Assignment Modal State
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    assignedTo: "",
    title: "",
    description: "",
    taskDate: getTodayStr(),
    dueDate: "",
    priority: "Medium",
    status: "Pending",
  });
  const [taskMessage, setTaskMessage] = useState("");

  /* ── TanStack Query: Fetch all dashboard datasets ── */
  const { data: dashboardData, isLoading: loading } = useQuery({
    queryKey: ["hr-dashboard-data"],
    queryFn: async () => {
      const [statsRes, deptRes, leaveRes, empRes, taskRes] = await Promise.allSettled([
        API.get("/hr/dashboard-stats"),
        API.get("/hr/departments"),
        API.get("/leave/all"),
        API.get("/hr/employees"),
        API.get("/tasks/all"),
      ]);

      const taskList = taskRes.status === "fulfilled" ? getArrayData(taskRes.value?.data, "tasks") : [];
      const employeeList = empRes.status === "fulfilled" ? getArrayData(empRes.value?.data, "employees") : [];

      let totalEmp = employeeList.length;
      let activeEmp = employeeList.filter(e => e.status === "Active" || !e.status).length;
      let deptList = [];

      if (statsRes.status === "fulfilled" && statsRes.value?.data?.success) {
        const d = statsRes.value.data.data;
        if (d.totalEmployees) totalEmp = d.totalEmployees;
        if (d.activeEmployees) activeEmp = d.activeEmployees;

        if (d.deptStats && d.deptStats.length > 0) {
          deptList = d.deptStats.map((ds) => ({
            name: ds.name,
            employees: ds.employees,
            growth: `${ds.percentage}% workforce`,
          }));
        }
      }

      if (deptRes.status === "fulfilled") {
        const fullDepts = getArrayData(deptRes.value?.data, "departments");
        if (deptList.length === 0) {
          deptList = fullDepts.map((dept) => {
            const count = (dept.teams || []).reduce(
              (acc, t) => acc + (t.assignedEmployeeIds ? t.assignedEmployeeIds.length : 0),
              0
            );
            return {
              name: dept.name,
              employees: count,
              growth: dept.growth || "+0%",
            };
          });
        }
      }

      let pendingLeavesCount = 0;
      let onLeaveTodayCount = 0;
      let recentLeaveActivities = [];

      if (leaveRes.status === "fulfilled") {
        const leaves = getArrayData(leaveRes.value?.data, "leaves");
        pendingLeavesCount = leaves.filter((l) => l.status === "Pending").length;

        // Accurate "On Leave Today": Check if today falls within [fromDate, toDate] for Approved leaves
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const onLeaveEmpIds = new Set();
        leaves.forEach((l) => {
          if (l.status === "Approved" && l.fromDate) {
            const from = new Date(l.fromDate);
            from.setHours(0, 0, 0, 0);
            const to = new Date(l.toDate || l.fromDate);
            to.setHours(23, 59, 59, 999);

            if (today >= from && today <= to) {
              const empId = l.employee?._id || l.employee?.id || l.employee || l.employeeId;
              if (empId) onLeaveEmpIds.add(empId.toString());
            }
          }
        });

        onLeaveTodayCount = onLeaveEmpIds.size;

        recentLeaveActivities = leaves.slice(0, 5).map((l) => ({
          icon: l.status === "Approved" ? UserCheck : Clock,
          title: `${l.employee?.name || l.employeeName || "Employee"} requested ${l.leaveType || "Leave"} (${l.days || 1} day${Number(l.days) > 1 ? "s" : ""})`,
          time: l.createdAt ? new Date(l.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Recently",
          status: l.status ? l.status.toLowerCase() : "pending",
        }));
      }

      return {
        statsData: {
          totalEmployees: totalEmp,
          activeEmployees: activeEmp,
          onLeaveEmployees: onLeaveTodayCount,
          pendingLeaveApprovals: pendingLeavesCount,
        },
        departments: deptList,
        employeeList,
        taskList,
        activities: recentLeaveActivities,
      };
    },
  });

  const statsData = dashboardData?.statsData || {
    totalEmployees: 0,
    activeEmployees: 0,
    onLeaveEmployees: 0,
    pendingLeaveApprovals: 0,
  };
  const departments = dashboardData?.departments || [];
  const employeeList = dashboardData?.employeeList || [];
  const taskList = dashboardData?.taskList || [];
  const activities = dashboardData?.activities || [];

  const statCards = [
    {
      icon: Users,
      title: "Total Employees",
      value: String(statsData.totalEmployees),
      subtitle: "All registered staff members",
      color: "bg-gradient-to-br from-sky-500 to-blue-600",
    },
    {
      icon: UserCheck,
      title: "Active Staff",
      value: String(statsData.activeEmployees),
      subtitle: `${statsData.totalEmployees > 0 ? Math.round((statsData.activeEmployees / statsData.totalEmployees) * 100) : 100}% duty active`,
      color: "bg-emerald-500",
    },
    {
      icon: AlertCircle,
      title: "On Leave Today",
      value: String(statsData.onLeaveEmployees),
      subtitle: "Staff on approved leave today",
      color: "bg-orange-500",
    },
    {
      icon: Clock,
      title: "Pending Approvals",
      value: String(statsData.pendingLeaveApprovals),
      subtitle: "Awaiting HR action",
      color: "bg-rose-500",
    },
  ];

  // ── TanStack Query Mutations (Must be called before any early return) ──
  const createTaskMutation = usePost("/tasks", {
    invalidateKeys: [["hr-dashboard-data"]],
    onSuccess: (data) => {
      if (data?.success) {
        setShowTaskModal(false);
        setTaskForm({
          assignedTo: "",
          title: "",
          description: "",
          taskDate: getTodayStr(),
          dueDate: "",
          priority: "Medium",
          status: "Pending",
        });
      } else {
        setTaskMessage(data?.message || "Failed to assign task.");
      }
    },
    onError: (err) => {
      console.error("[HR Dashboard] Task assign error:", err);
      setTaskMessage(err.response?.data?.message || "Failed to assign task.");
    },
  });

  const toggleTaskMutation = usePut("/tasks", {
    invalidateKeys: [["hr-dashboard-data"]],
    onError: (err) => {
      console.error("Failed to toggle task status:", err);
    },
  });

  const taskSubmitting = createTaskMutation.isPending;

  if (loading) {
    return <PageLoader message="Loading HR Dashboard..." />;
  }

  // Handle Assigning Task to Employee
  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!taskForm.assignedTo || !taskForm.title) {
      setTaskMessage("Please select an employee and enter task title.");
      return;
    }
    const today = getTodayStr();
    if (taskForm.taskDate < today) {
      setTaskMessage("Schedule date cannot be in the past. Please select today or a future date.");
      return;
    }
    if (taskForm.dueDate && taskForm.dueDate < taskForm.taskDate) {
      setTaskMessage("Due date cannot be before schedule date.");
      return;
    }

    setTaskMessage("");
    createTaskMutation.mutate(taskForm);
  };

  const handleToggleTaskStatus = (taskId) => {
    toggleTaskMutation.mutate({ id: `${taskId}/toggle`, data: {} });
  };

  // Extract unique departments for filtering
  const uniqueDepartments = Array.from(
    new Set(employeeList.map((emp) => emp.department).filter(Boolean))
  ).sort();

  // Filtered employees for the task modal (only show when a specific department is selected)
  const filteredEmployeesForTask =
    !taskDeptFilter || taskDeptFilter === "All"
      ? []
      : employeeList.filter((emp) => emp.department === taskDeptFilter);

  // Grouped employees by department for clean optgroup hierarchy
  const groupedEmployees = employeeList.reduce((acc, emp) => {
    const dept = emp.department || "General";
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(emp);
    return acc;
  }, {});

  return (
    <div>
      {/* ================= HERO SECTION ================= */}
      <div className="relative mb-7 overflow-hidden rounded-[28px] bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-200/50 md:p-8">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 right-32 h-56 w-56 rounded-full bg-indigo-400/20 blur-xl" />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md border border-white/20">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="tracking-wide">HR Operations & Workforce Hub</span>
            </div>

            <h1 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
              {getGreeting()}, {user?.name || "HR Manager"} 👋
            </h1>

            <p className="max-w-2xl text-xs font-medium text-sky-100 sm:text-sm">
              Live overview of organization workforce, department analytics, attendance tracking & employee leave approvals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setShowTaskModal(true)}
              className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-bold text-blue-700 shadow-lg shadow-blue-900/20 transition hover:-translate-y-0.5 hover:bg-sky-50 active:translate-y-0 cursor-pointer"
            >
              <ListChecks size={16} />
              Assign Task
            </button>

            <button
              onClick={() => navigate("/hr/employees")}
              className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/20 cursor-pointer"
            >
              <Plus size={16} />
              Onboard Employee
            </button>

            <button
              onClick={() => navigate("/hr/policies")}
              className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/20 cursor-pointer"
            >
              <Building2 size={16} />
              Working Policies
            </button>

            <button
              onClick={() => setCalendarOpen(true)}
              className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/20 cursor-pointer"
            >
              <CalendarDays size={16} />
              Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Recent Activities & Leave Requests
              </h2>

            </div>

            <button
              onClick={() => navigate("/hr/leave")}
              className="text-xs font-bold text-sky-600 hover:text-sky-700 cursor-pointer"
            >
              View All →
            </button>
          </div>

          <div className="divide-y divide-slate-50">
            {activities.length > 0 ? (
              activities.map((activity, idx) => (
                <ActivityItem key={idx} {...activity} />
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                No recent activity records found.
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800">Quick Actions</h2>
            <p className="text-xs text-slate-400 mt-0.5">Shortcuts for common HR operations</p>
          </div>
          <div className="p-4 space-y-3">
            <button
              onClick={() => setShowTaskModal(true)}
              className="w-full flex items-center gap-3 p-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition font-bold text-xs cursor-pointer"
            >
              <ListChecks size={18} />
              Assign Daily Task
            </button>
            <button
              onClick={() => navigate("/hr/employees")}
              className="w-full flex items-center gap-3 p-3.5 bg-sky-50 hover:bg-sky-100 text-sky-600 rounded-xl transition font-bold text-xs cursor-pointer"
            >
              <Plus size={18} />
              Add New Employee
            </button>
            <button
              onClick={() => navigate("/hr/departments")}
              className="w-full flex items-center gap-3 p-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition font-bold text-xs cursor-pointer"
            >
              <Building2 size={18} />
              Manage Departments & Teams
            </button>
            <button
              onClick={() => navigate("/hr/leave")}
              className="w-full flex items-center gap-3 p-3.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-xl transition font-bold text-xs cursor-pointer"
            >
              <CheckCircle2 size={18} />
              Approve Leave Requests
            </button>
          </div>
        </div>
      </div>

      {/* ================= TASK DEADLINES & DUE DATES SECTION ================= */}
      <div className="mt-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Section Header */}
        <div className="p-6 border-b border-slate-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 font-bold shadow-xs shrink-0">
              <CalendarClock size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-800">
                  Task Deadlines & Due Dates
                </h2>
                <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-bold text-sky-700">
                  {taskList.length} Total
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Live monitoring of employee task schedules, priority levels & submission deadlines
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Tabs */}
            <div className="flex items-center rounded-xl bg-slate-100 p-1 text-xs font-bold text-slate-600">
              {["All", "Pending", "Completed"].map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setTaskFilter(filter)}
                  className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${taskFilter === filter
                    ? "bg-white text-slate-800 shadow-xs font-extrabold"
                    : "text-slate-500 hover:text-slate-800"
                    }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowTaskModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition active:scale-95 cursor-pointer"
            >
              <Plus size={15} />
              <span>Assign Task</span>
            </button>
          </div>
        </div>

        {/* Structured Column Header Bar (Hidden on Mobile, Visible on MD+) */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50/80 border-b border-slate-100 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
          <div className="col-span-6">Task Title & Details</div>
          <div className="col-span-3">Assigned Employee</div>
          <div className="col-span-3">Schedule & Due Date</div>
        </div>

        {/* Structured Task List */}
        <div className="divide-y divide-slate-100">
          {(() => {
            const filteredTasks = taskList.filter((t) => {
              if (taskFilter === "All") return true;
              if (taskFilter === "Pending") return t.status !== "Completed";
              if (taskFilter === "Completed") return t.status === "Completed";
              return true;
            });

            if (filteredTasks.length === 0) {
              return (
                <div className="py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 mb-3">
                    <Calendar size={24} />
                  </div>
                  <p className="text-sm font-bold text-slate-700">No {taskFilter !== "All" ? taskFilter.toLowerCase() : ""} tasks found</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-medium">
                    {taskFilter === "All"
                      ? "No tasks have been assigned yet. Click 'Assign Task' to assign actions to team members."
                      : `There are currently no ${taskFilter.toLowerCase()} tasks in the system.`}
                  </p>
                </div>
              );
            }

            return filteredTasks.map((task) => {
              const dueInfo = formatDueBadge(task.dueDate, task.status);
              const isCompleted = task.status === "Completed";

              return (
                <div
                  key={task._id}
                  className="p-5 md:px-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:bg-slate-50/60 transition-colors"
                >
                  {/* Column 1: Task Title & Status Badges (Col-span 6) */}
                  <div className="md:col-span-6 space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-xs font-extrabold px-2.5 py-0.5 rounded-md border ${dueInfo.color}`}
                      >
                        {dueInfo.label}
                      </span>

                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${task.priority === "Urgent"
                          ? "bg-rose-100 text-rose-700"
                          : task.priority === "High"
                            ? "bg-amber-100 text-amber-800"
                            : task.priority === "Medium"
                              ? "bg-sky-100 text-sky-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                      >
                        {task.priority || "Medium"} Priority
                      </span>

                      <button
                        type="button"
                        onClick={() => handleToggleTaskStatus(task._id)}
                        title="Click to toggle status"
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full transition cursor-pointer hover:opacity-85 active:scale-95 ${isCompleted
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          : task.status === "In Progress"
                            ? "bg-sky-100 text-sky-700 hover:bg-sky-200"
                            : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                          }`}
                      >
                        {isCompleted ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {task.status || "Pending"}
                      </button>
                    </div>

                    <div>
                      <h3
                        className={`text-sm font-bold truncate ${isCompleted ? "line-through text-slate-400" : "text-slate-800"
                          }`}
                      >
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-xs text-slate-500 font-medium mt-0.5 line-clamp-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Column 2: Assigned Staff (Col-span 3 - Perfectly Aligned Vertical Column) */}
                  <div className="md:col-span-3 flex items-center gap-3 min-w-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                      {(task.assignedTo?.name || "E").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-slate-800 truncate">
                        {task.assignedTo?.name || "Unassigned"}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                        {task.assignedTo?.department || "General"} • {task.assignedTo?.position || "Staff"}
                      </p>
                    </div>
                  </div>

                  {/* Column 3: Dates Block (Col-span 3 - Perfectly Aligned Vertical Column) */}
                  <div className="md:col-span-3 text-xs space-y-1 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Calendar size={13} className="text-sky-500 shrink-0" />
                      <span className="text-slate-400 font-medium text-[11px]">Scheduled:</span>
                      <span className="font-bold text-slate-700 text-[11px]">
                        {task.taskDate
                          ? new Date(task.taskDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                          : "Today"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-600">
                      <CalendarClock size={13} className="text-rose-500 shrink-0" />
                      <span className="text-slate-400 font-medium text-[11px]">Due:</span>
                      <span className="font-bold text-slate-700 text-[11px]">
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                          : "No deadline"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* Departments Overview */}
      <div className="mt-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Department Workforce Overview
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live employee distribution across operational departments
            </p>
          </div>

          <button
            onClick={() => navigate("/hr/departments")}
            className="text-xs font-bold text-sky-600 hover:text-sky-700 cursor-pointer"
          >
            Manage Departments →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="text-left px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Department Name
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Assigned Workforce
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Workforce Share
                </th>
                <th className="text-right px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {departments.length > 0 ? (
                departments.map((dept, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-sky-50/30 transition"
                  >
                    <td className="px-6 py-4 text-xs font-bold text-slate-800">
                      {dept.name}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      <span className="bg-slate-100 font-bold px-3 py-1 rounded-full">
                        {dept.employees} Employees
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <span className="text-emerald-600 font-bold">
                        {dept.growth}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-right">
                      <button
                        onClick={() => navigate("/hr/departments")}
                        className="text-sky-600 hover:text-sky-700 font-bold text-xs cursor-pointer"
                      >
                        View Hierarchy
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-xs text-slate-400">
                    No department overview data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= ASSIGN TASK MODAL ================= */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 sm:p-6 md:p-8 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-[32px] bg-white p-7 sm:p-10 shadow-2xl shadow-slate-900/20 border border-slate-100/80 transition-all my-auto max-h-[92vh] overflow-y-auto">
            {/* Modal Gradient Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-200/50 mb-6">
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-xl" />
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur-md border border-white/25 shadow-inner shrink-0">
                    <ListChecks size={26} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                      Assign Daily Task to Staff
                    </h3>
                    <p className="text-xs text-sky-100 font-medium mt-1">
                      Directly assign tasks, set priority levels & deadiness for employee dashboards
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="rounded-2xl p-2.5 text-white/80 hover:bg-white/20 hover:text-white backdrop-blur-md transition cursor-pointer shrink-0"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Error / Alert Message */}
            {taskMessage && (
              <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200/80 p-4 text-xs font-bold text-rose-700 flex items-center gap-2.5 shadow-xs">
                <AlertCircle size={18} className="shrink-0 text-rose-600" />
                <span>{taskMessage}</span>
              </div>
            )}

            {/* Task Form */}
            <form onSubmit={handleCreateTask} className="space-y-6">
              {/* Select Department & Select Employee Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Department Selection */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Building2 size={14} className="text-sky-500" />
                    Select Department *
                  </label>
                  <select
                    required
                    value={taskDeptFilter}
                    onChange={(e) => {
                      const newDept = e.target.value;
                      setTaskDeptFilter(newDept);
                      setTaskForm((prev) => ({ ...prev, assignedTo: "" }));
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 transition-all cursor-pointer shadow-xs"
                  >
                    <option value="">-- Choose Department First --</option>
                    {uniqueDepartments.map((dept) => {
                      const count = employeeList.filter((e) => e.department === dept).length;
                      return (
                        <option key={dept} value={dept}>
                          {dept} ({count} staff)
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Select Employee */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <UserIcon size={14} className="text-sky-500" />
                    Select Employee *
                  </label>
                  <select
                    required
                    disabled={!taskDeptFilter || taskDeptFilter === "All"}
                    value={taskForm.assignedTo}
                    onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                    className={`w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm font-semibold outline-none transition-all cursor-pointer shadow-xs ${!taskDeptFilter || taskDeptFilter === "All"
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed border-dashed"
                      : "bg-slate-50/70 text-slate-800 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10"
                      }`}
                  >
                    {!taskDeptFilter || taskDeptFilter === "All" ? (
                      <option value="">-- Select Department First --</option>
                    ) : filteredEmployeesForTask.length === 0 ? (
                      <option value="">No staff members in this department</option>
                    ) : (
                      <>
                        <option value="">-- Choose Employee ({taskDeptFilter}) --</option>
                        {filteredEmployeesForTask.map((emp) => (
                          <option key={emp._id} value={emp._id}>
                            {emp.name} — {emp.position || "Staff"}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Task Title */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Tag size={14} className="text-sky-500" />
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prepare monthly department performance audit and submit report"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4.5 py-3.5 text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 transition-all shadow-xs"
                />
              </div>

              {/* Task Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <FileText size={14} className="text-sky-500" />
                  Detailed Instructions & Guidelines
                </label>
                <textarea
                  rows={4}
                  placeholder="Provide detailed action items, links, or expectations for the assigned employee..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 transition-all resize-none leading-relaxed shadow-xs"
                />
              </div>

              {/* Grid: Schedule Date, Due Date, Priority & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                    <Calendar size={13} className="text-sky-500" />
                    Schedule Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={getTodayStr()}
                    value={taskForm.taskDate}
                    onChange={(e) => setTaskForm({ ...taskForm, taskDate: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-xs font-bold text-slate-800 outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 transition-all cursor-pointer shadow-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                    <CalendarClock size={13} className="text-rose-500" />
                    Due Date
                  </label>
                  <input
                    type="date"
                    min={taskForm.taskDate || getTodayStr()}
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-xs font-bold text-slate-800 outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 transition-all cursor-pointer shadow-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                    <Flag size={13} className="text-amber-500" />
                    Priority Level
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-xs font-bold text-slate-800 outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 transition-all cursor-pointer shadow-xs"
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Urgent">Urgent Priority</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                    <CheckCircle2 size={13} className="text-emerald-500" />
                    Initial Status
                  </label>
                  <select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-xs font-bold text-slate-800 outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 transition-all cursor-pointer shadow-xs"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3.5 border-t border-slate-100 pt-6 mt-6">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="rounded-2xl border border-slate-200 px-6 py-3.5 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-all cursor-pointer active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={taskSubmitting}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 px-8 py-3.5 text-xs font-black text-white shadow-xl shadow-emerald-500/25 hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  <ListChecks size={18} />
                  <span>{taskSubmitting ? "Assigning Task..." : "Assign Task Now"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dashboard Calendar Modal (Read-Only) */}
      <DashboardCalendar
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        portalType="hr"
      />
    </div>
  );
};

export default HrDashboard;
