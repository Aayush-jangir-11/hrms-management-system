import React from "react";
import {
  Clock,
  Edit2,
  Trash2,
  Users,
  Globe,
  Building2,
  User,
  UserCheck,
} from "lucide-react";

const PolicyCard = ({ policy, onEdit, onDelete, onAssign, can = () => true, isAdmin = false }) => {
  const IconComponent = policy.icon || Clock;
  const canEdit = can("edit");
  const canDelete = isAdmin || can("delete");
  const canAssign = can("assign") || can("edit");

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs transition duration-300 hover:-translate-y-1 hover:border-sky-300 hover:shadow-xl">
      <div>
        {/* Top Badges & Actions */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold ${policy.badgeColor}`}
          >
            <IconComponent size={13} />
            {policy.shiftType}
          </span>

          <div className="flex items-center gap-1">
            {canEdit && (
              <button
                onClick={() => onEdit(policy)}
                title="Edit Policy"
                className="rounded-lg p-2 text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition cursor-pointer"
              >
                <Edit2 size={16} />
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(policy.id)}
                title="Delete Policy"
                className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition cursor-pointer"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Scope Badge */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {policy.targetScope === "Company-Wide" && (
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-md text-[11px] font-bold">
              <Globe size={12} />
              Company-Wide
            </span>
          )}
          {policy.targetScope === "Department-Specific" && (
            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-md text-[11px] font-bold">
              <Building2 size={12} />
              Dept: {policy.targetDepartments && policy.targetDepartments.length > 0 ? policy.targetDepartments.join(", ") : "All"}
            </span>
          )}
          {policy.targetScope === "Team-Specific" && (
            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-md text-[11px] font-bold">
              <Users size={12} />
              Team: {policy.targetTeams && policy.targetTeams.length > 0 ? policy.targetTeams.join(", ") : "All Teams"}
            </span>
          )}
          {policy.targetScope === "Employee-Specific" && (
            <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-md text-[11px] font-bold">
              <User size={12} />
              {policy.targetEmployees ? policy.targetEmployees.length : 0} Specific Employee(s)
            </span>
          )}
        </div>

        {/* Policy Title */}
        <h3 className="mt-3 text-lg font-extrabold text-slate-800 leading-snug">
          {policy.name}
        </h3>

        {/* Shift Timings Box */}
        <div className="mt-3.5 rounded-2xl bg-slate-50/80 p-3.5 border border-slate-100">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-sky-500" />
              Shift Timing:
            </span>
            <span className="font-extrabold text-sky-600">
              {policy.startTime} - {policy.endTime}
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Days: {Array.isArray(policy.workDays) ? policy.workDays.join(", ") : policy.workDays}</span>
            <span className="font-bold text-slate-700">{policy.workingHours}</span>
          </div>
        </div>

        {/* Detailed Specs */}
        <div className="mt-4 space-y-2 text-xs text-slate-600">
          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <span className="text-slate-400 font-medium">Late Grace Period:</span>
            <span className="font-bold text-slate-700">{policy.gracePeriod}</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <span className="text-slate-400 font-medium">Break Duration:</span>
            <span className="font-bold text-slate-700">{policy.breakDuration}</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <span className="text-slate-400 font-medium">Overtime Rule:</span>
            <span className="font-bold text-slate-700">{policy.overtimeRule}</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <span className="text-slate-400 font-medium">Paid Leave Monthly:</span>
            <span className="font-bold text-emerald-600">{policy.paidLeavesPerMonth}</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-slate-400 font-medium">Sandwich Leave Policy:</span>
            <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${policy.sandwichRuleEnabled !== false ? "bg-amber-100 text-amber-900 border border-amber-200" : "bg-slate-100 text-slate-500"}`}>
              {policy.sandwichRuleEnabled !== false ? "Enabled" : "Disabled"}
            </span>
          </div>
        </div>

        {/* Description preview */}
        {policy.description && (
          <p className="mt-3 text-[11px] text-slate-400 line-clamp-2 italic">
            "{policy.description}"
          </p>
        )}
      </div>

      {/* Footer Action */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
          <Users size={15} className="text-sky-500" />
          <span>~{policy.assignedCount} Active</span>
        </div>

        {canAssign && (
          <button
            onClick={() => onAssign(policy)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-blue-100 hover:from-sky-600 hover:to-blue-700 transition cursor-pointer"
          >
            <UserCheck size={14} />
            Assign Scope
          </button>
        )}
      </div>
    </div>
  );
};

export default PolicyCard;
