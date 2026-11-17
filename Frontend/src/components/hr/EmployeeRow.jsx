import React, { memo } from 'react';
import { Edit2, Trash2, Eye } from "lucide-react";

const EmployeeRow = memo(({ employee, onView, onEdit, onDelete, canEdit = true, canDelete = true }) => (
  <tr className="border-b border-slate-200 hover:bg-slate-50 transition">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-semibold">
          {employee.initials}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800">{employee.name}</p>
          <p className="text-xs text-slate-500">{employee.employeeId}</p>
        </div>
      </div>
    </td>
    <td className="px-6 py-4 text-sm text-slate-600">{employee.email}</td>
    <td className="px-6 py-4 text-sm text-slate-600">{employee.phone}</td>
    <td className="px-6 py-4 text-sm">
      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
        {employee.department}
      </span>
    </td>
    <td className="px-6 py-4 text-sm text-slate-600">{employee.position}</td>
    <td className="px-6 py-4 text-sm">
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${employee.status === "Active"
            ? "bg-green-100 text-green-700"
            : employee.status === "On Leave"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-slate-100 text-slate-700"
          }`}
      >
        {employee.status}
      </span>
    </td>
    <td className="px-6 py-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onView(employee)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
          title="View Employee Profile"
        >
          <Eye size={16} />
        </button>
        {canEdit && (
          <button
            onClick={() => onEdit(employee)}
            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
            title="Edit Employee"
          >
            <Edit2 size={16} />
          </button>
        )}
        {canDelete && (
          <button
            onClick={() => onDelete(employee.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
            title="Delete Employee"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </td>
  </tr>
));

EmployeeRow.displayName = "EmployeeRow";

export default EmployeeRow;
