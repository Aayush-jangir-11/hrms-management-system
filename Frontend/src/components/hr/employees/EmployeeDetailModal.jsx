import React from "react";
import { Mail, Phone } from "lucide-react";

const EmployeeDetailModal = ({
  isOpen,
  onClose,
  employee,
  onEdit,
}) => {
  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-96 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-indigo-500 text-white flex items-center justify-center text-2xl font-semibold">
                {employee.initials}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {employee.name}
                </h2>
                <p className="text-slate-600">
                  {employee.position}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 cursor-pointer text-lg"
            >
              ✕
            </button>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-xs text-slate-500 mb-1">EMPLOYEE ID</p>
              <p className="text-sm font-medium text-slate-800">
                {employee.employeeId}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">DEPARTMENT</p>
              <p className="text-sm font-medium text-slate-800">
                {employee.department}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">SHIFT POLICY</p>
              <p className="text-sm font-bold text-sky-700">
                {employee.shift || "Standard General Shift (09:00 AM - 06:00 PM)"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">ASSIGNED HR MANAGER</p>
              <p className="text-sm font-semibold text-slate-800">
                {employee.assignedHr || "Admin Self Managed"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">STATUS</p>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${
                  employee.status === "Active"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {employee.status}
              </span>
            </div>
          </div>

          {/* Contact Info */}
          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">
              Contact Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-slate-500" />
                <a
                  href={`mailto:${employee.email}`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  {employee.email}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-slate-500" />
                <a
                  href={`tel:${employee.phone}`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  {employee.phone}
                </a>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium text-sm cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(employee);
              }}
              className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition font-medium text-sm cursor-pointer"
            >
              Edit Employee
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailModal;
