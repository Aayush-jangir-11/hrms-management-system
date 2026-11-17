import React, { useState } from "react";
import { UserPlus, X, Eye, EyeOff, Loader, CheckCircle2, AlertCircle } from "lucide-react";

const EmployeeFormModal = ({
  isOpen,
  onClose,
  editingEmployee,
  formData,
  setFormData,
  departments,
  policies,
  hrManagersList,
  errorMessage,
  successMessage,
  isSubmitting,
  onSubmit,
  onPositionChange,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  if (!isOpen) return null;

  // Real-time inline field validators
  const validateField = (name, value) => {
    let error = "";
    if (name === "name") {
      if (!value.trim()) {
        error = "Full name is required";
      } else if (value.trim().length < 2) {
        error = "Name must be at least 2 characters";
      }
    } else if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value.trim()) {
        error = "Work email is required";
      } else if (!emailRegex.test(value.trim())) {
        error = "Please enter a valid email address (e.g. name@company.com)";
      }
    } else if (name === "phone") {
      if (value.trim()) {
        const digitsOnly = value.replace(/\D/g, "");
        if (digitsOnly.length !== 10) {
          error = "Phone number must be exactly 10 digits";
        } else if (!/^[6-9]\d{9}$/.test(digitsOnly)) {
          error = "Phone number must start with 6, 7, 8, or 9";
        }
      }
    } else if (name === "password" && !editingEmployee) {
      if (value.trim()) {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(value.trim())) {
          error = "Password must be 8+ chars with uppercase, lowercase, number & symbol";
        }
      }
    }
    return error;
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field] || "");
    setFieldErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const error = validateField(field, value);
      setFieldErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    // Validate all fields
    const nameErr = validateField("name", formData.name || "");
    const emailErr = validateField("email", formData.email || "");
    const phoneErr = validateField("phone", formData.phone || "");
    const passErr = !editingEmployee ? validateField("password", formData.password || "") : "";

    const errors = {
      name: nameErr,
      email: emailErr,
      phone: phoneErr,
      password: passErr,
    };

    setTouched({ name: true, email: true, phone: true, password: true });
    setFieldErrors(errors);

    if (nameErr || emailErr || phoneErr || passErr) {
      return;
    }

    onSubmit(e);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl animate-fade-in border border-slate-100 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="relative shrink-0 bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 border border-white/30 backdrop-blur-md">
                <UserPlus size={22} />
              </div>
              <div>
                <h2 className="text-lg font-black">
                  {editingEmployee ? "Edit Employee Details" : "Add New Employee"}
                </h2>
                <p className="mt-0.5 text-xs text-sky-100 font-medium">
                  HR Employee Onboarding Portal
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl p-2 text-white/80 hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleFormSubmit} noValidate className="p-6 space-y-4 overflow-y-auto">
          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message Alert */}
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Full Name */}
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                onBlur={() => handleBlur("name")}
                placeholder="e.g. Aayush Jangir"
                className={`w-full rounded-xl border px-4 py-2.5 text-xs font-semibold outline-none transition ${
                  fieldErrors.name
                    ? "border-rose-400 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                    : "border-slate-200 bg-slate-50/50 text-slate-800 focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                }`}
              />
              {fieldErrors.name && (
                <p className="mt-1 text-[11px] font-bold text-rose-500 flex items-center gap-1">
                  <span>⚠️</span> {fieldErrors.name}
                </p>
              )}
            </div>

            {/* Work Email */}
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Work Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                onBlur={() => handleBlur("email")}
                placeholder="employee@company.com"
                className={`w-full rounded-xl border px-4 py-2.5 text-xs font-semibold outline-none transition ${
                  fieldErrors.email
                    ? "border-rose-400 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                    : "border-slate-200 bg-slate-50/50 text-slate-800 focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                }`}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-[11px] font-bold text-rose-500 flex items-center gap-1">
                  <span>⚠️</span> {fieldErrors.email}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Phone Number (10 digits) */}
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Phone Number (10 Digits)
              </label>
              <input
                type="tel"
                maxLength={10}
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value.replace(/\D/g, ""))}
                onBlur={() => handleBlur("phone")}
                placeholder="9876543210"
                className={`w-full rounded-xl border px-4 py-2.5 text-xs font-semibold outline-none transition font-mono ${
                  fieldErrors.phone
                    ? "border-rose-400 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                    : "border-slate-200 bg-slate-50/50 text-slate-800 focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                }`}
              />
              {fieldErrors.phone ? (
                <p className="mt-1 text-[11px] font-bold text-rose-500 flex items-center gap-1">
                  <span>⚠️</span> {fieldErrors.phone}
                </p>
              ) : (
                <p className="mt-1 text-[10px] text-slate-400 font-medium">
                  Enter 10 digit Indian mobile number (e.g. 9876543210)
                </p>
              )}
            </div>

            {/* Password / Role */}
            {!editingEmployee ? (
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Initial Password (Optional)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    onBlur={() => handleBlur("password")}
                    placeholder="Defaults to Employee@123"
                    className={`w-full rounded-xl border px-4 py-2.5 pr-10 text-xs font-semibold outline-none transition ${
                      fieldErrors.password
                        ? "border-rose-400 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                        : "border-slate-200 bg-slate-50/50 text-slate-800 focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {fieldErrors.password && (
                  <p className="mt-1 text-[11px] font-bold text-rose-500 flex items-center gap-1">
                    <span>⚠️</span> {fieldErrors.password}
                  </p>
                )}

                {/* Real-time Password Complexity Indicator */}
                {formData.password && (
                  <div className="mt-2 grid grid-cols-2 gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50/80 p-2.5 text-[10px] font-bold">
                    <div className={`flex items-center gap-1 ${formData.password.length >= 8 ? "text-emerald-600" : "text-slate-400"}`}>
                      <span>{formData.password.length >= 8 ? "✓" : "○"}</span>
                      <span>8+ Characters</span>
                    </div>
                    <div className={`flex items-center gap-1 ${/[A-Z]/.test(formData.password) ? "text-emerald-600" : "text-slate-400"}`}>
                      <span>{/[A-Z]/.test(formData.password) ? "✓" : "○"}</span>
                      <span>1 Uppercase (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-1 ${/[a-z]/.test(formData.password) ? "text-emerald-600" : "text-slate-400"}`}>
                      <span>{/[a-z]/.test(formData.password) ? "✓" : "○"}</span>
                      <span>1 Lowercase (a-z)</span>
                    </div>
                    <div className={`flex items-center gap-1 ${/\d/.test(formData.password) ? "text-emerald-600" : "text-slate-400"}`}>
                      <span>{/\d/.test(formData.password) ? "✓" : "○"}</span>
                      <span>1 Number (0-9)</span>
                    </div>
                    <div className={`flex items-center gap-1 ${/[@$!%*?&]/.test(formData.password) ? "text-emerald-600" : "text-slate-400"} col-span-2`}>
                      <span>{/[@$!%*?&]/.test(formData.password) ? "✓" : "○"}</span>
                      <span>1 Special Symbol (@$!%*?&)</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  User Access Role (Protected) *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="Employee">Employee</option>
                  <option value="HR">HR</option>
                  <option value="HR Manager">HR Manager</option>
                  <option value="HR Executive">HR Executive</option>
                  <option value="HR Associate">HR Associate</option>
                </select>
              </div>
            )}
          </div>

          {!editingEmployee && (
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                User Access Role (Protected) *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="Employee">Employee</option>
                <option value="HR">HR</option>
                <option value="HR Manager">HR Manager</option>
                <option value="HR Executive">HR Executive</option>
                <option value="HR Associate">HR Associate</option>
              </select>
              <p className="mt-1 text-[10px] text-slate-400">
                * HR users are restricted from assigning the Admin role.
              </p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Department *
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-sky-500 cursor-pointer"
              >
                {departments.filter((d) => d !== "All").map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Designation / Position *
              </label>
              <select
                value={formData.position}
                onChange={(e) => onPositionChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="Software Engineer">Software Engineer</option>
                <option value="Senior Lead Developer">Senior Lead Developer</option>
                <option value="HR Manager">HR Manager</option>
                <option value="HR Executive">HR Executive</option>
                <option value="QA Engineer">QA Engineer</option>
                <option value="Sales Executive">Sales Executive</option>
                <option value="Lead Accountant">Lead Accountant</option>
                <option value="Operations Supervisor">Operations Supervisor</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Assigned Shift Policy
              </label>
              <select
                value={formData.shift}
                onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs font-bold text-sky-700 outline-none focus:border-sky-500 cursor-pointer"
              >
                {policies.length > 0 ? (
                  policies.map((pol) => (
                    <option key={pol._id} value={pol._id}>
                      {pol.name} ({pol.startTime} - {pol.endTime}) • {pol.category}
                    </option>
                  ))
                ) : (
                  <option value="">
                    Standard General Shift (09:00 AM - 06:00 PM)
                  </option>
                )}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Assigned HR Manager
              </label>
              <select
                value={formData.assignedHr}
                onChange={(e) => setFormData({ ...formData, assignedHr: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-sky-500 cursor-pointer"
              >
                {hrManagersList.map((hr) => (
                  <option key={hr} value={hr}>
                    {hr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-200 hover:from-sky-600 hover:to-blue-700 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader size={15} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  {editingEmployee ? "Update Employee" : "Create Employee"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeFormModal;
