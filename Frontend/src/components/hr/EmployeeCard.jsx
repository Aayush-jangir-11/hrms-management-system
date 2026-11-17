import React, { memo } from 'react';
import { Edit2, Trash2, Eye, Mail, Phone, Building2, Briefcase } from "lucide-react";

/**
 * Mobile Card View for Employee Directory
 * Transforms traditional table row into a touch-friendly, high-clarity card for phone screens.
 */
const EmployeeCard = memo(({ employee, onView, onEdit, onDelete, canEdit = true, canDelete = true }) => (
  <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition hover:shadow-md space-y-3.5">
    {/* Card Header: Avatar + Name + Status */}
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
          {employee.initials}
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-slate-800 truncate">{employee.name}</h4>
          <span className="inline-block text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md mt-0.5">
            {employee.employeeId}
          </span>
        </div>
      </div>

      <span
        className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${
          employee.status === "Active"
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
            : employee.status === "On Leave"
            ? "bg-amber-50 text-amber-700 border border-amber-200/60"
            : "bg-slate-100 text-slate-600 border border-slate-200"
        }`}
      >
        {employee.status}
      </span>
    </div>

    {/* Badges / Position & Department */}
    <div className="flex flex-wrap gap-2 text-xs">
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 font-semibold text-[11px]">
        <Building2 size={13} className="text-sky-500" />
        {employee.department}
      </span>
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold text-[11px]">
        <Briefcase size={13} className="text-indigo-500" />
        {employee.position}
      </span>
    </div>

    {/* Contact Details Box */}
    <div className="rounded-xl bg-slate-50/80 p-3 text-xs space-y-1.5 text-slate-600 border border-slate-100">
      <div className="flex items-center gap-2 truncate">
        <Mail size={13} className="text-slate-400 shrink-0" />
        <span className="truncate">{employee.email}</span>
      </div>
      <div className="flex items-center gap-2">
        <Phone size={13} className="text-slate-400 shrink-0" />
        <span>{employee.phone || "N/A"}</span>
      </div>
    </div>

    {/* Card Footer: Action Buttons */}
    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
      <button
        type="button"
        onClick={() => onView(employee)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-xl transition cursor-pointer"
        title="View Employee Profile"
      >
        <Eye size={14} />
        View
      </button>

      {canEdit && (
        <button
          type="button"
          onClick={() => onEdit(employee)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition cursor-pointer"
          title="Edit Employee"
        >
          <Edit2 size={14} />
          Edit
        </button>
      )}

      {canDelete && (
        <button
          type="button"
          onClick={() => onDelete(employee.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition cursor-pointer"
          title="Delete Employee"
        >
          <Trash2 size={14} />
          Delete
        </button>
      )}
    </div>
  </div>
));

EmployeeCard.displayName = "EmployeeCard";

export default EmployeeCard;
