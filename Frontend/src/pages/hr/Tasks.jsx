import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckSquare,
  Plus,
  Search,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit3,
  Building2,
  X,
  Loader,
  Flame,
  Zap,
  Minus,
  ArrowDown,
  Sparkles,
  UserCheck,
  FileText,
  User,
  Users,
  CalendarDays,
  AlignLeft,
  Check,
  Layers,
} from "lucide-react";
import API from "../../services/api";
import { useGet, usePost, usePut, useDelete } from "../../hooks/useApi";
import { useDebounce } from "../../hooks/useDebounce";
import { usePermission } from "../../hooks/usePermission";
import { useToast } from "../../hooks/useToast";
import { getArrayData } from "../../utils/helpers";

// Time formatting helpers for Hourly Task Assignment
const formatTime12h = (time24) => {
  if (!time24) return "";
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr || "0", 10);
  if (isNaN(h)) return time24;
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12 === 0 ? 12 : h % 12;
  const minStr = String(m).padStart(2, "0");
  return `${h}:${minStr} ${period}`;
}

const calculateHoursDuration = (start24, end24) => {
  if (!start24 || !end24) return "";
  const [h1, m1] = start24.split(":").map(Number);
  const [h2, m2] = end24.split(":").map(Number);
  if (isNaN(h1) || isNaN(h2)) return "";

  let totalMins = (h2 * 60 + (m2 || 0)) - (h1 * 60 + (m1 || 0));
  if (totalMins <= 0) totalMins += 24 * 60;

  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;

  let str = "";
  if (hrs > 0) str += `${hrs} hr${hrs > 1 ? "s" : ""}`;
  if (mins > 0) str += `${str ? " " : ""}${mins} min${mins > 1 ? "s" : ""}`;
  return str;
};

const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const Tasks = () => {
  const { can, isAdmin } = usePermission("tasks");
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [modalDeptFilter, setModalDeptFilter] = useState("");  // selected dept name
  const [deptSearch, setDeptSearch] = useState("");            // search in department list
  const [selectedTeam, setSelectedTeam] = useState(null);     // selected team object {teamName, assignedEmployeeIds}
  const [teamSearch, setTeamSearch] = useState("");            // search in team list
  const [empSearch, setEmpSearch] = useState("");              // search in employee list
  const [formError, setFormError] = useState("");

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    taskDate: getTodayStr(),
    dueDate: "",
    priority: "Medium",
    status: "Pending",
    isHourly: false,
    startTime: "10:00",
    endTime: "13:00",
  });

  /* ── TanStack Query: Fetch Tasks, Employees, and Departments ── */
  const { data: rawTasks, isLoading: loadingTasks } = useGet("/tasks/all", ["hr-tasks"]);
  const tasks = useMemo(() => getArrayData(rawTasks, "tasks"), [rawTasks]);

  const { data: rawEmployees, isLoading: loadingEmployees } = useGet("/hr/employees", ["hr-employees"]);
  const employees = useMemo(() => getArrayData(rawEmployees, "employees"), [rawEmployees]);

  const { data: rawDepartments } = useGet("/hr/departments", ["hr-departments"]);
  const departments = useMemo(() => getArrayData(rawDepartments, "departments"), [rawDepartments]);

  const loading = loadingTasks || loadingEmployees;

  // Dept names for main page filter (derived from employees)
  const deptNames = [...new Set(employees.map((e) => e.department).filter(Boolean))];

  // Grouped employees by department
  const groupedEmployees = employees.reduce((acc, emp) => {
    const dept = emp.department || "General";
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(emp);
    return acc;
  }, {});

  // ── Modal derived data ──
  // Full dept object from backend (has .teams[])
  // Falls back gracefully if departments API returned nothing
  const deptObj = departments.find((d) => d.name === modalDeptFilter) || null;

  // Teams for selected dept — from real DB data
  const deptTeams = deptObj?.teams || [];

  // Departments list for dropdown:
  // Use real backend dept objects if available, else synthesize from employee dept strings
  const deptDropdownList = departments.length > 0
    ? departments
    : deptNames.map((name) => ({ _id: name, name, teams: [] }));

  // Filtered departments by deptSearch
  const filteredDeptList = deptSearch.trim()
    ? deptDropdownList.filter((d) =>
      d.name?.toLowerCase().includes(deptSearch.trim().toLowerCase())
    )
    : deptDropdownList;
  // Filtered teams by teamSearch
  const filteredTeams = teamSearch.trim()
    ? deptTeams.filter((t) => t.teamName?.toLowerCase().includes(teamSearch.toLowerCase()))
    : deptTeams;

  // Employees belonging to selectedTeam (matched by employeeId)
  const teamEmployees = selectedTeam
    ? employees.filter((e) =>
      selectedTeam.assignedEmployeeIds?.includes(e.employeeId) ||
      selectedTeam.assignedEmployeeIds?.includes(e._id)
    )
    : [];

  // Filtered team employees by empSearch
  const filteredTeamEmps = empSearch.trim()
    ? teamEmployees.filter(
      (e) =>
        e.name?.toLowerCase().includes(empSearch.toLowerCase()) ||
        e.position?.toLowerCase().includes(empSearch.toLowerCase())
    )
    : teamEmployees;

  // Currently selected employee object
  const selectedEmp = employees.find((e) => e._id === form.assignedTo);

  // Avatar helpers
  const gradPalette = [
    "from-sky-400 to-blue-600",
    "from-violet-400 to-indigo-600",
    "from-emerald-400 to-teal-600",
    "from-amber-400 to-orange-500",
    "from-rose-400 to-pink-600",
    "from-cyan-400 to-sky-600",
  ];
  const getGrad = (name) => gradPalette[(name?.charCodeAt(0) || 0) % gradPalette.length];
  const getInitials = (name) =>
    name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";


  // Open Create Modal
  const handleOpenCreate = () => {
    if (!can("create")) {
      showToast("Permission Denied: Create task not allowed", "error");
      return;
    }
    setEditingTaskId(null);
    setForm({
      title: "",
      description: "",
      assignedTo: "",
      taskDate: getTodayStr(),
      dueDate: "",
      priority: "Medium",
      status: "Pending",
      isHourly: false,
      startTime: "10:00",
      endTime: "13:00",
    });
    setModalDeptFilter("");
    setDeptSearch("");
    setSelectedTeam(null);
    setTeamSearch("");
    setEmpSearch("");
    setFormError("");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (task) => {
    if (!can("edit")) {
      showToast("Permission Denied: Edit task not allowed", "error");
      return;
    }
    setEditingTaskId(task._id);
    const assignedEmpId = task.assignedTo?._id || task.assignedTo || "";
    const matchedEmp = employees.find((e) => e._id === assignedEmpId);

    setForm({
      title: task.title || "",
      description: task.description || "",
      assignedTo: assignedEmpId,
      taskDate: task.taskDate
        ? new Date(task.taskDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().split("T")[0]
        : "",
      priority: task.priority || "Medium",
      status: task.status || "Pending",
      isHourly: Boolean(task.isHourly || task.startTime),
      startTime: task.startTime || "10:00",
      endTime: task.endTime || "13:00",
    });

    if (matchedEmp?.department) {
      setModalDeptFilter(matchedEmp.department);
      // Try to find which team this employee belongs to
      const matchedDept = departments.find((d) => d.name === matchedEmp.department);
      const matchedTeam = matchedDept?.teams?.find(
        (t) =>
          t.assignedEmployeeIds?.includes(matchedEmp.employeeId) ||
          t.assignedEmployeeIds?.includes(matchedEmp._id)
      ) || null;
      setSelectedTeam(matchedTeam);
    } else {
      setModalDeptFilter("");
      setSelectedTeam(null);
    }
    setDeptSearch("");
    setTeamSearch("");
    setEmpSearch("");
    setFormError("");
    setIsModalOpen(true);
  };

  // ── TanStack Query Mutations ──
  const createTaskMutation = usePost("/tasks", {
    invalidateKeys: [["hr-tasks"]],
    onSuccess: (data) => {
      if (data?.success) {
        setIsModalOpen(false);
        showToast("Task created successfully", "success");
      } else {
        setFormError(data?.message || "Failed to create task.");
      }
    },
    onError: (err) => {
      console.error("[Tasks Page] Create error:", err);
      const msg = err.response?.data?.message || "Error creating task.";
      setFormError(msg);
      showToast(msg, "error");
    },
  });

  const updateTaskMutation = usePut("/tasks", {
    invalidateKeys: [["hr-tasks"]],
    onSuccess: (data) => {
      if (data?.success) {
        setIsModalOpen(false);
        showToast("Task updated successfully", "success");
      } else {
        setFormError(data?.message || "Failed to update task.");
      }
    },
    onError: (err) => {
      console.error("[Tasks Page] Update error:", err);
      const msg = err.response?.data?.message || "Error updating task.";
      setFormError(msg);
      showToast(msg, "error");
    },
  });

  const toggleTaskMutation = usePut("/tasks", {
    invalidateKeys: [["hr-tasks"]],
    onSuccess: () => {
      showToast("Task status updated", "info");
    },
    onError: (err) => {
      console.error("[Tasks Page] Toggle error:", err);
      showToast(err.response?.data?.message || "Failed to update status", "error");
    },
  });

  const deleteTaskMutation = useDelete("/tasks", {
    invalidateKeys: [["hr-tasks"]],
    onSuccess: () => {
      showToast("Task deleted successfully", "delete");
    },
    onError: (err) => {
      console.error("[Tasks Page] Delete error:", err);
      showToast(err.response?.data?.message || "Failed to delete task", "error");
    },
  });

  const isSubmitting = createTaskMutation.isPending || updateTaskMutation.isPending;

  // Submit Form (CREATE or UPDATE via TanStack Query Mutations)
  const handleSubmitTask = (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setFormError("Task title is required.");
      return;
    }
    if (!form.assignedTo) {
      setFormError("Please select an employee.");
      return;
    }
    const today = getTodayStr();
    if (form.taskDate < today) {
      setFormError("Schedule date cannot be in the past. Please select today or a future date.");
      return;
    }
    if (form.dueDate && form.dueDate < form.taskDate) {
      setFormError("Due date cannot be before schedule date.");
      return;
    }

    setFormError("");

    if (editingTaskId) {
      updateTaskMutation.mutate({ id: editingTaskId, data: form });
    } else {
      createTaskMutation.mutate(form);
    }
  };

  // Quick Toggle Status
  const handleToggleStatus = (taskId) => {
    if (!can("edit")) {
      showToast("Permission Denied: Update task status not allowed", "error");
      return;
    }
    toggleTaskMutation.mutate({ id: `${taskId}/toggle`, data: {} });
  };

  // Delete Task
  const handleDeleteTask = (taskId, taskTitle) => {
    if (!isAdmin && !can("delete")) {
      showToast("Permission Denied: Delete task not allowed", "error");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete task "${taskTitle}"?`))
      return;

    deleteTaskMutation.mutate(taskId);
  };

  // Smart Due Date Formatter
  const getDueInfo = (dueDate, status) => {
    if (status === "Completed") {
      return {
        label: "Completed",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        isOverdue: false,
      };
    }
    if (!dueDate) {
      return {
        label: "No Deadline",
        color: "bg-slate-50 text-slate-500 border-slate-200",
        isOverdue: false,
      };
    }

    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: `Overdue by ${Math.abs(diffDays)}d`,
        color: "bg-rose-50 text-rose-700 border-rose-200 font-bold",
        isOverdue: true,
      };
    }
    if (diffDays === 0) {
      return {
        label: "Due Today",
        color: "bg-amber-50 text-amber-700 border-amber-200 font-bold",
        isOverdue: false,
      };
    }
    if (diffDays === 1) {
      return {
        label: "Due Tomorrow",
        color: "bg-sky-50 text-sky-700 border-sky-200",
        isOverdue: false,
      };
    }

    return {
      label: `Due ${due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      color: "bg-slate-50 text-slate-600 border-slate-200",
      isOverdue: false,
    };
  };

  // Icon-based Priority Badge Renderer (replaces emojis with Lucide icons)
  const renderPriorityBadge = (priority) => {
    switch (priority) {
      case "Urgent":
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide px-2.5 py-1 rounded-full shrink-0 bg-rose-50 text-rose-600 border border-rose-200">
            <Flame size={12} className="text-rose-500 fill-rose-500/20" />
            Urgent
          </span>
        );
      case "High":
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide px-2.5 py-1 rounded-full shrink-0 bg-amber-50 text-amber-700 border border-amber-200">
            <Zap size={12} className="text-amber-500 fill-amber-500/20" />
            High
          </span>
        );
      case "Low":
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide px-2.5 py-1 rounded-full shrink-0 bg-slate-100 text-slate-600 border border-slate-200">
            <ArrowDown size={12} className="text-slate-400" />
            Low
          </span>
        );
      case "Medium":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide px-2.5 py-1 rounded-full shrink-0 bg-sky-50 text-sky-700 border border-sky-200">
            <Minus size={12} className="text-sky-500" />
            Medium
          </span>
        );
    }
  };

  // Filtered Tasks list
  const filteredTasks = useMemo(() => {
    const query = debouncedSearchQuery.trim().toLowerCase();
    return tasks.filter((task) => {
      // Search matching
      const titleMatch = !query || task.title?.toLowerCase().includes(query);
      const descMatch = !query || task.description?.toLowerCase().includes(query);
      const empName = task.assignedTo?.name || "";
      const nameMatch = !query || empName.toLowerCase().includes(query);

      const matchesSearch = titleMatch || descMatch || nameMatch;

      // Status matching
      const matchesStatus =
        statusFilter === "All" ||
        task.status === statusFilter;

      // Priority matching
      const matchesPriority =
        priorityFilter === "All" || task.priority === priorityFilter;

      // Department matching
      const taskDept = task.assignedTo?.department || "";
      const matchesDept = deptFilter === "All" || taskDept === deptFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesDept;
    });
  }, [tasks, debouncedSearchQuery, statusFilter, priorityFilter, deptFilter]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Action Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-sky-100 text-xs font-semibold mb-2.5">
              <CheckSquare size={14} />
              HR Staff Management
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Task Management & Assignments
            </h1>
            <p className="text-sky-100 text-sm mt-1 max-w-xl">
              Assign deliverables, track due dates, and manage team task statuses across departments.
            </p>
          </div>

          {can("create") && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm bg-white text-blue-700 hover:bg-sky-50 shadow-lg shadow-black/10 active:scale-[0.98] transition-all whitespace-nowrap cursor-pointer"
                title="Assign New Task"
              >
                <Plus size={18} className="stroke-[2.5]" />
                Assign New Task
              </button>
            </div>
          )}
        </div>

        {/* Decorative backdrop */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute left-1/2 -top-10 w-48 h-48 rounded-full bg-sky-400/20 blur-xl pointer-events-none" />
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search by task title, description, or employee name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-800 outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100 transition"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Department Filter */}
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-700 outline-none focus:border-sky-500 focus:bg-white cursor-pointer"
            >
              <option value="All">All Departments</option>
              {deptNames.map((d) => (
                <option key={d} value={d}>
                  {d} Department
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-700 outline-none focus:border-sky-500 focus:bg-white cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-700 outline-none focus:border-sky-500 focus:bg-white cursor-pointer"
            >
              <option value="All">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-16 flex flex-col items-center justify-center text-center">
          <Loader size={32} className="animate-spin text-sky-500 mb-3" />
          <p className="text-slate-500 text-sm font-semibold">Loading task assignments...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400 mx-auto mb-4">
            <CheckSquare size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No tasks found</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== "All" || priorityFilter !== "All" || deptFilter !== "All"
              ? "No tasks match your selected search criteria or filters."
              : "No tasks have been assigned yet. Click 'Assign New Task' to get started."}
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition cursor-pointer"
          >
            <Plus size={16} />
            Assign First Task
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTasks.map((task) => {
            const isCompleted = task.status === "Completed";
            const dueInfo = getDueInfo(task.dueDate, task.status);
            const emp = task.assignedTo || {};

            return (
              <div
                key={task._id}
                className={`group relative rounded-3xl border transition-all duration-200 flex flex-col justify-between p-5 sm:p-6 ${isCompleted
                  ? "bg-slate-50/70 border-slate-200 opacity-80 hover:opacity-100"
                  : dueInfo.isOverdue
                    ? "bg-white border-rose-200 shadow-md shadow-rose-50 hover:shadow-lg hover:border-rose-300"
                    : "bg-white border-slate-200/80 shadow-sm hover:shadow-md hover:border-sky-200"
                  }`}
              >
                <div>
                  {/* Top Bar: Assignee & Priority */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white font-black text-xs shadow-sm">
                        {emp.name ? emp.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {emp.name || "Unassigned Employee"}
                        </p>
                        <p className="text-[11px] font-semibold text-slate-400 truncate">
                          {emp.department || "Staff"} • {emp.position || "Member"}
                        </p>
                      </div>
                    </div>

                    {/* Priority Badge with Lucide Icon */}
                    {renderPriorityBadge(task.priority)}
                  </div>

                  {/* Task Title */}
                  <h4
                    className={`text-base font-bold transition ${isCompleted
                      ? "line-through text-slate-400"
                      : "text-slate-800"
                      }`}
                  >
                    {task.title}
                  </h4>

                  {/* Description */}
                  {task.description && (
                    <p className="mt-2 text-xs font-medium text-slate-500 line-clamp-3 leading-relaxed">
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Bottom Bar: Due Date, Hourly Slot & Actions */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-xl border ${dueInfo.color}`}
                    >
                      <Calendar size={12} />
                      {dueInfo.label}
                    </span>

                    {/* Hourly Task Window Badge */}
                    {(task.isHourly || (task.startTime && task.endTime)) && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-1 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 shadow-xs">
                        <Clock size={12} className="text-sky-600" />
                        {`${formatTime12h(task.startTime)} - ${formatTime12h(task.endTime)}`}
                      </span>
                    )}

                    <button
                      onClick={() => handleToggleStatus(task._id)}
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl transition cursor-pointer ${isCompleted
                        ? "bg-emerald-500 text-white hover:bg-emerald-600"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                    >
                      <CheckCircle2 size={12} />
                      {isCompleted ? "Completed" : "Mark Done"}
                    </button>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1">
                    {can("edit") && (
                      <button
                        onClick={() => handleOpenEdit(task)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition cursor-pointer"
                        title="Edit Task"
                      >
                        <Edit3 size={15} />
                      </button>
                    )}
                    {(isAdmin || can("delete")) && (
                      <button
                        onClick={() => handleDeleteTask(task._id, task.title)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Delete Task"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT TASK MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-100/80 max-h-[92vh] flex flex-col overflow-hidden animate-scale-up">

            {/* Top Gradient Banner */}
            <div className="h-1.5 w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600"></div>

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 sm:px-8 pt-6 pb-4 border-b border-slate-100/80 bg-slate-50/40">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20 font-bold">
                  {editingTaskId ? <Edit3 size={22} /> : <CheckSquare size={22} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">
                      {editingTaskId ? "Edit Task Parameters" : "Assign New Task"}
                    </h3>
                    <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-sky-100/70 text-sky-700">
                      {editingTaskId ? "Editing" : "Deliverable"}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">
                    {editingTaskId
                      ? "Update the scope, timeline, and assignment details"
                      : "Create and dispatch an actionable task to your team member"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all cursor-pointer"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body / Scrollable Content */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6">

              {/* Error Alert */}
              {formError && (
                <div className="rounded-2xl bg-rose-50/90 border border-rose-200/80 p-3.5 text-xs font-semibold text-rose-800 flex items-center gap-2.5 shadow-sm">
                  <div className="h-6 w-6 rounded-lg bg-rose-100 flex items-center justify-center shrink-0 text-rose-600">
                    <AlertCircle size={15} />
                  </div>
                  <span className="flex-1">{formError}</span>
                </div>
              )}

              <form id="taskModalForm" onSubmit={handleSubmitTask} className="space-y-6">

                {/* ─── Department → Team → Employee (3-step picker) ─── */}
                <div className="rounded-2xl bg-slate-50/60 border border-slate-200/70 p-4 sm:p-5 space-y-4">

                  {/* Section header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-sm">
                        <Users size={13} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Team & Assignee</p>
                        <p className="text-[10px] text-slate-400">Department → Team → Employee</p>
                      </div>
                    </div>
                    {selectedEmp && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                        <Check size={10} /> {selectedEmp.name}
                      </span>
                    )}
                  </div>

                  {/* STEP 1 — Department Search & Selector */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-sky-500 text-white text-[10px] font-black flex items-center justify-center shrink-0">1</span>
                        <label className="text-xs font-bold text-slate-700">Department <span className="text-rose-500">*</span></label>
                      </div>
                      {modalDeptFilter && (
                        <button
                          type="button"
                          onClick={() => {
                            setModalDeptFilter("");
                            setDeptSearch("");
                            setSelectedTeam(null);
                            setTeamSearch("");
                            setEmpSearch("");
                            setForm((p) => ({ ...p, assignedTo: "" }));
                          }}
                          className="text-[11px] font-semibold text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                        >
                          <X size={12} /> Reset Department
                        </button>
                      )}
                    </div>

                    {/* Department Search Input Bar */}
                    <div className="relative">
                      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search department by name…"
                        value={deptSearch}
                        onChange={(e) => setDeptSearch(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-8 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 transition"
                      />
                      {deptSearch && (
                        <button
                          type="button"
                          onClick={() => setDeptSearch("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>

                    {/* Department Select Dropdown */}
                    <div className="relative">
                      <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <select
                        required
                        value={modalDeptFilter}
                        onChange={(e) => {
                          setModalDeptFilter(e.target.value);
                          setSelectedTeam(null);
                          setTeamSearch("");
                          setEmpSearch("");
                          setForm((p) => ({ ...p, assignedTo: "" }));
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-8 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition shadow-sm cursor-pointer"
                      >
                        <option value="">
                          {filteredDeptList.length === 0
                            ? "No matching departments found"
                            : `-- Select Department (${filteredDeptList.length} available) --`}
                        </option>
                        {filteredDeptList.map((d) => (
                          <option key={d._id} value={d.name}>
                            {d.name} {d.teams?.length ? `(${d.teams.length} teams)` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* STEP 2 — Team list (shown after dept selected, hidden after team selected) */}
                  {modalDeptFilter && !selectedTeam && (
                    <div className="rounded-xl border border-sky-100 bg-white p-3.5 space-y-3">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                        <span className="h-5 w-5 rounded-full bg-sky-500 text-white text-[10px] font-black flex items-center justify-center shrink-0">2</span>
                        <p className="text-xs font-bold text-slate-700">{modalDeptFilter} — Teams</p>
                        <span className="ml-auto text-[10px] font-semibold text-slate-400">
                          {filteredTeams.length} {teamSearch ? "found" : "teams"}
                        </span>
                      </div>

                      {/* Team search bar */}
                      <div className="relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          placeholder={`Search team by name…`}
                          value={teamSearch}
                          onChange={(e) => setTeamSearch(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-8 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 transition"
                        />
                        {teamSearch && (
                          <button type="button" onClick={() => setTeamSearch("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition cursor-pointer">
                            <X size={12} />
                          </button>
                        )}
                      </div>

                      {/* Team list */}
                      {deptTeams.length === 0 ? (
                        <div className="flex flex-col items-center py-5 text-center">
                          <Users size={22} className="text-slate-300 mb-2" />
                          <p className="text-xs font-bold text-slate-500">No teams in this department yet</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Add teams from the Department management page</p>
                        </div>
                      ) : filteredTeams.length === 0 ? (
                        <div className="flex flex-col items-center py-4 text-center">
                          <p className="text-xs font-bold text-slate-500">No match for "{teamSearch}"</p>
                          <button type="button" onClick={() => setTeamSearch("")}
                            className="mt-1.5 text-[11px] text-sky-500 hover:text-sky-700 font-semibold cursor-pointer">
                            Clear search
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {filteredTeams.map((team) => {
                            const memberCount = employees.filter(
                              (e) =>
                                team.assignedEmployeeIds?.includes(e.employeeId) ||
                                team.assignedEmployeeIds?.includes(e._id)
                            ).length;
                            return (
                              <button
                                key={team._id}
                                type="button"
                                onClick={() => {
                                  setSelectedTeam(team);
                                  setEmpSearch("");
                                  setForm((p) => ({ ...p, assignedTo: "" }));
                                }}
                                className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-slate-200 bg-white hover:border-sky-400 hover:bg-sky-50/40 hover:shadow-sm transition-all cursor-pointer group text-left"
                              >
                                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                                  {team.teamName?.charAt(0)?.toUpperCase() || "T"}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-slate-800 truncate">{team.teamName}</p>
                                  {team.teamHead && (
                                    <p className="text-[10px] text-slate-400">Head: {team.teamHead}</p>
                                  )}
                                </div>
                                <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-lg shrink-0">
                                  {memberCount} member{memberCount !== 1 ? "s" : ""}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEP 3 — Employees of selected team (shown after team click, hidden after emp picked) */}
                  {selectedTeam && !form.assignedTo && (
                    <div className="rounded-xl border border-indigo-100 bg-white p-3.5 space-y-3">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                        <span className="h-5 w-5 rounded-full bg-indigo-500 text-white text-[10px] font-black flex items-center justify-center shrink-0">3</span>
                        <p className="text-xs font-bold text-slate-700">{selectedTeam.teamName} — Members</p>
                        <button
                          type="button"
                          onClick={() => { setSelectedTeam(null); setEmpSearch(""); }}
                          className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-rose-500 cursor-pointer transition"
                        >
                          <X size={11} /> Back
                        </button>
                      </div>

                      {/* Employee search bar */}
                      <div className="relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          placeholder={`Search employee by name…`}
                          value={empSearch}
                          onChange={(e) => setEmpSearch(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-8 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition"
                        />
                        {empSearch && (
                          <button type="button" onClick={() => setEmpSearch("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition cursor-pointer">
                            <X size={12} />
                          </button>
                        )}
                      </div>

                      {/* Employee cards */}
                      {teamEmployees.length === 0 ? (
                        <div className="flex flex-col items-center py-5 text-center">
                          <User size={22} className="text-slate-300 mb-2" />
                          <p className="text-xs font-bold text-slate-500">No employees assigned to this team</p>
                        </div>
                      ) : filteredTeamEmps.length === 0 ? (
                        <div className="flex flex-col items-center py-4 text-center">
                          <p className="text-xs font-bold text-slate-500">No match for "{empSearch}"</p>
                          <button type="button" onClick={() => setEmpSearch("")}
                            className="mt-1.5 text-[11px] text-sky-500 hover:text-sky-700 font-semibold cursor-pointer">
                            Clear search
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[190px] overflow-y-auto pr-0.5">
                          {filteredTeamEmps.map((emp) => (
                            <button
                              key={emp._id}
                              type="button"
                              onClick={() => setForm((p) => ({ ...p, assignedTo: emp._id }))}
                              className="flex flex-col items-center text-center p-2.5 rounded-xl border-2 border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/40 hover:shadow-sm transition-all cursor-pointer group"
                            >
                              <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${getGrad(emp.name)} text-white font-black text-sm flex items-center justify-center shadow-sm mb-1.5 group-hover:scale-110 transition-transform`}>
                                {getInitials(emp.name)}
                              </div>
                              <p className="text-[11px] font-bold text-slate-800 truncate w-full">{emp.name}</p>
                              <p className="text-[10px] text-slate-400 truncate w-full">{emp.position || "Member"}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEP 4 — Confirmed employee (shown after employee picked) */}
                  {form.assignedTo && selectedEmp && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-3.5">
                      <div className="flex items-center gap-2 border-b border-emerald-100 pb-2.5 mb-3">
                        <span className="h-5 w-5 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center shrink-0">✓</span>
                        <p className="text-xs font-bold text-slate-700">Assigned To</p>
                        <button
                          type="button"
                          onClick={() => { setForm((p) => ({ ...p, assignedTo: "" })); }}
                          className="ml-auto flex items-center gap-1 text-[11px] font-bold text-rose-500 hover:text-rose-700 cursor-pointer transition"
                        >
                          <X size={11} /> Change
                        </button>
                      </div>
                      <div className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-emerald-200 shadow-sm">
                        <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${getGrad(selectedEmp.name)} text-white font-black text-base flex items-center justify-center shadow-sm shrink-0`}>
                          {getInitials(selectedEmp.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-slate-800 truncate">{selectedEmp.name}</p>
                          <p className="text-[11px] text-slate-500">{selectedEmp.position || "Member"} · {selectedTeam?.teamName || selectedEmp.department}</p>
                          {selectedEmp.email && <p className="text-[10px] text-slate-400 truncate mt-0.5">{selectedEmp.email}</p>}
                        </div>
                        <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                      </div>
                    </div>
                  )}

                  {/* Empty — no dept selected */}
                  {!modalDeptFilter && (
                    <div className="flex flex-col items-center py-6 rounded-xl border border-dashed border-slate-200 bg-white text-center">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-sky-100 to-indigo-100 flex items-center justify-center text-sky-400 mb-2">
                        <Users size={20} />
                      </div>
                      <p className="text-xs font-bold text-slate-600">Select a department to begin</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Teams and employees will appear here</p>
                    </div>
                  )}

                  {/* Hidden required field */}
                  <input type="text" required readOnly tabIndex={-1}
                    value={form.assignedTo}
                    style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 0, height: 0 }}
                  />
                </div>

                {/* 2. Task Details Section */}
                <div className="space-y-4">
                  {/* Task Title */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        Task Title <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] text-slate-400 font-medium">Clear & Actionable</span>
                    </div>
                    <div className="relative">
                      <Sparkles size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Prepare Q3 Financial Audit Summary & Report"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        className="w-full rounded-xl border border-slate-200/90 bg-white pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Task Description */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        Description & Instructions
                      </label>
                      <span className="text-[11px] text-slate-400 font-medium">Optional specifications</span>
                    </div>
                    <div className="relative">
                      <textarea
                        rows={3}
                        placeholder="Detail the deliverables, checkpoints, links, or expectations for completing this task..."
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="w-full rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition shadow-sm resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Priority Level Selector Cards */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Priority Level <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      {
                        level: "Low",
                        icon: ArrowDown,
                        color: "emerald",
                        bg: "bg-emerald-50/80 text-emerald-700 border-emerald-300 ring-emerald-400/20",
                        inactive: "hover:border-emerald-200 hover:bg-emerald-50/30 text-slate-600",
                      },
                      {
                        level: "Medium",
                        icon: Minus,
                        color: "sky",
                        bg: "bg-sky-50/80 text-sky-700 border-sky-300 ring-sky-400/20",
                        inactive: "hover:border-sky-200 hover:bg-sky-50/30 text-slate-600",
                      },
                      {
                        level: "High",
                        icon: Zap,
                        color: "amber",
                        bg: "bg-amber-50/80 text-amber-700 border-amber-300 ring-amber-400/20",
                        inactive: "hover:border-amber-200 hover:bg-amber-50/30 text-slate-600",
                      },
                      {
                        level: "Urgent",
                        icon: Flame,
                        color: "rose",
                        bg: "bg-rose-50/80 text-rose-700 border-rose-300 ring-rose-400/20",
                        inactive: "hover:border-rose-200 hover:bg-rose-50/30 text-slate-600",
                      },
                    ].map((p) => {
                      const Icon = p.icon;
                      const isSelected = form.priority === p.level;
                      return (
                        <button
                          key={p.level}
                          type="button"
                          onClick={() => setForm({ ...form, priority: p.level })}
                          className={`relative flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${isSelected
                            ? `${p.bg} ring-2 shadow-sm font-extrabold`
                            : `bg-white border-slate-200 ${p.inactive}`
                            }`}
                        >
                          <Icon size={14} className={isSelected ? "" : "text-slate-400"} />
                          <span>{p.level}</span>
                          {isSelected && (
                            <span className="absolute top-1 right-1.5 h-1.5 w-1.5 rounded-full bg-current"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Timeline & Status Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Schedule Date */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Schedule Date <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="date"
                        required
                        min={getTodayStr()}
                        value={form.taskDate}
                        onChange={(e) => setForm({ ...form, taskDate: e.target.value })}
                        className="w-full rounded-xl border border-slate-200/90 bg-white pl-10 pr-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition shadow-sm cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Due Date */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        Due Date
                      </label>
                      {/* Quick Due presets */}
                      <div className="flex items-center gap-1">
                        {[
                          { label: "+1d", days: 1 },
                          { label: "+3d", days: 3 },
                          { label: "+7d", days: 7 },
                        ].map((btn) => (
                          <button
                            key={btn.label}
                            type="button"
                            onClick={() => {
                              const d = new Date(form.taskDate || new Date());
                              d.setDate(d.getDate() + btn.days);
                              setForm({ ...form, dueDate: d.toISOString().split("T")[0] });
                            }}
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-sky-100 hover:text-sky-700 text-slate-500 transition cursor-pointer"
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="relative">
                      <CalendarDays size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="date"
                        min={form.taskDate || getTodayStr()}
                        value={form.dueDate}
                        onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                        className="w-full rounded-xl border border-slate-200/90 bg-white pl-10 pr-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition shadow-sm cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Hourly Task Schedule Section (Time Window / Hours Section) */}
                <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg bg-sky-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                        <Clock size={13} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Hourly Schedule (Time Window)</p>
                        <p className="text-[10px] text-slate-500 font-medium">Assign specific hours (e.g., 10:00 AM to 1:00 PM)</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, isHourly: !p.isHourly }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${form.isHourly
                        ? "bg-sky-500 text-white shadow-md shadow-sky-200"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                    >
                      <Clock size={12} />
                      <span>{form.isHourly ? "Hourly Active" : "Enable Hourly Window"}</span>
                    </button>
                  </div>

                  {form.isHourly && (
                    <div className="space-y-3 pt-1 border-t border-sky-100/80">
                      {/* Quick Time Window Presets */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                          Quick Presets
                        </label>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {[
                            { label: "10 AM - 1 PM (3 hrs)", start: "10:00", end: "13:00" },
                            { label: "2 PM - 5 PM (3 hrs)", start: "14:00", end: "17:00" },
                            { label: "9 AM - 12 PM (3 hrs)", start: "09:00", end: "12:00" },
                            { label: "10 AM - 6 PM (Full Day)", start: "10:00", end: "18:00" },
                          ].map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() =>
                                setForm((p) => ({
                                  ...p,
                                  startTime: preset.start,
                                  endTime: preset.end,
                                }))
                              }
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${form.startTime === preset.start && form.endTime === preset.end
                                ? "bg-sky-500 text-white border-sky-500 shadow-sm"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-sky-50 hover:border-sky-300"
                                }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Start Time and End Time Inputs */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Start Time
                          </label>
                          <input
                            type="time"
                            value={form.startTime}
                            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            End Time
                          </label>
                          <input
                            type="time"
                            value={form.endTime}
                            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                          />
                        </div>
                      </div>

                      {/* Live Calculated Time Slot Banner */}
                      {form.startTime && form.endTime && (
                        <div className="p-2.5 rounded-xl bg-white border border-sky-200 text-sky-900 text-xs font-bold flex items-center justify-between shadow-xs">
                          <span className="flex items-center gap-1.5">
                            <Sparkles size={13} className="text-sky-500" />
                            Target Window: {formatTime12h(form.startTime)} to {formatTime12h(form.endTime)}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[10px] font-black">
                            {calculateHoursDuration(form.startTime, form.endTime)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 6. Status Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Initial Task Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, status: "Pending" })}
                      className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer border ${form.status === "Pending"
                        ? "bg-amber-500/10 border-amber-400/50 text-amber-700 font-extrabold ring-2 ring-amber-400/20"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                      <Clock size={14} className={form.status === "Pending" ? "text-amber-600" : "text-slate-400"} />
                      <span>Pending</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setForm({ ...form, status: "Completed" })}
                      className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer border ${form.status === "Completed"
                        ? "bg-emerald-500/10 border-emerald-400/50 text-emerald-700 font-extrabold ring-2 ring-emerald-400/20"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                      <CheckCircle2 size={14} className={form.status === "Completed" ? "text-emerald-600" : "text-slate-400"} />
                      <span>Completed</span>
                    </button>
                  </div>
                </div>

              </form>
            </div>

            {/* Modal Footer / Action CTA */}
            <div className="flex items-center justify-end gap-3 px-6 sm:px-8 py-4 border-t border-slate-100 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="taskModalForm"
                disabled={isSubmitting}
                className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white text-xs font-bold shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader size={14} className="animate-spin" />
                    <span>Saving Task...</span>
                  </>
                ) : editingTaskId ? (
                  <>
                    <Check size={15} />
                    <span>Update Task</span>
                  </>
                ) : (
                  <>
                    <Plus size={15} />
                    <span>Assign Task</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
