import { Eye, Edit2, Trash2 } from "lucide-react";

const DepartmentRow = ({ dept, onView, onEdit, onDelete }) => (
  <div className="bg-white border-b border-slate-100 hover:bg-sky-50/40 transition-all duration-200">
    <div className="grid grid-cols-7 gap-4 p-4 items-center">
      <div>
        <p className="font-semibold text-slate-800 text-sm">{dept.name}</p>
      </div>
      <div>
        <span className="inline-block bg-sky-50 text-sky-700 border border-sky-200 text-xs font-semibold px-3 py-1 rounded-full shadow-2xs">
          {dept.employeeCount} Members
        </span>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-600">{dept.manager}</p>
      </div>
      <div>
        <p className="text-sm text-slate-500">{dept.location}</p>
      </div>
      <div>
        <span
          className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${
            dept.status === "Active"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-rose-50 text-rose-700 border border-rose-200"
          }`}
        >
          {dept.status}
        </span>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800">{dept.budget}</p>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onView(dept)}
          className="p-2 text-sky-600 hover:bg-sky-50 rounded-xl transition-all duration-200"
          title="View"
        >
          <Eye size={18} />
        </button>
        <button
          onClick={() => onEdit(dept)}
          className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-all duration-200"
          title="Edit"
        >
          <Edit2 size={18} />
        </button>
        <button
          onClick={() => onDelete(dept.id)}
          className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200"
          title="Delete"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  </div>
);

export default DepartmentRow;
