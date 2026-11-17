import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Plus,
  Moon,
  Sun,
  Laptop,
  Briefcase,
  Search,
  Building2,
  Filter,
  FileText,
  Layers,
  Globe,
  User,
  Users,
  Loader,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import PolicyStatCard from "../../components/hr/PolicyStatCard";
import PolicyCard from "../../components/hr/PolicyCard";
import PolicyFormModal from "../../components/hr/PolicyFormModal";
import PolicyAssignModal from "../../components/hr/PolicyAssignModal";
import PageLoader from "../../components/common/PageLoader";
import API from "../../services/api";
import { useGet, usePost, usePut, useDelete } from "../../hooks/useApi";
import { useDebounce } from "../../hooks/useDebounce";
import { usePermission } from "../../hooks/usePermission";
import { useToast } from "../../hooks/useToast";

const Policies = () => {
  const { can, isAdmin } = usePermission("policies");
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [activeScopeTab, setActiveScopeTab] = useState("All");
  const [activeCategoryFilter, setActiveCategoryFilter] = useState("All");

  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const [employeeSearchForm, setEmployeeSearchForm] = useState("");
  const [employeeSearchAssign, setEmployeeSearchAssign] = useState("");
  const [deptSearchForm, setDeptSearchForm] = useState("");
  const [teamSearchForm, setTeamSearchForm] = useState("");

  const [editingPolicy, setEditingPolicy] = useState(null);
  const [selectedPolicyForAssign, setSelectedPolicyForAssign] = useState(null);

  // Helper to map icon based on shiftType
  const getIconForShift = (shiftType) => {
    if (shiftType === "Night Shift") return Moon;
    if (shiftType === "Flexi-Hours") return Clock;
    if (shiftType === "Hybrid Shift") return Laptop;
    if (shiftType === "Part-Time") return Briefcase;
    return Sun;
  };

  const queryClient = useQueryClient();

  /* ── TanStack Query 1: Fetch Policies ── */
  const { data: policiesRes, isLoading: loading } = useGet("/policies", ["policies"]);

  const policies = useMemo(() => {
    if (policiesRes?.success && Array.isArray(policiesRes.data)) {
      return policiesRes.data.map((pol) => ({
        ...pol,
        id: pol._id,
        icon: getIconForShift(pol.shiftType),
        badgeColor:
          pol.shiftType === "Night Shift"
            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
            : pol.shiftType === "Flexi-Hours"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : pol.shiftType === "Hybrid Shift"
                ? "bg-purple-50 text-purple-700 border-purple-200"
                : "bg-sky-50 text-sky-700 border-sky-200",
      }));
    }
    return [];
  }, [policiesRes]);

  /* ── TanStack Query 2: Fetch Employees for Assignment ── */
  const { data: employeesRes } = useGet("/hr/employees", ["employees-for-policies"]);

  const employeesList = useMemo(() => {
    if (employeesRes?.success && Array.isArray(employeesRes.data)) {
      return employeesRes.data.map((emp) => ({
        id: emp._id,
        employeeId: emp.employeeId,
        name: emp.name,
        department: emp.department || "General",
        team: emp.team || "General Team",
        role: emp.role || "Employee",
      }));
    }
    return [];
  }, [employeesRes]);

  // Available Departments
  const departmentsList = [
    "Engineering",
    "IT & Infrastructure",
    "Sales & Marketing",
    "Human Resources",
    "Finance & Accounts",
    "Operations",
    "Customer Support",
  ];

  // Available Teams List mapped by Department
  const teamsList = [
    { id: "TEAM01", name: "Frontend Engineering Team", department: "Engineering" },
    { id: "TEAM02", name: "Backend & Systems Team", department: "Engineering" },
    { id: "TEAM03", name: "DevOps & Cloud Infra Team", department: "Engineering" },
    { id: "TEAM04", name: "IT Network & Helpdesk", department: "IT & Infrastructure" },
    { id: "TEAM05", name: "Talent Acquisition & HR Ops", department: "Human Resources" },
    { id: "TEAM06", name: "Enterprise Sales & Growth", department: "Sales & Marketing" },
    { id: "TEAM07", name: "Financial Analytics & Tax", department: "Finance & Accounts" },
    { id: "TEAM08", name: "Customer Support & Success", department: "Customer Support" },
    { id: "TEAM09", name: "Supply & Operations Ops", department: "Operations" },
  ];

  // Modal Form State
  const initialFormState = {
    name: "",
    category: "Work Schedule & Shift",
    targetScope: "Company-Wide",
    targetDepartments: [],
    targetTeams: [],
    targetEmployees: [],
    shiftType: "Regular Shift",
    startTime: "09:00 AM",
    endTime: "06:00 PM",
    workingHours: "9 Hours (1 Hr Lunch)",
    breakDuration: "60 Mins",
    workDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    gracePeriod: "15 Minutes",
    halfDayThreshold: "4.5 Hours",
    overtimeRule: "1.5x Hourly Rate",
    paidLeavesPerMonth: "2 Days",
    sandwichRuleEnabled: true,
    effectiveDate: new Date().toISOString().split("T")[0],
    description: "",
    status: "Active",
  };

  const [formData, setFormData] = useState(initialFormState);
  const [selectedEmployeesForAssign, setSelectedEmployeesForAssign] = useState([]);

  // Days list for checkboxes
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Open Add Policy Modal
  const handleOpenAddModal = () => {
    setEditingPolicy(null);
    setFormData(initialFormState);
    setEmployeeSearchForm("");
    setDeptSearchForm("");
    setTeamSearchForm("");
    setShowPolicyModal(true);
  };

  // Open Edit Policy Modal
  const handleOpenEditModal = (policy) => {
    setEditingPolicy(policy);
    setFormData({
      name: policy.name,
      category: policy.category || "Work Schedule & Shift",
      targetScope: policy.targetScope || "Company-Wide",
      targetDepartments: policy.targetDepartments || [],
      targetTeams: policy.targetTeams || [],
      targetEmployees: policy.targetEmployees || [],
      shiftType: policy.shiftType || "Regular Shift",
      startTime: policy.startTime || "09:00 AM",
      endTime: policy.endTime || "06:00 PM",
      workingHours: policy.workingHours || "9 Hours",
      breakDuration: policy.breakDuration || "60 Mins",
      workDays: Array.isArray(policy.workDays) ? policy.workDays : ["Mon", "Tue", "Wed", "Thu", "Fri"],
      gracePeriod: policy.gracePeriod || "15 Minutes",
      halfDayThreshold: policy.halfDayThreshold || "4.5 Hours",
      overtimeRule: policy.overtimeRule || "1.5x Hourly Rate",
      paidLeavesPerMonth: policy.paidLeavesPerMonth || "2 Days",
      sandwichRuleEnabled: policy.sandwichRuleEnabled !== undefined ? policy.sandwichRuleEnabled : true,
      effectiveDate: policy.effectiveDate || new Date().toISOString().split("T")[0],
      description: policy.description || "",
      status: policy.status || "Active",
    });
    setEmployeeSearchForm("");
    setDeptSearchForm("");
    setTeamSearchForm("");
    setShowPolicyModal(true);
  };

  // Handle Work Days Toggle in Form
  const toggleWorkDay = (day) => {
    setFormData((prev) => {
      const exists = prev.workDays.includes(day);
      const updated = exists ? prev.workDays.filter((d) => d !== day) : [...prev.workDays, day];
      return { ...prev, workDays: updated };
    });
  };

  // Handle Department Selection in Form
  const toggleDepartmentSelection = (dept) => {
    setFormData((prev) => {
      const exists = prev.targetDepartments.includes(dept);
      const updated = exists
        ? prev.targetDepartments.filter((d) => d !== dept)
        : [...prev.targetDepartments, dept];
      return { ...prev, targetDepartments: updated };
    });
  };

  // Handle Team Selection in Form
  const toggleTeamSelection = (teamName) => {
    setFormData((prev) => {
      const exists = prev.targetTeams.includes(teamName);
      const updated = exists
        ? prev.targetTeams.filter((t) => t !== teamName)
        : [...prev.targetTeams, teamName];
      return { ...prev, targetTeams: updated };
    });
  };

  // Handle Employee Selection in Form
  const toggleEmployeeSelectionInForm = (empId) => {
    setFormData((prev) => {
      const exists = prev.targetEmployees.includes(empId);
      const updated = exists
        ? prev.targetEmployees.filter((id) => id !== empId)
        : [...prev.targetEmployees, empId];
      return { ...prev, targetEmployees: updated };
    });
  };

  // ── TanStack Query Mutations ──
  const createPolicyMutation = usePost("/policies", {
    invalidateKeys: [["policies"]],
    onSuccess: (data) => {
      if (data && data.success) {
        showToast("Working policy created successfully!", "success");
        setShowPolicyModal(false);
      }
    },
    onError: (err) => {
      console.error("[HR] Error creating policy:", err);
      showToast(err.response?.data?.message || "Failed to create working policy", "error");
    },
  });

  const updatePolicyMutation = usePut("/policies", {
    invalidateKeys: [["policies"]],
    onSuccess: (data) => {
      if (data && data.success) {
        showToast("Working policy updated successfully!", "success");
        setShowPolicyModal(false);
      }
    },
    onError: (err) => {
      console.error("[HR] Error updating policy:", err);
      showToast(err.response?.data?.message || "Failed to update working policy", "error");
    },
  });

  const deletePolicyMutation = useDelete("/policies", {
    invalidateKeys: [["policies"]],
    onSuccess: (data) => {
      if (data && data.success) {
        showToast("Working policy deleted successfully!", "delete");
      }
    },
    onError: (err) => {
      console.error("[HR] Error deleting policy:", err);
      showToast(err.response?.data?.message || "Failed to delete working policy", "error");
    },
  });

  // Save Policy Form Submit (POST or PUT /api/policies)
  const handlePolicySubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("Please enter a Policy Name", "warning");
      return;
    }

    if (formData.targetScope === "Department-Specific" && formData.targetDepartments.length === 0) {
      showToast("Please select at least one department for this policy.", "warning");
      return;
    }

    if (formData.targetScope === "Team-Specific" && formData.targetTeams.length === 0) {
      showToast("Please select at least one team for this policy.", "warning");
      return;
    }

    if (formData.targetScope === "Employee-Specific" && formData.targetEmployees.length === 0) {
      showToast("Please select at least one employee for this custom policy.", "warning");
      return;
    }

    if (editingPolicy) {
      const targetId = editingPolicy._id || editingPolicy.id;
      updatePolicyMutation.mutate({ id: targetId, data: formData });
    } else {
      createPolicyMutation.mutate(formData);
    }
  };

  // Delete Policy (DELETE /api/policies/:id)
  const handleDeletePolicy = (id) => {
    if (!isAdmin && !can("delete")) {
      showToast("Permission Denied: Delete policy not allowed", "error");
      return;
    }
    if (window.confirm("Are you sure you want to delete this working policy?")) {
      deletePolicyMutation.mutate(id);
    }
  };

  // Open Assign Modal
  const handleOpenAssignModal = (policy) => {
    if (!can("assign") && !can("edit")) {
      showToast("Permission Denied: Assign policy not allowed", "error");
      return;
    }
    setSelectedPolicyForAssign(policy);
    setSelectedEmployeesForAssign([]);
    setEmployeeSearchAssign("");
    setShowAssignModal(true);
  };

  // Submit Assign Policy (POST /api/policies/:id/assign)
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (selectedEmployeesForAssign.length === 0) {
      showToast("Please select at least one employee.", "warning");
      return;
    }

    const targetId = selectedPolicyForAssign._id || selectedPolicyForAssign.id;
    const payload = {
      targetScope: "Employee-Specific",
      targetEmployees: selectedEmployeesForAssign,
    };

    try {
      const { data } = await API.post(`/policies/${targetId}/assign`, payload);
      if (data && data.success) {
        showToast(`Successfully assigned policy to ${selectedEmployeesForAssign.length} employees!`, "success");
        setShowAssignModal(false);
        queryClient.invalidateQueries({ queryKey: ["policies"] });
      }
    } catch (err) {
      console.error("[HR] Error assigning policy:", err);
      showToast(err.response?.data?.message || "Failed to assign working policy", "error");
    }
  };

  // Filter Policies based on Search, Scope Tab, and Category
  const filteredPolicies = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return policies.filter((p) => {
      const matchesSearch =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.shiftType.toLowerCase().includes(query) ||
        (p.targetDepartments || []).some((d) => d.toLowerCase().includes(query));

      const matchesScope =
        activeScopeTab === "All" ||
        (activeScopeTab === "Company-Wide" && p.targetScope === "Company-Wide") ||
        (activeScopeTab === "Department" && p.targetScope === "Department-Specific") ||
        (activeScopeTab === "Team" && p.targetScope === "Team-Specific") ||
        (activeScopeTab === "Employee" && p.targetScope === "Employee-Specific");

      const matchesCategory =
        activeCategoryFilter === "All" || p.category === activeCategoryFilter;

      return matchesSearch && matchesScope && matchesCategory;
    });
  }, [policies, debouncedSearch, activeScopeTab, activeCategoryFilter]);

  // Filter departments for form
  const filteredDepartmentsForForm = departmentsList.filter((dept) =>
    dept.toLowerCase().includes(deptSearchForm.toLowerCase())
  );

  // Filter teams for form
  const filteredTeamsForForm = teamsList.filter((t) =>
    t.name.toLowerCase().includes(teamSearchForm.toLowerCase()) ||
    t.department.toLowerCase().includes(teamSearchForm.toLowerCase())
  );

  // Filter employees for Working Policy creation/edit form ("By Employee" scope)
  const filteredEmployeesForForm = employeesList.filter((emp) =>
    emp.name.toLowerCase().includes(employeeSearchForm.toLowerCase()) ||
    emp.id.toLowerCase().includes(employeeSearchForm.toLowerCase()) ||
    emp.department.toLowerCase().includes(employeeSearchForm.toLowerCase()) ||
    emp.role.toLowerCase().includes(employeeSearchForm.toLowerCase())
  );

  // Filter employees for Assign Scope Modal
  const filteredEmployeesForAssign = employeesList.filter((emp) =>
    emp.name.toLowerCase().includes(employeeSearchAssign.toLowerCase()) ||
    emp.id.toLowerCase().includes(employeeSearchAssign.toLowerCase()) ||
    emp.department.toLowerCase().includes(employeeSearchAssign.toLowerCase()) ||
    emp.role.toLowerCase().includes(employeeSearchAssign.toLowerCase())
  );

  if (loading) {
    return <PageLoader message="Loading Working Policies & Rules..." />;
  }

  return (
    <div className="relative space-y-6">
      {/* ================= HEADER BANNER ================= */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-200/50 md:p-8">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-24 right-40 h-64 w-64 rounded-full bg-white/5 blur-xl" />

        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
              <Clock size={14} />
              Flexible Work Schedules & HR Policy Hub
            </div>
            <h1 className="text-2xl font-bold md:text-3xl lg:text-4xl">
              Working Hours & Policy Creator
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-blue-100 md:text-base">
              Create and manage customized work policies tailored for <strong>entire company</strong>, <strong>specific departments</strong>, or <strong>individual employees</strong>. Set different shift timings, break durations, and overtime rules.
            </p>
          </div>

          {can("create") && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-extrabold text-blue-600 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50 cursor-pointer whitespace-nowrap"
              title="Create Work Policy"
            >
              <Plus size={18} />
              Create Work Policy
            </button>
          )}
        </div>
      </div>

      {/* ================= STATS OVERVIEW CARDS ================= */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <PolicyStatCard
          title="Total Policies"
          count={policies.length}
          description="Active configured policy templates"
          icon={Clock}
          iconBgColor="bg-sky-50"
          iconColor="text-sky-600"
        />
        <PolicyStatCard
          title="Company-Wide"
          count={policies.filter((p) => p.targetScope === "Company-Wide").length}
          description="Applies to all employees"
          icon={Globe}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <PolicyStatCard
          title="Department Specific"
          count={policies.filter((p) => p.targetScope === "Department-Specific").length}
          description="Custom shift per department"
          icon={Building2}
          iconBgColor="bg-indigo-50"
          iconColor="text-indigo-600"
        />
        <PolicyStatCard
          title="Employee Specific"
          count={policies.filter((p) => p.targetScope === "Employee-Specific").length}
          description="Tailored individual schedules"
          icon={User}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* ================= TOOLBAR, SEARCH & SCOPE FILTER TABS ================= */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-4">
        {/* Scope Selector Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Scope:</span>
            {[
              { id: "All", label: "All Scopes", icon: Layers },
              { id: "Company-Wide", label: "Company-Wide", icon: Globe },
              { id: "Department", label: "Department Specific", icon: Building2 },
              { id: "Team", label: "Team Specific", icon: Users },
              { id: "Employee", label: "Employee Specific", icon: User },
            ].map((tab) => {
              const IconComp = tab.icon;
              const isActive = activeScopeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveScopeTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${isActive
                    ? "bg-sky-500 text-white shadow-md shadow-sky-200"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                >
                  <IconComp size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select
              value={activeCategoryFilter}
              onChange={(e) => setActiveCategoryFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white outline-none focus:border-sky-500 transition cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Work Schedule & Shift">Work Schedule & Shift</option>
              <option value="Remote & Hybrid">Remote & Hybrid</option>
              <option value="Leave & Attendance">Leave & Attendance</option>
              <option value="Overtime & Compensation">Overtime & Compensation</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search policies by title, shift type, or targeted department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-11 pr-4 text-xs font-medium text-slate-700 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
          />
        </div>
      </div>

      {/* ================= POLICIES GRID ================= */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPolicies.length > 0 ? (
          filteredPolicies.map((policy) => (
            <PolicyCard
              key={policy.id}
              policy={policy}
              onEdit={handleOpenEditModal}
              onDelete={handleDeletePolicy}
              onAssign={handleOpenAssignModal}
              can={can}
              isAdmin={isAdmin}
            />
          ))
        ) : (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200">
            <FileText size={36} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-700">No working policies found</h3>
            <p className="text-xs text-slate-400 mt-1">
              Try adjusting your search query or scope filter.
            </p>
          </div>
        )}
      </div>

      {/* ================= CREATE / EDIT WORK POLICY MODAL ================= */}
      <PolicyFormModal
        isOpen={showPolicyModal}
        onClose={() => setShowPolicyModal(false)}
        onSubmit={handlePolicySubmit}
        formData={formData}
        setFormData={setFormData}
        editingPolicy={editingPolicy}
        filteredDepartmentsForForm={filteredDepartmentsForForm}
        deptSearchForm={deptSearchForm}
        setDeptSearchForm={setDeptSearchForm}
        toggleDepartmentSelection={toggleDepartmentSelection}
        filteredTeamsForForm={filteredTeamsForForm}
        teamSearchForm={teamSearchForm}
        setTeamSearchForm={setTeamSearchForm}
        toggleTeamSelection={toggleTeamSelection}
        filteredEmployeesForForm={filteredEmployeesForForm}
        employeeSearchForm={employeeSearchForm}
        setEmployeeSearchForm={setEmployeeSearchForm}
        toggleEmployeeSelectionInForm={toggleEmployeeSelectionInForm}
        daysOfWeek={daysOfWeek}
        toggleWorkDay={toggleWorkDay}
      />

      {/* ================= ASSIGN POLICY SCOPE MODAL ================= */}
      <PolicyAssignModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onSubmit={handleAssignSubmit}
        selectedPolicy={selectedPolicyForAssign}
        filteredEmployeesForAssign={filteredEmployeesForAssign}
        selectedEmployeesForAssign={selectedEmployeesForAssign}
        setSelectedEmployeesForAssign={setSelectedEmployeesForAssign}
        employeeSearchAssign={employeeSearchAssign}
        setEmployeeSearchAssign={setEmployeeSearchAssign}
      />
    </div>
  );
};

export default Policies;
