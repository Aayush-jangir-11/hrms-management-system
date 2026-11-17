import React, { useState } from "react";
import {
  Clock,
  X,
  Globe,
  Building2,
  Users,
  User,
  Search,
} from "lucide-react";

const PolicyFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  editingPolicy,
  filteredDepartmentsForForm,
  deptSearchForm,
  setDeptSearchForm,
  toggleDepartmentSelection,
  filteredTeamsForForm,
  teamSearchForm,
  setTeamSearchForm,
  toggleTeamSelection,
  filteredEmployeesForForm,
  employeeSearchForm,
  setEmployeeSearchForm,
  toggleEmployeeSelectionInForm,
  daysOfWeek,
  toggleWorkDay,
}) => {
  const [selectedTeamDept, setSelectedTeamDept] = useState("");

  if (!isOpen) return null;

  const teamsInDept = (filteredTeamsForForm || []).filter((t) => {
    const matchesDept = selectedTeamDept
      ? t.department.toLowerCase() === selectedTeamDept.toLowerCase()
      : false;
    const query = (teamSearchForm || "").toLowerCase().trim();
    const matchesSearch =
      !query ||
      t.name.toLowerCase().includes(query) ||
      (t.id && t.id.toLowerCase().includes(query));
    return matchesDept && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-sky-500 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                <Clock size={22} />
              </div>
              <div>
                <h2 className="text-xl font-extrabold">
                  {editingPolicy ? "Edit Working Policy" : "Create New Working Policy"}
                </h2>
                <p className="text-xs text-sky-100">
                  Configure target scope (Company, Departments, Teams, or Employees) and custom shift hours
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-white/80 hover:bg-white/20 hover:text-white transition cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={onSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Step 1: Policy Name & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Policy Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Engineering Flexible Shift"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Policy Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-sky-500 focus:bg-white"
              >
                <option value="Work Schedule & Shift">Work Schedule & Shift</option>
                <option value="Remote & Hybrid">Remote & Hybrid</option>
                <option value="Leave & Attendance">Leave & Attendance</option>
                <option value="Overtime & Compensation">Overtime & Compensation</option>
              </select>
            </div>
          </div>

          {/* Step 2: Target Scope Selection */}
          <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4 space-y-3">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-sky-900">
              Target Scope (Who does this policy apply to?) <span className="text-rose-500">*</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: "Company-Wide", title: "Entire Company", icon: Globe, desc: "Applies to all" },
                { id: "Department-Specific", title: "By Department", icon: Building2, desc: "Select depts" },
                { id: "Team-Specific", title: "By Team", icon: Users, desc: "Select teams" },
                { id: "Employee-Specific", title: "By Employee", icon: User, desc: "Select staff" },
              ].map((scope) => {
                const ScopeIcon = scope.icon;
                const isSelected = formData.targetScope === scope.id;
                return (
                  <button
                    type="button"
                    key={scope.id}
                    onClick={() => setFormData({ ...formData, targetScope: scope.id })}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition cursor-pointer ${isSelected
                      ? "bg-white border-sky-500 text-sky-700 shadow-md ring-2 ring-sky-200"
                      : "bg-white/60 border-slate-200 text-slate-600 hover:bg-white"
                      }`}
                  >
                    <ScopeIcon size={20} className={isSelected ? "text-sky-600" : "text-slate-400"} />
                    <span className="mt-1.5 text-xs font-bold">{scope.title}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{scope.desc}</span>
                  </button>
                );
              })}
            </div>

            {/* Department Scope */}
            {formData.targetScope === "Department-Specific" && (
              <div className="mt-3 pt-3 border-t border-sky-100 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-slate-700">Select Target Departments:</p>
                  <span className="text-[11px] font-bold text-sky-600">
                    {formData.targetDepartments.length} Selected
                  </span>
                </div>

                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search department..."
                    value={deptSearchForm}
                    onChange={(e) => setDeptSearchForm(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs font-medium text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                  {filteredDepartmentsForForm.length > 0 ? (
                    filteredDepartmentsForForm.map((dept) => {
                      const isChecked = formData.targetDepartments.includes(dept);
                      return (
                        <label
                          key={dept}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold cursor-pointer transition ${isChecked
                            ? "bg-sky-100/80 border-sky-300 text-sky-900"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleDepartmentSelection(dept)}
                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                          />
                          {dept}
                        </label>
                      );
                    })
                  ) : (
                    <div className="col-span-2 p-2 text-center text-xs text-slate-400 font-medium bg-white rounded-lg border border-dashed border-slate-200">
                      No department matching "{deptSearchForm}"
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Team Scope */}
            {formData.targetScope === "Team-Specific" && (
              <div className="mt-3 pt-3 border-t border-sky-100 space-y-3">
                {/* Step 1: Mandatory Department Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Building2 size={15} className="text-sky-600" />
                      Step 1: Select Target Department First <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] font-extrabold text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-200">
                      {formData.targetTeams.length} Team(s) Selected
                    </span>
                  </div>

                  <select
                    value={selectedTeamDept}
                    onChange={(e) => {
                      setSelectedTeamDept(e.target.value);
                      setTeamSearchForm("");
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 cursor-pointer shadow-xs"
                  >
                    <option value="">-- Choose Department First --</option>
                    {(filteredDepartmentsForForm && filteredDepartmentsForForm.length > 0
                      ? filteredDepartmentsForForm
                      : [
                        "Engineering",
                        "IT & Infrastructure",
                        "Sales & Marketing",
                        "Human Resources",
                        "Finance & Accounts",
                        "Operations",
                        "Customer Support",
                      ]
                    ).map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Step 2: Select Teams under selected Department */}
                {!selectedTeamDept ? (
                  <div className="p-4 text-center rounded-2xl bg-amber-50/60 border border-amber-200 text-amber-800 text-xs font-semibold">
                    <Building2 size={24} className="mx-auto text-amber-500 mb-1" />
                    Please select a Department first to view and select its teams.
                  </div>
                ) : (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <Users size={14} className="text-sky-600" />
                        Step 2: Select Teams in <span className="text-sky-600 font-extrabold">{selectedTeamDept}</span>:
                      </label>

                      {/* Select All / Clear All in Dept Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const deptTeams = (filteredTeamsForForm || [])
                            .filter((t) => t.department.toLowerCase() === selectedTeamDept.toLowerCase())
                            .map((t) => t.name);
                          const allSelected = deptTeams.length > 0 && deptTeams.every((t) => formData.targetTeams.includes(t));
                          if (allSelected) {
                            setFormData({
                              ...formData,
                              targetTeams: formData.targetTeams.filter((t) => !deptTeams.includes(t)),
                            });
                          } else {
                            const updated = Array.from(new Set([...formData.targetTeams, ...deptTeams]));
                            setFormData({ ...formData, targetTeams: updated });
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg border border-sky-200 bg-sky-50 text-[11px] font-bold text-sky-700 hover:bg-sky-100 transition cursor-pointer"
                      >
                        Select All Teams in {selectedTeamDept}
                      </button>
                    </div>

                    {/* Team Search Bar */}
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder={`Search team inside ${selectedTeamDept}...`}
                        value={teamSearchForm}
                        onChange={(e) => setTeamSearchForm(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs font-medium text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                      />
                    </div>

                    {/* Teams Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {teamsInDept.length > 0 ? (
                        teamsInDept.map((t) => {
                          const isChecked = formData.targetTeams.includes(t.name);
                          return (
                            <label
                              key={t.id}
                              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${isChecked
                                ? "bg-sky-100/80 border-sky-300 text-sky-900 shadow-xs"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleTeamSelection(t.name)}
                                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                />
                                <span>{t.name}</span>
                              </div>
                              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-medium">
                                {t.department}
                              </span>
                            </label>
                          );
                        })
                      ) : (
                        <div className="col-span-full p-3 text-center text-xs text-slate-400 font-medium bg-white rounded-xl border border-dashed border-slate-200">
                          No team found under "{selectedTeamDept}" matching "{teamSearchForm}"
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Employee Scope */}
            {formData.targetScope === "Employee-Specific" && (
              <div className="mt-3 pt-3 border-t border-sky-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-slate-700">Select Specific Employees:</p>
                  <span className="text-[11px] font-bold text-sky-600">
                    {formData.targetEmployees.length} Selected
                  </span>
                </div>

                <div className="relative mb-2.5">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search employee by name, ID, department, or role..."
                    value={employeeSearchForm}
                    onChange={(e) => setEmployeeSearchForm(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs font-medium text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </div>

                <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                  {filteredEmployeesForForm.length > 0 ? (
                    filteredEmployeesForForm.map((emp) => {
                      const isChecked = formData.targetEmployees.includes(emp.id);
                      return (
                        <label
                          key={emp.id}
                          className={`flex items-center justify-between p-2 rounded-lg border text-xs font-semibold cursor-pointer transition ${isChecked
                            ? "bg-sky-100/80 border-sky-300 text-sky-900"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleEmployeeSelectionInForm(emp.id)}
                              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                            />
                            <span>{emp.name} <span className="text-[11px] text-slate-400 font-normal">({emp.id})</span></span>
                          </div>
                          <span className="text-[11px] text-slate-400">{emp.department} • {emp.role}</span>
                        </label>
                      );
                    })
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-400 font-medium bg-white rounded-lg border border-dashed border-slate-200">
                      No employee found matching "{employeeSearchForm}"
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Shift Hours & Work Days */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Shift Schedule & Working Hours Details
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-500">Shift Type</label>
                <select
                  value={formData.shiftType}
                  onChange={(e) => setFormData({ ...formData, shiftType: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-sky-500"
                >
                  <option value="Regular Shift">Regular Shift</option>
                  <option value="Night Shift">Night Shift</option>
                  <option value="Flexi-Hours">Flexi-Hours</option>
                  <option value="Hybrid Shift">Hybrid Shift</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Custom Schedule">Custom Schedule</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-500">Start Time</label>
                <input
                  type="text"
                  placeholder="09:00 AM"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-500">End Time</label>
                <input
                  type="text"
                  placeholder="06:00 PM"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Working Days Checkbox Toggle Bar */}
            <div>
              <label className="mb-1.5 block text-[11px] font-bold text-slate-500">
                Active Working Days (Click to toggle)
              </label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map((day) => {
                  const isSelected = formData.workDays.includes(day);
                  return (
                    <button
                      type="button"
                      key={day}
                      onClick={() => toggleWorkDay(day)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${isSelected
                        ? "bg-sky-500 text-white shadow-xs"
                        : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                        }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Additional Rules */}
            <div className="space-y-3 pt-2">
              {/* Row 1: Time & Threshold Rules */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Grace Period</label>
                  <input
                    type="text"
                    placeholder="15 Mins"
                    value={formData.gracePeriod}
                    onChange={(e) => setFormData({ ...formData, gracePeriod: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold outline-none focus:border-sky-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Break Duration</label>
                  <input
                    type="text"
                    placeholder="60 Mins"
                    value={formData.breakDuration}
                    onChange={(e) => setFormData({ ...formData, breakDuration: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold outline-none focus:border-sky-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Half-Day Threshold</label>
                  <input
                    type="text"
                    placeholder="4.5 Hours"
                    value={formData.halfDayThreshold}
                    onChange={(e) => setFormData({ ...formData, halfDayThreshold: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold outline-none focus:border-sky-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Row 2 (Next Line): Monthly Leaves & Overtime Rule */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Monthly Leaves Entitlement</label>
                  <input
                    type="text"
                    placeholder="2 Days"
                    value={formData.paidLeavesPerMonth}
                    onChange={(e) => setFormData({ ...formData, paidLeavesPerMonth: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold outline-none focus:border-sky-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Overtime Calculation Rule</label>
                  <input
                    type="text"
                    placeholder="1.5x Hourly Rate"
                    value={formData.overtimeRule}
                    onChange={(e) => setFormData({ ...formData, overtimeRule: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold outline-none focus:border-sky-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Simple Sandwich Rule Toggle Option */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="text-xs font-extrabold text-slate-800 block uppercase tracking-wider">
                    Sandwich Rule Policy
                  </label>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Count weekend days (Sat & Sun) as leaves when leave is taken on Friday & Monday
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, sandwichRuleEnabled: true })}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                      formData.sandwichRuleEnabled !== false
                        ? "bg-amber-500 text-white shadow-xs ring-2 ring-amber-200"
                        : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Enabled
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, sandwichRuleEnabled: false })}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                      formData.sandwichRuleEnabled === false
                        ? "bg-slate-700 text-white shadow-xs ring-2 ring-slate-300"
                        : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Disabled
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Policy Description */}
          <div>
            <label className="mb-1 block text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Policy Summary / Rules Description
            </label>
            <textarea
              rows="3"
              placeholder="Enter detailed description or guidelines for this policy..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-medium text-slate-700 outline-none focus:border-sky-500 focus:bg-white resize-none"
            />
          </div>

          {/* Form Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-200 hover:from-sky-600 hover:to-blue-700 cursor-pointer"
            >
              {editingPolicy ? "Update Policy" : "Save & Publish Policy"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PolicyFormModal;
