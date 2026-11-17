import React, { useMemo, useState } from "react";
import {
  Building2,
  Users,
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  X,
  CheckCircle2,
  MoreHorizontal,
  ChevronDown,
  MapPin,
  Layers,
  Loader,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import DepartmentFormModal from "../../components/common/DepartmentFormModal";
import DepartmentViewModal from "../../components/common/DepartmentViewModal";
import TableSkeleton from "../../components/common/TableSkeleton";
import { useGet, usePost, usePut, useDelete } from "../../hooks/useApi";
import { useDebounce } from "../../hooks/useDebounce";
import { usePermission } from "../../hooks/usePermission";
import { useToast } from "../../hooks/useToast";

const Departments = () => {
  const { can } = usePermission("departments");
  const { showToast } = useToast();
  // Master Office Locations List
  const officeOptions = [
    "Headquarters - Mumbai",
    "Tech Hub - Bengaluru",
    "Regional Office - Delhi",
    "Operations Center - Pune",
    "Remote / Distributed",
  ];

  const officesFilterList = ["All Offices", ...officeOptions];

  /* ── TanStack Query 1: Fetch Departments ── */
  const { data: deptRes, isLoading: loadingDepts } = useGet(
    "/hr/departments",
    "hr-departments"
  );
  const departments = useMemo(() => {
    if (deptRes?.success && Array.isArray(deptRes.data)) {
      return deptRes.data.map((dept) => ({ ...dept, id: dept._id }));
    }
    return [];
  }, [deptRes]);

  /* ── TanStack Query 2: Fetch Employees for Master List ── */
  const { data: empRes } = useGet(
    "/hr/employees",
    "master-employees"
  );
  const masterEmployeesList = useMemo(() => {
    if (empRes?.success && Array.isArray(empRes.data)) {
      return empRes.data.map((emp) => ({
        id: emp.employeeId,
        name: emp.name,
        role: emp.position || emp.role,
      }));
    }
    return [];
  }, [empRes]);

  const loading = loadingDepts;

  // Filters State
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedOfficeFilter, setSelectedOfficeFilter] = useState("All Offices");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modal Controls
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingDepartment, setViewingDepartment] = useState(null);
  const [selectedTeamInViewModal, setSelectedTeamInViewModal] = useState("All Teams");

  const [showMenu, setShowMenu] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [editingDepartment, setEditingDepartment] = useState(null);

  const handleToggleMenu = (e, deptId) => {
    e.stopPropagation();
    if (showMenu === deptId) {
      setShowMenu(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 208;
    let itemsCount = 1;
    if (can("edit")) itemsCount += 1;
    if (can("delete")) itemsCount += 1;
    const menuHeight = itemsCount * 38 + 16;

    // Open UPWARDS above the button (table ke bahar)
    const topPos = rect.top >= menuHeight + 10
      ? rect.top - menuHeight - 6
      : rect.bottom + 6;

    const leftPos = Math.max(10, rect.right - menuWidth);

    setMenuPos({ top: topPos, left: leftPos });
    setShowMenu(deptId);
  };

  // Filtered Departments based on Search, Selected Office, and Status
  const filteredDepartments = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return departments.filter((dept) => {
      const matchesSearch =
        !query ||
        `${dept.name} ${dept.code} ${dept.head} ${dept.office} ${(dept.teams || []).map((t) => t.teamName + " " + t.teamHead).join(" ")}`
          .toLowerCase()
          .includes(query);

      const matchesOffice =
        selectedOfficeFilter === "All Offices" || dept.office === selectedOfficeFilter;

      const matchesStatus =
        statusFilter === "All" || dept.status === statusFilter;

      return matchesSearch && matchesOffice && matchesStatus;
    });
  }, [departments, debouncedSearch, selectedOfficeFilter, statusFilter]);

  // Computed Metrics
  const totalEmployeesCount = useMemo(() => {
    return departments.reduce((acc, curr) => {
      const deptStaffCount = (curr.teams || []).reduce(
        (tAcc, team) => tAcc + (team.assignedEmployeeIds ? team.assignedEmployeeIds.length : 0),
        0
      );
      return acc + (deptStaffCount || 0);
    }, 0);
  }, [departments]);

  const activeDepartmentsCount = useMemo(
    () => departments.filter((d) => d.status === "Active").length,
    [departments]
  );

  const totalTeamsCount = useMemo(
    () => departments.reduce((acc, curr) => acc + (curr.teams ? curr.teams.length : 0), 0),
    [departments]
  );

  // Open Add Modal
  const openAddModal = () => {
    setEditingDepartment(null);
    setShowModal(true);
  };

  // Open Edit Modal
  const openEditModal = (department) => {
    setEditingDepartment(department);
    setShowModal(true);
    setShowMenu(null);
  };

  // Open View Hierarchy Modal
  const openViewModal = (department, initialTeam = "All Teams") => {
    setViewingDepartment(department);
    setSelectedTeamInViewModal(initialTeam);
    setShowViewModal(true);
    setShowMenu(null);
  };

  // ── TanStack Query Mutations ──
  const { mutate: createDepartmentMutation } = usePost("/hr/departments", {
    invalidateKeys: ["hr-departments"],
    onSuccess: (dataRes) => {
      if (dataRes && dataRes.success) {
        showToast("Department created successfully!", "create");
        setShowModal(false);
      }
    },
    onError: (err) => {
      console.error("[HR] Error creating department:", err);
      showToast(err.response?.data?.message || "Failed to create department.", "error");
    },
  });

  const { mutate: updateDepartmentMutation } = usePut("/hr/departments", {
    invalidateKeys: ["hr-departments"],
    onSuccess: (dataRes) => {
      if (dataRes && dataRes.success) {
        showToast("Department updated successfully!", "update");
        setShowModal(false);
      }
    },
    onError: (err) => {
      console.error("[HR] Error updating department:", err);
      showToast(err.response?.data?.message || "Failed to update department.", "error");
    },
  });

  const { mutate: deleteDepartmentMutation } = useDelete("/hr/departments", {
    invalidateKeys: ["hr-departments"],
    onSuccess: (dataRes) => {
      setShowMenu(null);
      showToast("Department deleted successfully!", "delete");
    },
    onError: (err) => {
      console.error("[HR] Error deleting department:", err);
      showToast(err.response?.data?.message || "Failed to delete department.", "error");
    },
  });

  // Submit Department Form via TanStack Query Mutations
  const handleFormSubmit = (data) => {
    const payload = {
      office: data.office,
      name: data.name,
      code: data.code.toUpperCase(),
      head: data.head,
      headRole: data.headRole || "Department Head",
      status: data.status,
      teams: data.teams,
    };

    if (editingDepartment) {
      updateDepartmentMutation({
        id: editingDepartment._id || editingDepartment.id,
        data: payload,
      });
    } else {
      createDepartmentMutation(payload);
    }
  };

  // Delete Department via TanStack Query Mutation
  const deleteDepartment = (id) => {
    if (window.confirm("Are you sure you want to delete this department?")) {
      deleteDepartmentMutation(id);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* HERO BANNER */}
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-200/40 md:p-8">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-28 right-40 h-72 w-72 rounded-full bg-white/5 blur-xl" />

        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
              <Building2 size={14} />
              HR Portal • Office & Team-Based Department Architecture
            </div>

            <h1 className="text-2xl font-bold text-white md:text-3xl lg:text-4xl">
              HR Departments & Teams Management
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100 md:text-base">
              Define <strong>Office Location</strong>, <strong>Department Name & Code</strong>, <strong>Department Head</strong>, create <strong>Teams with Team Heads</strong>, and assign employees under specific teams using dropdown menus.
            </p>
          </div>

          {can("create") && (
            <button
              onClick={openAddModal}
              className="group flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-extrabold text-blue-600 shadow-xl transition duration-300 hover:-translate-y-1 hover:bg-blue-50 cursor-pointer whitespace-nowrap"
              title="Create Office Department"
            >
              <Plus size={18} className="transition-transform duration-300 group-hover:rotate-90" />
              Create Office Department
            </button>
          )}
        </div>
      </section>

      {/* STAT CARDS */}
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Total Departments
              </p>
              <h2 className="mt-1.5 text-3xl font-extrabold text-slate-800">
                {departments.length}
              </h2>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
              <Building2 size={24} />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500 font-medium">
            Across {officeOptions.length} office locations
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active Departments
              </p>
              <h2 className="mt-1.5 text-3xl font-extrabold text-slate-800">
                {activeDepartmentsCount}
              </h2>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={24} />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500 font-medium">
            Active operational units
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Created Sub-Teams
              </p>
              <h2 className="mt-1.5 text-3xl font-extrabold text-slate-800">
                {totalTeamsCount}
              </h2>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Layers size={24} />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500 font-medium">
            Teams with Team Heads
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Assigned Staff
              </p>
              <h2 className="mt-1.5 text-3xl font-extrabold text-slate-800">
                {totalEmployeesCount}
              </h2>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
              <Users size={24} />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500 font-medium">
            Assigned under specific teams
          </p>
        </div>
      </section>

      {/* OFFICE LOCATION TABS & SEARCH TOOLBAR */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-4">
        {/* Row 1: Office Location Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto py-0.5 border-b border-slate-100 pb-3">
          <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1.5 shrink-0">
            <MapPin size={14} className="text-sky-500" />
            Office:
          </span>
          {officesFilterList.map((office) => {
            const isActive = selectedOfficeFilter === office;
            return (
              <button
                key={office}
                type="button"
                onClick={() => setSelectedOfficeFilter(office)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${isActive
                  ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-200/60 font-extrabold"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/50"
                  }`}
              >
                {office}
              </button>
            );
          })}
        </div>

        {/* Row 2: Expanded Search Bar (Flex-1) & Status Dropdown on Right */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Input with Expanded Width (flex-1) */}
          <div className="relative flex-1 min-w-0">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search department by name, code, HOD, office location, team name or team lead..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-9 text-xs font-semibold text-slate-800 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status Filter Dropdown */}
          <div className="relative shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-4 pr-10 text-xs font-extrabold text-slate-700 outline-none transition hover:bg-white focus:border-sky-500 cursor-pointer shadow-2xs"
            >
              <option value="All">All Status</option>
              <option value="Active">Active Status</option>
              <option value="Inactive">Inactive Status</option>
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </section>

      {/* DEPARTMENT TABLE VIEW */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col gap-2 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Office Department Hierarchy & Teams
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Office Location → Department (Code & Head) → Created Teams (with Team Heads & Employees)
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Backend Sync Active
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/60 text-slate-500">
                <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider">
                  Office Location
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider">
                  Department & Code
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider">
                  Department Head (HOD)
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider">
                  Created Teams & Team Heads
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider">
                  Assigned Staff
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-bold uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <TableSkeleton rows={6} cols={7} hasAvatar={false} />
              ) : filteredDepartments.length > 0 ? (
                filteredDepartments.map((dept) => {
                  const deptStaffCount = dept.teams
                    ? dept.teams.reduce((sum, t) => sum + (t.assignedEmployeeIds ? t.assignedEmployeeIds.length : 0), 0)
                    : 0;

                  return (
                    <tr key={dept.id} className="group hover:bg-sky-50/30 transition duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                            <MapPin size={16} />
                          </div>
                          <span className="text-xs font-bold text-slate-800">
                            {dept.office}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{dept.name}</p>
                          <span className="inline-block mt-1 text-[10px] font-extrabold bg-sky-100 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-md">
                            {dept.code}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-[10px] font-bold text-white shadow-xs">
                            {(dept.head || "Head")
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{dept.head}</p>
                            <p className="text-[10px] text-slate-400">{dept.headRole || "Dept Head"}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {dept.teams && dept.teams.length > 0 ? (
                            dept.teams.map((t, idx) => (
                              <button
                                key={idx}
                                onClick={() => openViewModal(dept, t.teamName)}
                                title={`Team Head: ${t.teamHead || "Unassigned"}`}
                                className="text-[10px] font-extrabold bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1"
                              >
                                <span>{t.teamName}</span>
                                {t.teamHead && (
                                  <span className="opacity-75">({t.teamHead.split(" ")[0]})</span>
                                )}
                              </button>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">No teams created</span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <button
                          onClick={() => openViewModal(dept, "All Teams")}
                          className="flex items-center gap-1.5 text-xs font-extrabold text-sky-600 hover:text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100 transition cursor-pointer"
                        >
                          <Users size={14} />
                          <span>{deptStaffCount} Staff Assigned</span>
                        </button>
                      </td>

                      <td className="px-6 py-4">
                        {dept.status === "Active" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-extrabold text-emerald-700 border border-emerald-200">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-[11px] font-extrabold text-rose-700 border border-rose-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => handleToggleMenu(e, dept.id)}
                          className={`rounded-xl p-2 transition cursor-pointer ${
                            showMenu === dept.id
                              ? "bg-sky-100 text-sky-700 shadow-2xs"
                              : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          }`}
                          title="Actions Menu"
                        >
                          <MoreHorizontal size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Building2 size={32} className="text-slate-300" />
                      <p className="text-sm font-semibold text-slate-600">No departments match your search</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Reusable Department Creation & Edit Modal */}
      <DepartmentFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleFormSubmit}
        editingDepartment={editingDepartment}
        officeOptions={officeOptions}
        masterEmployeesList={masterEmployeesList}
      />

      {/* Reusable View Department & Team Hierarchy Roster Modal */}
      <DepartmentViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        department={viewingDepartment}
        initialTeam={selectedTeamInViewModal}
        masterEmployeesList={masterEmployeesList}
      />

      {/* Floating Action Menu (Opens Upward outside table) */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setShowMenu(null)}
          />
          {(() => {
            const activeDept = departments.find((d) => d.id === showMenu);
            if (!activeDept) return null;

            return (
              <div
                style={{ top: `${menuPos.top}px`, left: `${menuPos.left}px` }}
                className="fixed z-[9999] w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 text-left shadow-2xl animate-in fade-in zoom-in-95 duration-150"
              >
                <button
                  onClick={() => {
                    openViewModal(activeDept, "All Teams");
                    setShowMenu(null);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-sky-50 hover:text-sky-600 transition cursor-pointer"
                >
                  <Eye size={15} className="text-sky-500" />
                  View Hierarchy & Teams
                </button>

                {can("edit") && (
                  <button
                    onClick={() => {
                      openEditModal(activeDept);
                      setShowMenu(null);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition cursor-pointer"
                  >
                    <Edit3 size={15} className="text-blue-500" />
                    Edit Department & Teams
                  </button>
                )}

                {can("delete") && (
                  <button
                    onClick={() => {
                      deleteDepartment(activeDept.id);
                      setShowMenu(null);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  >
                    <Trash2 size={15} className="text-rose-500" />
                    Delete
                  </button>
                )}
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
};

export default Departments;
