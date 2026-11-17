import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Plus,
  Users,
  UserCog,
  Building2,
  Clock,
  FileText,
  WalletCards,
  BarChart3,
  Settings,
  X,
  Check,
  ChevronDown,
  Save,
  Lock,
  Download,
  UserPlus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  CheckSquare,
} from "lucide-react";
import API from "../../services/api";
import PageLoader from "../../components/common/PageLoader";
import { useGet, usePost, usePut, useDelete } from "../../hooks/useApi";
import { useToast } from "../../hooks/useToast";

const RolesPermissions = () => {
  const { showToast } = useToast();
  // =========================
  // DYNAMIC STATE FROM BACKEND
  // =========================
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [rolePermissions, setRolePermissions] = useState({});

  const [selectedModule, setSelectedModule] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState({ name: "", description: "" });

  // =========================
  // MODULES DEFINITION
  // =========================
  const modules = [
    {
      key: "employees",
      title: "Employee Management",
      description: "Manage employee profiles, onboarding & records",
      icon: Users,
      permissions: [
        { key: "view", label: "View Employees", icon: Users },
        { key: "create", label: "Create Employees", icon: UserPlus },
        { key: "edit", label: "Edit Employees", icon: Pencil },
        { key: "delete", label: "Delete Employees", icon: Trash2 },
        { key: "export", label: "Export Employees", icon: Download },
      ],
    },
    {
      key: "attendance",
      title: "Attendance Tracker",
      description: "Manage attendance, clock-in and working hours",
      icon: Clock,
      permissions: [
        { key: "view", label: "View Attendance", icon: Clock },
        { key: "mark", label: "Mark Attendance", icon: Check },
        { key: "edit", label: "Edit Attendance", icon: Pencil },
        { key: "approve", label: "Approve Attendance", icon: CheckCircle2 },
        { key: "export", label: "Export Attendance", icon: Download },
      ],
    },
    {
      key: "leave",
      title: "Leave Management",
      description: "Manage employee leaves, balances and approvals",
      icon: FileText,
      permissions: [
        { key: "view", label: "View Leaves", icon: FileText },
        { key: "apply", label: "Apply Leave", icon: Plus },
        { key: "approve", label: "Approve Leave", icon: CheckCircle2 },
        { key: "reject", label: "Reject Leave", icon: XCircle },
        { key: "cancel", label: "Cancel Leave", icon: X },
      ],
    },
    {
      key: "payroll",
      title: "Payroll & Slips",
      description: "Manage salary disbursements and payroll processing",
      icon: WalletCards,
      permissions: [
        { key: "view", label: "View Payroll", icon: WalletCards },
        { key: "process", label: "Process Payroll", icon: Check },
        { key: "approve", label: "Approve Payroll", icon: CheckCircle2 },
        { key: "download", label: "Download Payslips", icon: Download },
      ],
    },
    {
      key: "reports",
      title: "Reports & Analytics",
      description: "Access executive HR reports and downloadable analytics",
      icon: BarChart3,
      permissions: [
        { key: "view", label: "View Reports", icon: BarChart3 },
        { key: "export", label: "Export Reports", icon: Download },
      ],
    },
    {
      key: "departments",
      title: "Departments",
      description: "Manage organization structure and team leads",
      icon: Building2,
      permissions: [
        { key: "view", label: "View Departments", icon: Building2 },
        { key: "create", label: "Create Departments", icon: Plus },
        { key: "edit", label: "Edit Departments", icon: Pencil },
        { key: "delete", label: "Delete Departments", icon: Trash2 },
      ],
    },
    {
      key: "policies",
      title: "Work Policies & Shifts",
      description: "Manage working hours, shifts and employee assignments",
      icon: Clock,
      permissions: [
        { key: "view", label: "View Policies", icon: Clock },
        { key: "create", label: "Create Policies", icon: Plus },
        { key: "edit", label: "Edit Policies", icon: Pencil },
        { key: "delete", label: "Delete Policies", icon: Trash2 },
        { key: "assign", label: "Assign Policies", icon: Users },
      ],
    },
    {
      key: "tasks",
      title: "Task Assignments",
      description: "Assign deliverables, monitor deadlines and project tasks",
      icon: CheckSquare,
      permissions: [
        { key: "view", label: "View Tasks", icon: CheckSquare },
        { key: "create", label: "Create Tasks", icon: Plus },
        { key: "edit", label: "Edit Tasks", icon: Pencil },
        { key: "delete", label: "Delete Tasks", icon: Trash2 },
      ],
    },
    {
      key: "users",
      title: "User Accounts",
      description: "Manage system user credentials and login access",
      icon: UserCog,
      permissions: [
        { key: "view", label: "View Users", icon: Users },
        { key: "create", label: "Create Users", icon: UserPlus },
        { key: "edit", label: "Edit Users", icon: Pencil },
        { key: "delete", label: "Delete Users", icon: Trash2 },
      ],
    },
    {
      key: "settings",
      title: "System Settings",
      description: "Manage global HRMS security policies and configuration",
      icon: Settings,
      permissions: [
        { key: "view", label: "View Settings", icon: Settings },
        { key: "edit", label: "Edit Settings", icon: Pencil },
      ],
    },
  ];

  // =========================
  // DEFAULT PERMISSIONS HELPER
  // =========================
  const createDefaultPermissions = () => {
    const result = {};
    modules.forEach((module) => {
      result[module.key] = { enabled: false };
      module.permissions.forEach((permission) => {
        result[module.key][permission.key] = false;
      });
    });
    return result;
  };

  // =========================
  // FETCH ROLES VIA useGet
  // =========================
  const { data: resData, isLoading: loading, refetch: fetchRoles } = useGet(
    "/roles",
    "roles"
  );
  const rolesData = resData?.data || [];

  useEffect(() => {
    if (!rolesData || rolesData.length === 0) return;
    setRoles(rolesData);

    const permsMap = {};
    rolesData.forEach((role) => {
      const base = createDefaultPermissions();
      const rolePerms = role.permissions || [];

      modules.forEach((mod) => {
        const found = Array.isArray(rolePerms)
          ? rolePerms.find((p) => p.module === mod.key)
          : rolePerms[mod.key];

        base[mod.key] = {
          enabled: Boolean(found?.enabled),
        };
        mod.permissions.forEach((perm) => {
          base[mod.key][perm.key] = Array.isArray(found?.actions)
            ? found.actions.includes(perm.key)
            : Boolean(found?.[perm.key]);
        });
      });

      permsMap[role.name] = base;
    });

    setRolePermissions(permsMap);

    if (rolesData.length > 0) {
      setSelectedRole((prev) => {
        if (prev && rolesData.some((r) => r.name === prev)) {
          return prev;
        }
        return rolesData[0].name;
      });
    }
  }, [resData]);

  // CURRENT ACTIVE PERMISSIONS
  const currentPermissions =
    rolePermissions[selectedRole] || createDefaultPermissions();


  // PERMISSION TOGGLE HANDLERS

  const toggleModule = (moduleKey) => {
    if (selectedRole === "Super Admin") {
      showToast("Super Admin master permissions cannot be modified.", "error");
      return;
    }

    setRolePermissions((prev) => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        [moduleKey]: {
          ...prev[selectedRole]?.[moduleKey],
          enabled: !prev[selectedRole]?.[moduleKey]?.enabled,
        },
      },
    }));
  };

  const togglePermission = (moduleKey, permissionKey) => {
    if (selectedRole === "Super Admin") {
      showToast("Super Admin master permissions cannot be modified.", "error");
      return;
    }

    setRolePermissions((prev) => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        [moduleKey]: {
          ...prev[selectedRole]?.[moduleKey],
          [permissionKey]: !prev[selectedRole]?.[moduleKey]?.[permissionKey],
        },
      },
    }));
  };


  // MUTATIONS (usePut, usePost, useDelete)
  const { mutate: savePermissions, isPending: saving } = usePut("/roles", {
    invalidateKeys: ["roles"],
    onSuccess: (res) => {
      showToast(res?.message || `Permissions saved successfully for "${selectedRole}"`);
    },
    onError: (error) => {
      console.error("Error saving permissions:", error);
      showToast(
        error.response?.data?.message || "Failed to save permissions to backend",
        "error"
      );
    },
  });

  const { mutate: createRole, isPending: creating } = usePost("/roles", {
    invalidateKeys: ["roles"],
    onSuccess: (res) => {
      const createdRole = res?.data;
      if (createdRole) {
        setRoles((prev) => [...prev, createdRole]);
        const base = createDefaultPermissions();
        setRolePermissions((prev) => ({
          ...prev,
          [createdRole.name]: createdRole.permissions || base,
        }));
        setSelectedRole(createdRole.name);
      }
      setNewRole({ name: "", description: "" });
      setShowRoleModal(false);
      showToast(`Role created successfully!`);
    },
    onError: (error) => {
      console.error("Error creating role:", error);
      showToast(
        error.response?.data?.message || "Failed to create role",
        "error"
      );
    },
  });

  const { mutate: deleteRole, isPending: deleting } = useDelete("/roles", {
    invalidateKeys: ["roles"],
    onSuccess: (_, variables) => {
      showToast(`Role deleted successfully`, "delete");
    },
    onError: (error) => {
      console.error("Error deleting role:", error);
      showToast(
        error.response?.data?.message || "Failed to delete role",
        "error"
      );
    },
  });



  // SAVE PERMISSIONS TO BACKEND

  const handleSave = () => {
    const activeRole = roles.find((r) => r.name === selectedRole);
    if (!activeRole) {
      showToast("Selected role record not found.", "error");
      return;
    }

    if (activeRole.protected && activeRole.name === "Super Admin") {
      showToast("Super Admin master permissions cannot be modified.", "error");
      return;
    }

    savePermissions({
      id: `${activeRole._id}/permissions`,
      data: { permissions: currentPermissions },
    });
  };

  // CREATE NEW ROLE VIA BACKEND
  const handleCreateRole = (e) => {
    e.preventDefault();

    if (!newRole.name.trim()) {
      showToast("Role title is required", "error");
      return;
    }

    if (
      roles.some(
        (role) => role.name.toLowerCase() === newRole.name.trim().toLowerCase()
      )
    ) {
      showToast(`A role named "${newRole.name.trim()}" already exists`, "error");
      return;
    }

    createRole({
      name: newRole.name.trim(),
      description: newRole.description.trim(),
    });
  };


  // DELETE CUSTOM ROLE VIA BACKEND

  const handleDeleteRole = (roleId, roleName) => {
    if (window.confirm(`Are you sure you want to delete custom role "${roleName}"?`)) {
      deleteRole(roleId);
    }
  };


  // ACCESS LEVEL BADGE
  const getAccessLevel = (moduleKey) => {
    const permissions = currentPermissions[moduleKey];

    if (!permissions?.enabled) {
      return {
        label: "No Access",
        className: "bg-slate-100 text-slate-400 border border-slate-200",
      };
    }

    const module = modules.find((item) => item.key === moduleKey);
    const total = module.permissions.length;
    const active = module.permissions.filter(
      (permission) => permissions[permission.key]
    ).length;

    if (active === total) {
      return {
        label: "Full Access",
        className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      };
    }

    if (active > 0) {
      return {
        label: "Custom Access",
        className: "bg-sky-50 text-sky-700 border border-sky-200",
      };
    }

    return {
      label: "No Access",
      className: "bg-slate-100 text-slate-400 border border-slate-200",
    };
  };

  if (loading) {
    return <PageLoader message="Loading Roles & Permissions..." />;
  }

  return (
    <div className="min-h-screen bg-[#f5f8fc] p-4 sm:p-6 lg:p-8 relative selection:bg-sky-500 selection:text-white">
      {/* ================= HEADER BANNER ================= */}
      <div className="relative mb-7 overflow-hidden rounded-[26px] border border-sky-100 bg-gradient-to-br from-white via-white to-sky-50 p-6 shadow-sm">
        <div className="absolute -right-16 -top-20 h-60 w-60 rounded-full bg-sky-100/50 pointer-events-none" />
        <div className="absolute -bottom-24 right-40 h-52 w-52 rounded-full bg-blue-100/30 pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2.5 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                <ShieldCheck size={18} />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
                Admin Security Governance
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
              Roles & Permissions
            </h1>

            <p className="mt-1.5 max-w-2xl text-sm text-slate-500 leading-relaxed">
              Configure system roles, enable module-level permissions, and manage user access policies dynamically with MongoDB.
            </p>
          </div>

          <button
            onClick={() => setShowRoleModal(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-sky-200 transition hover:-translate-y-0.5 hover:from-sky-600 hover:to-blue-700 cursor-pointer shrink-0"
          >
            <Plus size={18} />
            Create New Role
          </button>
        </div>
      </div>

      {/* ================= ROLE SELECTOR TABS ================= */}
      <div className="mb-7 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm">
        <div className="flex min-w-max gap-2">
          {roles.map((role) => {
            const active = selectedRole === role.name;

            return (
              <button
                key={role._id || role.name}
                onClick={() => setSelectedRole(role.name)}
                className={`flex min-w-[200px] items-center gap-3 rounded-xl px-4 py-3 text-left transition duration-200 cursor-pointer ${active
                  ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-200"
                  : "text-slate-600 hover:bg-sky-50/70 hover:text-sky-600"
                  }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? "bg-white/20 text-white" : "bg-sky-50 text-sky-600"
                    }`}
                >
                  <UserCog size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p
                      className={`truncate text-xs font-bold ${active ? "text-white" : "text-slate-800"
                        }`}
                    >
                      {role.name}
                    </p>

                    {role.protected && (
                      <span
                        className={`ml-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded ${active
                          ? "bg-white/20 text-white"
                          : "bg-violet-100 text-violet-700"
                          }`}
                      >
                        System
                      </span>
                    )}
                  </div>

                  <p
                    className={`mt-0.5 text-[11px] font-medium ${active ? "text-sky-100" : "text-slate-400"
                      }`}
                  >
                    {role.users || 0} assigned users
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= SELECTED ROLE DETAILS BAR ================= */}
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md shadow-sky-200">
            <ShieldCheck size={22} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-800">
                {selectedRole}
              </h2>

              {roles.find((role) => role.name === selectedRole)?.protected ? (
                <span className="flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-bold text-violet-700">
                  <Lock size={11} />
                  System Protected
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                  Custom Role
                </span>
              )}
            </div>

            <p className="mt-0.5 text-xs text-slate-500">
              {roles.find((role) => role.name === selectedRole)?.description ||
                "Configure access permissions for this role"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!roles.find((role) => role.name === selectedRole)?.protected && (
            <button
              onClick={() => {
                const active = roles.find((r) => r.name === selectedRole);
                if (active) handleDeleteRole(active._id, active.name);
              }}
              disabled={deleting}
              className="flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-600 transition hover:bg-rose-100 disabled:opacity-50 cursor-pointer shrink-0"
            >
              {deleting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Trash2 size={15} />
              )}
              Delete Role
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={selectedRole === "Super Admin" || saving}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-200 transition hover:from-sky-600 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shrink-0"
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Save size={15} />
            )}
            Save Changes
          </button>
        </div>
      </div>

      {/* ================= MODULE CARDS GRID ================= */}
      <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {modules.map((module) => {
          const Icon = module.icon;
          const permission = currentPermissions[module.key];
          const access = getAccessLevel(module.key);
          const activeCount = module.permissions.filter(
            (item) => permission?.[item.key]
          ).length;

          return (
            <div
              key={module.key}
              className={`group flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${permission?.enabled
                ? "border-slate-200"
                : "border-slate-200/70 opacity-80"
                }`}
            >
              {/* Card Top Header */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${permission?.enabled
                        ? "bg-sky-50 text-sky-600"
                        : "bg-slate-100 text-slate-400"
                        }`}
                    >
                      <Icon size={20} />
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-slate-800">
                        {module.title}
                      </h3>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400 line-clamp-2">
                        {module.description}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={() => toggleModule(module.key)}
                    disabled={selectedRole === "Super Admin"}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition cursor-pointer ${permission?.enabled
                      ? "bg-gradient-to-r from-sky-500 to-blue-600"
                      : "bg-slate-200"
                      } ${selectedRole === "Super Admin"
                        ? "cursor-not-allowed opacity-60"
                        : ""
                      }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200 ${permission?.enabled ? "left-6" : "left-1"
                        }`}
                    />
                  </button>
                </div>

                <div className="my-4 border-t border-slate-100" />

                {/* Access Level Badge & Stat */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Access Level
                    </p>
                    <span
                      className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${access.className}`}
                    >
                      {access.label}
                    </span>
                  </div>

                  <div className="text-right">
                    <p className="text-base font-extrabold text-slate-800">
                      {activeCount}
                      <span className="text-xs font-medium text-slate-400">
                        /{module.permissions.length}
                      </span>
                    </p>
                    <p className="text-[10px] font-semibold text-slate-400">
                      Permissions
                    </p>
                  </div>
                </div>
              </div>

              {/* Configure Permissions Button */}
              <button
                onClick={() => setSelectedModule(module)}
                disabled={!permission?.enabled}
                className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-sky-200/80 bg-sky-50/50 py-2.5 text-xs font-bold text-sky-700 transition hover:bg-sky-100 hover:border-sky-300 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              >
                <span>Configure Permissions</span>
                <ChevronDown size={14} className="-rotate-90" />
              </button>
            </div>
          );
        })}
      </div>

      {/* ================= DRAWER MODAL ================= */}
      {selectedModule && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <div
            onClick={() => setSelectedModule(null)}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Body */}
          <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 p-6 text-white shrink-0">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30">
                    <selectedModule.icon size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-black">
                      {selectedModule.title}
                    </h2>
                    <p className="mt-0.5 text-xs text-sky-100">
                      Configure granular access for {selectedRole}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedModule(null)}
                  className="rounded-xl p-1.5 text-white/80 hover:bg-white/10 hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Module Toggle Banner */}
              <div className="mt-5 flex items-center justify-between rounded-2xl bg-white/10 p-3.5 backdrop-blur-md border border-white/20">
                <div>
                  <p className="text-xs font-bold text-white">
                    Module Global Access
                  </p>
                  <p className="text-[11px] text-sky-100">
                    Enable or disable this module for {selectedRole}
                  </p>
                </div>

                <button
                  onClick={() => toggleModule(selectedModule.key)}
                  disabled={selectedRole === "Super Admin"}
                  className={`relative h-6 w-11 rounded-full transition cursor-pointer ${currentPermissions[selectedModule.key]?.enabled
                    ? "bg-white text-sky-600"
                    : "bg-white/30"
                    }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full transition-all duration-200 ${currentPermissions[selectedModule.key]?.enabled
                      ? "left-6 bg-sky-600"
                      : "left-1 bg-white"
                      }`}
                  />
                </button>
              </div>
            </div>

            {/* Permissions Checkboxes List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              <div className="mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Module Permissions
                </h3>
                <p className="mt-0.5 text-xs text-slate-400">
                  Select allowed operations for users assigned to{" "}
                  <strong>{selectedRole}</strong>.
                </p>
              </div>

              <div className="space-y-2">
                {selectedModule.permissions.map((permission) => {
                  const PermissionIcon = permission.icon;
                  const checked =
                    currentPermissions[selectedModule.key]?.[permission.key];

                  return (
                    <button
                      key={permission.key}
                      onClick={() =>
                        togglePermission(selectedModule.key, permission.key)
                      }
                      disabled={selectedRole === "Super Admin"}
                      className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition duration-200 cursor-pointer ${checked
                        ? "border-sky-300 bg-sky-50/70 text-slate-800 shadow-2xs"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-xl ${checked
                            ? "bg-sky-500 text-white"
                            : "bg-slate-100 text-slate-400"
                            }`}
                        >
                          <PermissionIcon size={16} />
                        </div>

                        <span className="text-xs font-bold">
                          {permission.label}
                        </span>
                      </div>

                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${checked
                          ? "border-sky-600 bg-sky-600 text-white"
                          : "border-slate-300 bg-white"
                          }`}
                      >
                        {checked && <Check size={13} strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="border-t border-slate-100 bg-slate-50/70 p-4 shrink-0">
              <button
                onClick={() => setSelectedModule(null)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 py-3 text-xs font-bold text-white shadow-md shadow-sky-200 transition hover:from-sky-600 hover:to-blue-700 cursor-pointer"
              >
                <Check size={16} />
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CREATE ROLE MODAL ================= */}
      {showRoleModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100">
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 border border-white/30 backdrop-blur-md">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-black">Create New Role</h2>
                    <p className="mt-0.5 text-xs text-sky-100">
                      Add a custom access role to system
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowRoleModal(false)}
                  className="rounded-xl p-1.5 text-white/80 hover:bg-white/10 hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateRole} className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Role Title / Identifier *
                </label>
                <input
                  type="text"
                  required
                  value={newRole.name}
                  onChange={(e) =>
                    setNewRole({
                      ...newRole,
                      name: e.target.value,
                    })
                  }
                  placeholder="e.g. Finance Auditor, HR Recruiter"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100 transition"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newRole.description}
                  onChange={(e) =>
                    setNewRole({
                      ...newRole,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe scope of responsibilities..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100 transition"
                />
              </div>

              <div className="flex gap-2 border-t border-slate-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-200 hover:from-sky-600 hover:to-blue-700 disabled:opacity-50 cursor-pointer"
                >
                  {creating ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Plus size={15} />
                  )}
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesPermissions;