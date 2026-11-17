import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  Plus,
  Building2,
  Sparkles,
  Trash2,
  Edit3,
  AlertCircle,
  X,
} from "lucide-react";
import EmployeeRow from "../../components/hr/EmployeeRow";
import EmployeeCard from "../../components/hr/EmployeeCard";
import TableSkeleton from "../../components/common/TableSkeleton";
import EmployeeDetailModal from "../../components/hr/employees/EmployeeDetailModal";
import EmployeeFormModal from "../../components/hr/employees/EmployeeFormModal";
import { useGet, usePost, usePut, useDelete } from "../../hooks/useApi";
import { useDebounce } from "../../hooks/useDebounce";
import { usePermission } from "../../hooks/usePermission";
import { useToast } from "../../hooks/useToast";

const Employees = () => {
  const { can } = usePermission("employees");
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [filterDept, setFilterDept] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    employeeId: "",
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "Employee",
    department: "Engineering",
    position: "Software Engineer",
    shift: "",
    assignedHr: "Admin Self Managed",
    joinDate: new Date().toISOString().split("T")[0],
    status: "Active",
  });

  /* ── TanStack Query 1: Fetch employees ── */
  const { data: empRes, isLoading: loading } = useGet(
    "/hr/employees",
    "employees"
  );
  const employees = useMemo(() => {
    if (empRes && empRes.success) {
      return (empRes.data || []).map((emp) => {
        const initials = (emp.name || "Employee")
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        const shiftDisplayName = emp.shift?.name
          ? `${emp.shift.name} (${emp.shift.startTime} - ${emp.shift.endTime})`
          : (typeof emp.shift === "string" ? emp.shift : "Standard General Shift (09:00 AM - 06:00 PM)");

        const shiftId = emp.shift?._id || (typeof emp.shift === "string" ? emp.shift : null);

        return {
          id: emp._id,
          employeeId: emp.employeeId || `EMP${emp._id.substring(0, 4)}`,
          name: emp.name,
          email: emp.email,
          phone: emp.phone || "N/A",
          department: emp.department || "Engineering",
          position: emp.position || "Staff",
          shift: shiftDisplayName,
          shiftId: shiftId,
          assignedHr: emp.assignedHr || "Admin Self Managed",
          joinDate: emp.joinDate ? emp.joinDate.split("T")[0] : new Date().toISOString().split("T")[0],
          status: emp.status || "Active",
          role: emp.role || emp.user?.role || "Employee",
          initials: initials,
        };
      });
    }
    return [];
  }, [empRes]);

  /* ── TanStack Query 2: Fetch policies ── */
  const { data: polRes } = useGet(
    "/policies",
    "policies"
  );
  const policies = polRes?.data || [];

  /* ── TanStack Query 3: Fetch departments ── */
  const { data: deptRes } = useGet(
    "/hr/departments",
    "hr-departments"
  );
  const departmentsList = useMemo(() => {
    const deptArray = deptRes?.data || (Array.isArray(deptRes) ? deptRes : []);
    if (Array.isArray(deptArray)) {
      return deptArray
        .map((d) => (typeof d === "string" ? d : d.name || d.departmentName))
        .filter(Boolean);
    }
    return [];
  }, [deptRes]);

  /* ── Assigned HR Managers List ── */
  const hrManagersList = useMemo(() => {
    const hrStaff = employees.filter((emp) => {
      const r = (emp.role || "").toLowerCase();
      const d = (emp.department || "").toLowerCase();
      const p = (emp.position || "").toLowerCase();
      return (
        r.includes("hr") ||
        r.includes("admin") ||
        d.includes("hr") ||
        d.includes("human resources") ||
        p.includes("hr") ||
        p.includes("manager")
      );
    });

    const options = hrStaff.map(
      (emp) => `${emp.name} (${emp.position || emp.role || "HR"})`
    );

    const currentAssigned = formData.assignedHr;
    const combined = Array.from(
      new Set([
        ...options,
        "Admin Self Managed",
        ...(currentAssigned ? [currentAssigned] : []),
      ])
    ).filter(Boolean);

    return combined;
  }, [employees, formData.assignedHr]);

  const departments = useMemo(() => {
    const empDepts = employees.map((e) => e.department).filter(Boolean);
    const combined = Array.from(new Set(["All", ...departmentsList, ...empDepts]));
    return combined;
  }, [departmentsList, employees]);

  const filteredEmployees = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return employees.filter((emp) => {
      const matchesSearch =
        !query ||
        emp.name.toLowerCase().includes(query) ||
        emp.email.toLowerCase().includes(query) ||
        emp.employeeId.toLowerCase().includes(query);
      const matchesDept = filterDept === "All" || emp.department === filterDept;
      return matchesSearch && matchesDept;
    });
  }, [employees, debouncedSearch, filterDept]);

  // ── Pagination State & Logic (10 records per page) ──
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterDept]);

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage) || 1;
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEmployees.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEmployees, currentPage, itemsPerPage]);

  const handleView = useCallback((employee) => {
    setSelectedEmployee(employee);
    setShowModal(true);
  }, []);

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setErrorMessage("");
    setSuccessMessage("");
    const defaultShiftId = policies.length > 0 ? policies[0]._id : "";

    setFormData({
      employeeId: `EMP${Math.floor(100 + Math.random() * 900)}`,
      name: "",
      email: "",
      password: "",
      phone: "",
      role: "Employee",
      department: "Engineering",
      position: "Software Engineer",
      shift: defaultShiftId,
      assignedHr: "Admin Self Managed",
      joinDate: new Date().toISOString().split("T")[0],
      status: "Active",
    });
    setShowFormModal(true);
  };

  const handleEdit = useCallback((employee) => {
    setEditingEmployee(employee);
    setErrorMessage("");
    setSuccessMessage("");
    setFormData({
      employeeId: employee.employeeId,
      name: employee.name,
      email: employee.email,
      password: "",
      phone: employee.phone !== "N/A" ? employee.phone : "",
      role: employee.role === "Admin" ? "Employee" : (employee.role || "Employee"),
      department: employee.department || "Engineering",
      position: employee.position || "Software Engineer",
      shift: employee.shiftId || (policies.length > 0 ? policies[0]._id : ""),
      assignedHr: employee.assignedHr || "Admin Self Managed",
      joinDate: employee.joinDate || new Date().toISOString().split("T")[0],
      status: employee.status || "Active",
    });
    setShowFormModal(true);
  }, [policies]);

  const handlePositionChange = (newPosition) => {
    let autoRole = "Employee";
    const lowerP = newPosition.toLowerCase();
    if (lowerP.includes("hr")) {
      autoRole = "HR";
    } else {
      autoRole = "Employee";
    }

    setFormData((prev) => ({
      ...prev,
      position: newPosition,
      role: autoRole,
    }));
  };

  // ── TanStack Query Mutations ──
  const { mutate: createEmployeeMutation, isPending: isCreating } = usePost("/hr/employees", {
    invalidateKeys: ["employees"],
    onSuccess: (data) => {
      if (data && data.success) {
        showToast("Employee created successfully!", "create");
        setShowFormModal(false);
      }
    },
    onError: (err) => {
      console.error("[HR] Error creating employee:", err);
      const msg = err.response?.data?.message || "Failed to create employee.";
      setErrorMessage(msg);
      showToast(msg, "error");
    },
  });

  const { mutate: updateEmployeeMutation, isPending: isUpdating } = usePut("/hr/employees", {
    invalidateKeys: ["employees"],
    onSuccess: (data) => {
      if (data && data.success) {
        showToast("Employee updated successfully!", "update");
        setShowFormModal(false);
      }
    },
    onError: (err) => {
      console.error("[HR] Error updating employee:", err);
      const msg = err.response?.data?.message || "Failed to update employee.";
      setErrorMessage(msg);
      showToast(msg, "error");
    },
  });

  const { mutate: deleteEmployeeMutation } = useDelete("/hr/employees", {
    invalidateKeys: ["employees"],
    onSuccess: () => {
      showToast("Employee deleted successfully!", "delete");
    },
    onError: (err) => {
      console.error("[HR] Error deleting employee:", err);
      showToast(err.response?.data?.message || "Failed to delete employee.", "error");
    },
  });

  const isSubmitting = isCreating || isUpdating;

  // Delete Employee (DELETE /api/hr/employees/:id)
  const handleDelete = useCallback((id) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      deleteEmployeeMutation(id);
    }
  }, [deleteEmployeeMutation]);

  // Submit Form (CREATE or UPDATE via TanStack Query Mutations)
  const handleSubmitForm = (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setErrorMessage("Please enter a valid full name (at least 2 characters).");
      showToast("Please enter a valid full name (at least 2 characters)", "warning");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      setErrorMessage("Please enter a valid work email address.");
      showToast("Please enter a valid work email address", "warning");
      return;
    }

    if (formData.phone && formData.phone.trim()) {
      const cleanPhone = formData.phone.replace(/\D/g, "");
      if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
        setErrorMessage("Phone number must be a valid 10-digit number.");
        showToast("Phone number must be a valid 10-digit number", "warning");
        return;
      }
    }

    if (formData.password && formData.password.trim()) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(formData.password.trim())) {
        const msg = "Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character (@$!%*?&).";
        setErrorMessage(msg);
        showToast(msg, "warning");
        return;
      }
    }

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      role: formData.role === "Admin" ? "Employee" : (formData.role || "Employee"),
      department: formData.department,
      position: formData.position || "Software Engineer",
      shift: formData.shift || null,
      assignedHr: formData.assignedHr,
      joinDate: formData.joinDate,
      status: formData.status,
    };

    if (editingEmployee) {
      if (formData.password && formData.password.trim()) {
        payload.password = formData.password.trim();
      }
      updateEmployeeMutation({ id: editingEmployee.id, data: payload });
    } else {
      createEmployeeMutation({
        ...payload,
        employeeId: formData.employeeId,
        password: formData.password.trim() || "Employee@123",
      });
    }
  };

  return (
    <div className="relative">
      {/* Hero Section */}
      <div className="relative mb-7 overflow-hidden rounded-[28px] bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-200/50 md:p-8">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 right-32 h-56 w-56 rounded-full bg-indigo-400/20 blur-xl" />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 text-xs font-semibold backdrop-blur-md border border-white/20">
              <Sparkles size={14} className="text-sky-200" />
              <span className="tracking-wide">Human Resources Portal</span>
            </div>

            <h1 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
              Employee Onboarding & Directory
            </h1>

            <p className="max-w-2xl text-xs font-medium text-sky-100 sm:text-sm">
              Manage your workforce directory, track department assignments, and onboard new team members smoothly.
            </p>
          </div>

          {can("create") && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-bold text-blue-700 shadow-lg shadow-blue-900/20 transition hover:-translate-y-0.5 hover:bg-sky-50 active:translate-y-0 cursor-pointer shrink-0"
              title="Add New Employee"
            >
              <Plus size={16} />
              Add New Employee
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm"
              />
            </div>
          </div>

          {/* Filter & Add Button */}
          <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full md:w-auto">
            <div className="relative flex items-center flex-1 sm:flex-initial">
              <Building2
                size={16}
                className="absolute left-3 text-slate-400 pointer-events-none"
              />
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="w-full sm:w-auto pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-sky-500 text-sm bg-white cursor-pointer text-slate-700"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept === "All" ? "All Departments" : dept}
                  </option>
                ))}
              </select>
            </div>

            {can("create") && (
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition font-medium text-sm whitespace-nowrap cursor-pointer shadow-sm"
                title="Add Employee"
              >
                <Plus size={18} />
                Add Employee
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Employee Count */}
      <div className="mb-4 flex items-center justify-between text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800">
            Showing {filteredEmployees.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredEmployees.length)}
          </span>
          <span className="text-slate-400">of</span>
          <span className="font-semibold text-slate-800">{filteredEmployees.length}</span>
          <span className="text-slate-500">employees</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {/* DESKTOP TABLE VIEW (Screens >= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                  Employee
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                  Email
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                  Phone
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                  Department
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                  Position
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton rows={itemsPerPage || 10} cols={7} hasAvatar={true} />
              ) : paginatedEmployees.length > 0 ? (
                paginatedEmployees.map((employee) => (
                  <EmployeeRow
                    key={employee.id}
                    employee={employee}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    canEdit={can("edit")}
                    canDelete={can("delete")}
                  />
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-3">
                        <Search size={24} className="text-slate-400" />
                      </div>
                      <p>No employees found matching your search</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARD VIEW (Phone screens < 768px) */}
        <div className="md:hidden p-3.5 space-y-3 bg-slate-50/50">
          {loading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs animate-pulse space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-slate-200 shrink-0" />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="h-4 w-32 rounded bg-slate-200" />
                    <div className="h-3 w-20 rounded bg-slate-100" />
                  </div>
                  <div className="h-6 w-16 rounded-full bg-slate-100 shrink-0" />
                </div>
                <div className="flex gap-2">
                  <div className="h-6 w-24 rounded-lg bg-slate-100" />
                  <div className="h-6 w-28 rounded-lg bg-slate-100" />
                </div>
                <div className="h-14 rounded-xl bg-slate-50 border border-slate-100" />
                <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
                  <div className="h-7 w-16 rounded-xl bg-slate-100" />
                  <div className="h-7 w-16 rounded-xl bg-slate-100" />
                </div>
              </div>
            ))
          ) : paginatedEmployees.length > 0 ? (
            paginatedEmployees.map((employee) => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                canEdit={can("edit")}
                canDelete={can("delete")}
              />
            ))
          ) : (
            <div className="py-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200/80 p-6">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Search size={22} className="text-slate-400" />
              </div>
              <p className="text-sm font-bold text-slate-700">No employees found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria</p>
            </div>
          )}
        </div>

        {/* Table Footer with Pagination Controls */}
        <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 font-medium">
            Showing{" "}
            <strong className="text-slate-800">
              {filteredEmployees.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
            </strong>{" "}
            to{" "}
            <strong className="text-slate-800">
              {Math.min(currentPage * itemsPerPage, filteredEmployees.length)}
            </strong>{" "}
            of <strong className="text-slate-800">{filteredEmployees.length}</strong> employees
          </div>

          {/* Pagination Navigation Buttons */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-sky-50 hover:text-sky-600 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-700 transition cursor-pointer shadow-2xs"
              >
                Previous
              </button>

              <span className="px-3 py-1.5 rounded-xl bg-sky-100 text-sky-800 text-xs font-extrabold border border-sky-200 shadow-2xs">
                Page {currentPage} of {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-sky-50 hover:text-sky-600 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-700 transition cursor-pointer shadow-2xs"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Employee Detail Modal */}
      <EmployeeDetailModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        employee={selectedEmployee}
        onEdit={handleEdit}
      />

      {/* Add / Edit Employee Form Modal */}
      <EmployeeFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        editingEmployee={editingEmployee}
        formData={formData}
        setFormData={setFormData}
        departments={departments}
        policies={policies}
        hrManagersList={hrManagersList}
        errorMessage={errorMessage}
        successMessage={successMessage}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmitForm}
        onPositionChange={handlePositionChange}
      />
    </div>
  );
};

export default Employees;
