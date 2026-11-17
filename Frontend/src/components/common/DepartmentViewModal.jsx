import React, { useState, useMemo, useEffect } from "react";
import { Building2, X, MapPin, UserCheck, User, Search } from "lucide-react";

const DepartmentViewModal = ({
  isOpen,
  onClose,
  department = null,
  initialTeam = "All Teams",
  masterEmployeesList = [],
}) => {
  const [selectedTeam, setSelectedTeam] = useState(initialTeam || "All Teams");
  const [employeeSearch, setEmployeeSearch] = useState("");

  useEffect(() => {
    setSelectedTeam(initialTeam || "All Teams");
    setEmployeeSearch("");
  }, [initialTeam, department, isOpen]);

  const modalFilteredEmployees = useMemo(() => {
    if (!department || !department.teams) return [];

    let allStaff = [];
    department.teams.forEach((t) => {
      (t.assignedEmployeeIds || []).forEach((empId) => {
        const foundEmp = masterEmployeesList.find((e) => e.id === empId);
        if (foundEmp) {
          allStaff.push({
            ...foundEmp,
            teamName: t.teamName,
            teamHead: t.teamHead,
          });
        }
      });
    });

    if (selectedTeam === "All Teams") {
      return allStaff;
    }

    return allStaff.filter((emp) => emp.teamName === selectedTeam);
  }, [department, selectedTeam, masterEmployeesList]);

  if (!isOpen || !department) return null;

  const displayEmployees = modalFilteredEmployees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      emp.id.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      (emp.role && emp.role.toLowerCase().includes(employeeSearch.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-sky-500 to-blue-600 p-6 text-white shadow-md">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-xl p-2 text-white/80 hover:bg-white/20 hover:text-white transition cursor-pointer"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur shadow-xs">
              <Building2 size={28} />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-white/20 text-white px-2.5 py-0.5 rounded-md mb-1">
                <MapPin size={12} />
                {department.office}
              </span>
              <h3 className="text-xl font-extrabold text-white">{department.name}</h3>
              <p className="text-xs text-sky-100 font-semibold">Code: {department.code}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Department Head (HOD) Banner */}
          <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-sky-600">
                Department Head (HOD)
              </p>
              <h4 className="text-sm font-extrabold text-sky-950 mt-0.5">
                {department.head}
              </h4>
              <p className="text-xs font-medium text-sky-700">{department.headRole || "Department Head"}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 text-white font-bold shadow-xs">
              <UserCheck size={20} />
            </div>
          </div>

          {/* Sub-Teams Breakdown with Team Heads */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
              Created Teams & Team Heads ({department.teams ? department.teams.length : 0} Teams)
            </h4>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTeam("All Teams")}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
                  selectedTeam === "All Teams"
                    ? "bg-sky-500 text-white border-sky-500 shadow-xs"
                    : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                }`}
              >
                All Teams
              </button>

              {department.teams &&
                department.teams.map((t) => {
                  const isSelected = selectedTeam === t.teamName;
                  const staffCount = t.assignedEmployeeIds ? t.assignedEmployeeIds.length : 0;
                  return (
                    <button
                      key={t.id || t.teamName}
                      onClick={() => setSelectedTeam(t.teamName)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100"
                      }`}
                    >
                      <span>{t.teamName}</span>
                      {t.teamHead && (
                        <span className="text-[10px] opacity-80">(Head: {t.teamHead})</span>
                      )}
                      <span className="bg-white/30 text-xs px-1.5 py-0.2 rounded-md">
                        {staffCount}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Employees List Under Selected Team */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <User size={14} className="text-sky-500" />
                Employees Assigned Under:{" "}
                <span className="text-sky-600 font-bold">{selectedTeam}</span>
              </h4>
            </div>

            {/* Search Bar for View Roster */}
            <div className="relative mb-2.5">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search assigned employee by name, ID, or role..."
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs font-medium text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {displayEmployees.length > 0 ? (
                displayEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-sky-50/40 hover:border-sky-200 transition duration-150"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-sky-600 text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
                        {emp.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          {emp.name} <span className="text-slate-400 font-normal">({emp.id})</span>
                        </p>
                        <p className="text-[11px] font-semibold text-slate-500">{emp.role}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-extrabold bg-sky-100 text-sky-800 px-2.5 py-1 rounded-lg border border-sky-200">
                        Team: {emp.teamName}
                      </span>
                      {emp.teamHead && (
                        <p className="text-[9px] text-slate-400 mt-1">Head: {emp.teamHead}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-slate-400">
                  <p className="text-xs font-semibold text-slate-600">
                    No employees found matching "{employeeSearch}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Close Button */}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={onClose}
              className="w-full rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
            >
              Close Roster
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentViewModal;
