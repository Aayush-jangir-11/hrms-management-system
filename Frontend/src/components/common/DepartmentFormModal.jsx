import { useState, useEffect } from "react";
import { Building2, Plus, Trash2, X, MapPin, Layers, Users, Search, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "../../hooks/useToast";

const DepartmentFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  editingDepartment = null,
  officeOptions = [],
  masterEmployeesList = [],
}) => {
  const { showToast } = useToast();

  const initialFormState = {
    office: officeOptions[0] || "Headquarters - Mumbai",
    name: "",
    code: "",
    head: "",
    headRole: "Department Head",
    status: "Active",
    teams: [
      {
        id: `team-${Date.now()}`,
        teamName: "Core Operations",
        teamHead: "",
        assignedEmployeeIds: [],
      },
    ],
  };

  const [formData, setFormData] = useState(initialFormState);
  const [employeeSearchInModal, setEmployeeSearchInModal] = useState("");

  useEffect(() => {
    if (editingDepartment) {
      setFormData({
        office: editingDepartment.office || officeOptions[0] || "Headquarters - Mumbai",
        name: editingDepartment.name || "",
        code: editingDepartment.code || "",
        head: editingDepartment.head || "",
        headRole: editingDepartment.headRole || "Department Head",
        status: editingDepartment.status || "Active",

        teams:
          editingDepartment.teams && editingDepartment.teams.length > 0
            ? editingDepartment.teams.map((t) => ({
              ...t,
              id: t.id || t._id || `team-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            }))
            : [
              {
                id: `team-${Date.now()}`,
                teamName: "General Team",
                teamHead: editingDepartment.head || "",
                assignedEmployeeIds: [],
              },
            ],
      });
    } else {

      setFormData({
        ...initialFormState,
        office: officeOptions[0] || "Headquarters - Mumbai",
        teams: [
          {
            id: `team-${Date.now()}`,
            teamName: "Core Operations",
            teamHead: "",
            assignedEmployeeIds: [],
          },
        ],
      });
    }

    setEmployeeSearchInModal("");
  }, [editingDepartment, isOpen]);

  if (!isOpen) return null;

  const addTeamField = () => {
    setFormData((prev) => ({
      ...prev,
      teams: [
        ...prev.teams,
        {
          id: `team-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          teamName: "",
          teamHead: "",
          assignedEmployeeIds: [],
        },
      ],
    }));
  };

  const removeTeamField = (teamId) => {
    if (formData.teams.length === 1) {
      showToast("At least one team is required for the department.", "warning");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      teams: prev.teams.filter((t) => (t.id || t._id) !== teamId),
    }));
  };

  const updateTeamField = (teamId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      teams: prev.teams.map((t) => ((t.id || t._id) === teamId ? { ...t, [field]: value } : t)),
    }));
  };

  const assignEmployeeToTeamViaDropdown = (empId, targetTeamId) => {
    setFormData((prev) => {
      const updatedTeams = prev.teams.map((t) => {
        const cleanedIds = t.assignedEmployeeIds.filter((id) => id !== empId);
        if ((t.id || t._id) === targetTeamId) {
          return { ...t, assignedEmployeeIds: [...cleanedIds, empId] };
        }
        return { ...t, assignedEmployeeIds: cleanedIds };
      });
      return { ...prev, teams: updatedTeams };
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.code.trim() || !formData.head.trim() || !formData.headRole.trim()) {
      showToast("Please fill in Office Location, Department Name, Department Code, Department Head, and Head Designation.", "warning");
      return;
    }

    const invalidTeam = formData.teams.find((t) => !t.teamName.trim());
    if (invalidTeam) {
      showToast("Please enter a name for all teams created.", "warning");
      return;
    }

    onSubmit(formData);
  };

  const filteredEmployees = masterEmployeesList.filter(
    (emp) =>
      emp.name.toLowerCase().includes(employeeSearchInModal.toLowerCase()) ||
      emp.id.toLowerCase().includes(employeeSearchInModal.toLowerCase()) ||
      (emp.role && emp.role.toLowerCase().includes(employeeSearchInModal.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-sky-500 to-blue-600 p-6 text-white shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                <Building2 size={22} />
              </div>
              <div>
                <h2 className="text-xl font-extrabold">
                  {editingDepartment ? "Edit Department & Team Hierarchy" : "Create Office Department & Teams"}
                </h2>
                <p className="text-xs text-sky-100">
                  Set Office Location, Department Info, Head, create Teams with Team Heads, and assign Employees
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

        {/* Form Content */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* SECTION 1: Office Location */}
          <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-2">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
              <MapPin size={15} className="text-sky-600" />
              1. Office Location <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.office}
              onChange={(e) => setFormData({ ...formData, office: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition cursor-pointer"
            >
              {officeOptions.map((off) => (
                <option key={off} value={off}>
                  {off}
                </option>
              ))}
            </select>
          </div>

          {/* SECTION 2: Department Details & Department Head */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Building2 size={15} className="text-sky-500" />
              2. Department Info & Department Head
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="mb-1 block text-[11px] font-bold text-slate-600">
                  Department Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Software Engineering & Product"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-600">
                  Department Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ENG"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 uppercase outline-none focus:border-sky-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-600">
                  Department Head (HOD) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={formData.head}
                  onChange={(e) => setFormData({ ...formData, head: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-600">
                  Head Designation / Role <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VP of Technology"
                  value={formData.headRole}
                  onChange={(e) => setFormData({ ...formData, headRole: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-600">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500 transition cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 3: Create Teams & Team Heads */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Layers size={15} className="text-indigo-500" />
                  3. Create Teams & Assign Team Heads
                </h4>
                <p className="text-[11px] text-slate-400">
                  Add sub-teams within this department and specify the Team Head for each.
                </p>
              </div>

              <button
                type="button"
                onClick={addTeamField}
                className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer border border-indigo-100"
              >
                <Plus size={14} />
                Add Team
              </button>
            </div>

            {/* Dynamic Teams Inputs */}
            <div className="space-y-3">
              {formData.teams.map((teamItem, index) => (
                <div
                  key={teamItem.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                      Team #{index + 1}
                    </span>

                    {formData.teams.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTeamField(teamItem.id)}
                        className="text-slate-400 hover:text-rose-500 text-xs font-bold transition p-1 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[10px] font-extrabold uppercase text-slate-500">
                        Team Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Frontend Web Team"
                        value={teamItem.teamName}
                        onChange={(e) => updateTeamField(teamItem.id, "teamName", e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-500 transition"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-extrabold uppercase text-slate-500">
                        Team Head (Head of Team)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Aayush Jangir"
                        value={teamItem.teamHead}
                        onChange={(e) => updateTeamField(teamItem.id, "teamHead", e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 4: Choose Employees Under Which Team Dropdown */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Users size={15} className="text-sky-500" />
                4. Assign Employees Under Teams (Select Team Dropdown Menu for Employees)
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Choose which team each employee belongs to using the team selection dropdown menu.
              </p>
            </div>

            {/* Employee Search Bar for Team Assignment */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search employee by name, ID, or role..."
                value={employeeSearchInModal}
                onChange={(e) => setEmployeeSearchInModal(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-medium text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </div>

            {/* Employees List with Team Selection Dropdown */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 max-h-56 overflow-y-auto p-2 space-y-2">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => {
                  const assignedTeam = formData.teams.find((t) =>
                    t.assignedEmployeeIds.includes(emp.id)
                  );
                  const currentTeamId = assignedTeam ? assignedTeam.id : "";

                  return (
                    <div
                      key={emp.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-white border border-slate-200/80 gap-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-extrabold text-[11px]">
                          {emp.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            {emp.name} <span className="text-slate-400 font-normal">({emp.id})</span>
                          </p>
                          <p className="text-[10px] text-slate-400">{emp.role}</p>
                        </div>
                      </div>

                      {/* Dropdown Menu for Employee to Select Team */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">
                          Assign to Team:
                        </span>
                        <select
                          value={currentTeamId}
                          onChange={(e) => assignEmployeeToTeamViaDropdown(emp.id, e.target.value)}
                          className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="">-- No Team --</option>
                          {formData.teams.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.teamName || "Unnamed Team"}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-slate-400 font-medium bg-white rounded-xl border border-dashed border-slate-200">
                  No employee found matching "{employeeSearchInModal}"
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
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
              {editingDepartment ? "Update Hierarchy" : "Save Department & Teams"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepartmentFormModal;
