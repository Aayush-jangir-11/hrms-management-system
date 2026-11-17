import { useState, useEffect } from "react";
import { X, Calendar as CalendarIcon } from "lucide-react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import API from "../../services/api";

const getTodayStr = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const LeaveFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  isHrView = false,
  employeesList = [],
}) => {
  const [formData, setFormData] = useState({
    employeeId: "",
    leaveType: "Paid Leave",
    fromDate: "",
    toDate: "",
    reason: "",
  });

  const [dateBreakdown, setDateBreakdown] = useState([]);
  const [backendEmployees, setBackendEmployees] = useState([]);
  const [formError, setFormError] = useState("");

  // Fetch employees list from backend API when modal opens in HR view
  useEffect(() => {
    const loadEmployees = async () => {
      if (isHrView && isOpen) {
        try {
          const res = await API.get("/hr/employees");
          if (res.data && res.data.success) {
            setBackendEmployees(res.data.data || []);
          }
        } catch (err) {
          console.error("Error fetching employees for leave dropdown:", err);
        }
      }
    };
    loadEmployees();
  }, [isHrView, isOpen]);

  const activeEmployeesList =
    backendEmployees.length > 0 ? backendEmployees : employeesList;

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCalendarSelect = (info) => {
    const todayStr = getTodayStr();
    if (info.startStr < todayStr) {
      return;
    }

    const startDate = info.startStr;

    const endDate = new Date(info.end);
    endDate.setDate(endDate.getDate() - 1);

    const endDateStr = endDate.toISOString().split("T")[0];

    const breakdown = [];

    let currentDate = new Date(startDate);
    const lastDate = new Date(endDateStr);

    while (currentDate <= lastDate) {
      const curStr = currentDate.toISOString().split("T")[0];
      const dayNum = currentDate.getDay();
      const isWeekend = dayNum === 0 || dayNum === 6;

      if (curStr >= todayStr) {
        if (isWeekend) {
          breakdown.push({
            date: curStr,
            leaveType: "Sandwich Weekend Leave",
            payType: "Unpaid",
            dayType: "Full Day",
            halfDaySession: null,
            isSandwiched: true,
          });
        } else {
          breakdown.push({
            date: curStr,
            leaveType: formData.leaveType || "Paid Leave",
            payType: "Paid",
            dayType: "Full Day",
            halfDaySession: null,
            isSandwiched: false,
          });
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (breakdown.length === 0) {
      return;
    }

    setDateBreakdown(breakdown);

    setFormData((prev) => ({
      ...prev,
      fromDate: breakdown[0].date,
      toDate: breakdown[breakdown.length - 1].date,
    }));
  };

  const handleLeaveTypeChange = (targetDate, leaveType) => {
    setDateBreakdown((prev) =>
      prev.map((item) =>
        item.date === targetDate ? { ...item, leaveType } : item,
      ),
    );
  };

  const handlePayTypeChange = (targetDate, payType) => {
    setDateBreakdown((prev) =>
      prev.map((item) =>
        item.date === targetDate ? { ...item, payType } : item,
      ),
    );
  };

  const handleDayTypeChange = (targetDate, dayType) => {
    setDateBreakdown((prev) =>
      prev.map((item) =>
        item.date === targetDate
          ? {
            ...item,
            dayType,
            halfDaySession: item.halfDaySession || "First Half",
          }
          : item,
      ),
    );
  };

  const handleSessionChange = (targetDate, halfDaySession) => {
    setDateBreakdown((prev) =>
      prev.map((item) =>
        item.date === targetDate ? { ...item, halfDaySession } : item,
      ),
    );
  };

  const handleSetAllLeaveType = (leaveType) => {
    setDateBreakdown((prev) => prev.map((item) => ({ ...item, leaveType })));
  };

  const handleSetAllPayType = (payType) => {
    setDateBreakdown((prev) => prev.map((item) => ({ ...item, payType })));
  };

  const handleSetAllDayType = (dayType) => {
    setDateBreakdown((prev) =>
      prev.map((item) => ({
        ...item,
        dayType,
        halfDaySession:
          dayType === "Half Day" ? item.halfDaySession || "First Half" : null,
      })),
    );
  };

  const handleSetAllSession = (halfDaySession) => {
    setDateBreakdown((prev) =>
      prev.map((item) => ({ ...item, halfDaySession })),
    );
  };

  const handleRemoveDate = (targetDate) => {
    const updated = dateBreakdown.filter((item) => item.date !== targetDate);
    setDateBreakdown(updated);
    if (updated.length > 0) {
      setFormData((prev) => ({
        ...prev,
        fromDate: updated[0].date,
        toDate: updated[updated.length - 1].date,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        fromDate: "",
        toDate: "",
      }));
    }
  };

  const totalDays = dateBreakdown.reduce(
    (sum, item) => sum + (item.dayType === "Half Day" ? 0.5 : 1.0),
    0,
  );

  const sandwichedCount = dateBreakdown.filter(
    (item) => item.isSandwiched,
  ).length;

  const formatDate = (date) => {
    if (!date) return "";
    const [year, month, day] = date.split("-");
    if (!year || !month || !day) return date;
    const formatted = new Date(year, month - 1, day);
    return formatted.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getDayName = (dateStr) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    if (!y || !m || !d) return "";
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString("en-US", { weekday: "short" });
  };

  const buildBreakdown = (startDateStr, endDateStr) => {
    const todayStr = getTodayStr();
    const breakdown = [];
    let currentDate = new Date(startDateStr);
    const lastDate = new Date(endDateStr);

    while (currentDate <= lastDate) {
      const curStr = currentDate.toISOString().split("T")[0];
      const dayNum = currentDate.getDay();
      const isWeekend = dayNum === 0 || dayNum === 6;

      if (curStr >= todayStr) {
        if (isWeekend) {
          breakdown.push({
            date: curStr,
            leaveType: "Sandwich Weekend Leave",
            payType: "Unpaid",
            dayType: "Full Day",
            halfDaySession: null,
            isSandwiched: true,
          });
        } else {
          breakdown.push({
            date: curStr,
            leaveType: formData.leaveType || "Paid Leave",
            payType: "Paid",
            dayType: "Full Day",
            halfDaySession: null,
            isSandwiched: false,
          });
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return breakdown;
  };

  const handleDateInputChange = (field, val) => {
    setFormError("");
    const updatedForm = { ...formData, [field]: val };
    setFormData(updatedForm);

    const todayStr = getTodayStr();
    if (updatedForm.fromDate && updatedForm.fromDate < todayStr) {
      setFormError("From Date cannot be in the past.");
      return;
    }

    if (updatedForm.fromDate && updatedForm.toDate) {
      if (updatedForm.toDate < updatedForm.fromDate) {
        setFormError("To Date (End date) cannot be earlier than From Date (Start date).");
        return;
      }
      const bdown = buildBreakdown(updatedForm.fromDate, updatedForm.toDate);
      setDateBreakdown(bdown);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");
    const todayStr = getTodayStr();

    if (isHrView && !formData.employeeId) {
      setFormError("Please select an employee.");
      return;
    }

    if (!formData.fromDate || !formData.toDate) {
      setFormError("Please select both From Date and To Date.");
      return;
    }

    if (formData.fromDate < todayStr) {
      setFormError("From Date cannot be in the past.");
      return;
    }

    if (formData.toDate < formData.fromDate) {
      setFormError("To Date cannot be earlier than From Date.");
      return;
    }

    if (!formData.reason.trim() || formData.reason.trim().length < 3) {
      setFormError("Please provide a valid reason for leave (at least 3 characters).");
      return;
    }

    onSubmit({
      ...formData,
      leaveType: "Paid Leave",
      dateBreakdown,
      days: totalDays,
    });

    // Reset form & close
    setFormData({
      employeeId: "",
      fromDate: "",
      toDate: "",
      reason: "",
    });
    setDateBreakdown([]);
    setFormError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-between text-white shadow-md">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight">
              Apply Leave Request
            </h2>
            <p className="text-xs text-sky-100 mt-0.5 font-medium">
              Drag calendar dates & set Paid/Unpaid, Half Day (1st Half / 2nd
              Half) options
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-4 overflow-y-auto flex-1"
        >
          {/* Employee Selection for HR View */}
          {isHrView && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Select Employee <span className="text-rose-500">*</span>
              </label>
              <select
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 bg-white transition cursor-pointer"
              >
                <option value="">Select Employee</option>
                {activeEmployeesList.length > 0 ? (
                  activeEmployeesList.map((emp) => (
                    <option
                      key={emp._id || emp.id || emp.employeeId}
                      value={emp.employeeId || emp.id || emp._id}
                    >
                      {emp.name || emp.employeeName} ({emp.employeeId || emp.id || "EMP"}) - {emp.department || "General"}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No employees found</option>
                )}
              </select>
            </div>
          )}

          {/* FullCalendar Interactive Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Leave Dates (Click & Drag Range){" "}
                <span className="text-rose-500">*</span>
              </label>

              {formData.fromDate && formData.toDate && (
                <span className="text-xs font-extrabold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-200 shadow-2xs">
                  Total: {totalDays} Day(s)
                </span>
              )}
            </div>

            <div className="w-full rounded-2xl border border-sky-100 bg-slate-50/50 p-2 shadow-xs [&_.fc]:text-xs [&_.fc-toolbar]:mb-1.5 [&_.fc-toolbar]:p-1 [&_.fc-toolbar]:bg-sky-500/10 [&_.fc-toolbar]:rounded-xl [&_.fc-toolbar-title]:text-[11px] [&_.fc-toolbar-title]:font-bold [&_.fc-toolbar-title]:text-sky-950 [&_.fc-button]:text-[9px] [&_.fc-button]:font-bold [&_.fc-button]:px-1.5 [&_.fc-button]:py-0.5 [&_.fc-icon]:text-[10px] [&_.fc-icon]:leading-none [&_.fc-button]:bg-gradient-to-r [&_.fc-button]:from-sky-500 [&_.fc-button]:to-blue-600 [&_.fc-button]:border-0 [&_.fc-button]:rounded-lg [&_.fc-daygrid-day-frame]:min-h-[28px] [&_.fc-daygrid-day-frame]:p-0.5 [&_.fc-daygrid-day-number]:text-[11px] [&_.fc-daygrid-day-number]:font-semibold [&_.fc-daygrid-day-number]:text-slate-700 [&_.fc-col-header-cell-cushion]:text-[10px] [&_.fc-col-header-cell-cushion]:text-sky-600 [&_.fc-col-header-cell-cushion]:font-extrabold [&_.fc-highlight]:bg-gradient-to-r [&_.fc-highlight]:from-sky-200/80 [&_.fc-highlight]:via-indigo-200/80 [&_.fc-highlight]:to-purple-200/80 [&_.fc-highlight]:rounded-lg [&_.fc-highlight]:border [&_.fc-highlight]:border-indigo-300/60 [&_.fc-day-today]:bg-sky-100/70">
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                selectable={true}
                select={handleCalendarSelect}
                selectAllow={(selectInfo) => {
                  const todayStr = getTodayStr();
                  return selectInfo.startStr >= todayStr;
                }}
                validRange={{
                  start: getTodayStr(),
                }}
                unselectAuto={false}
                height="auto"
                dayMaxEvents={true}
              />
            </div>

            {/* Quick Date Inputs */}
            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  From Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  min={getTodayStr()}
                  value={formData.fromDate}
                  onChange={(e) => handleDateInputChange("fromDate", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 bg-white cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  To Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  min={formData.fromDate || getTodayStr()}
                  value={formData.toDate}
                  onChange={(e) => handleDateInputChange("toDate", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 bg-white cursor-pointer"
                />
              </div>
            </div>

            {/* Sandwich Leave Rule Notice Banner */}
            {sandwichedCount > 0 && (
              <div className="mt-3.5 p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-2xl text-xs text-amber-900 flex items-start gap-3 shadow-xs">
                <div>
                  <h4 className="font-extrabold text-amber-950 text-xs">
                    Sandwich Leave Policy Applied
                  </h4>
                  <p className="mt-0.5 text-amber-800 text-[11px] leading-relaxed font-medium">
                    Your selected leave range spans across a weekend ({sandwichedCount} weekend day(s): Sat/Sun). Under company sandwich rule policy, weekend days between leaves are counted into total leave duration.
                  </p>
                </div>
              </div>
            )}

            {/* Selected Dates Breakdown with Dropdown Selectors */}
            {dateBreakdown.length > 0 && (
              <div className="mt-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Selected Dates Options ({dateBreakdown.length} Date Range)
                  </label>
                  <span className="text-[11px] font-extrabold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-200">
                    Total: {totalDays} Day(s)
                  </span>
                </div>

                {/* Bulk Options Toolbar with Dropdown Selectors */}
                <div className="bg-slate-100/90 p-2.5 rounded-xl border border-slate-200/80 text-xs flex flex-wrap items-center justify-between gap-2.5">
                  <span className="text-[11px] font-bold text-slate-600">
                    Bulk Actions:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Bulk Leave Type Selector */}
                    <select
                      onChange={(e) => {
                        if (e.target.value) handleSetAllLeaveType(e.target.value);
                      }}
                      className="px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-700 outline-none focus:border-sky-500 cursor-pointer shadow-2xs"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Set Leave Type (All)...
                      </option>
                      <option value="Casual Leave">All Casual Leave</option>
                      <option value="Sick Leave">All Sick Leave</option>
                      <option value="Paid Leave">All Paid Leave</option>
                      <option value="Annual / Earned Leave">All Earned Leave</option>
                      <option value="Work From Home">All Work From Home</option>
                      <option value="Unpaid Leave / LWP">All Unpaid Leave</option>
                    </select>

                    {/* Bulk Pay Type Dropdown */}
                    <select
                      onChange={(e) => {
                        if (e.target.value) handleSetAllPayType(e.target.value);
                      }}
                      className="px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-700 outline-none focus:border-sky-500 cursor-pointer shadow-2xs"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Set Pay Type (All)...
                      </option>
                      <option value="Paid">All Paid Leave</option>
                      <option value="Unpaid">All Unpaid Leave</option>
                    </select>

                    {/* Bulk Day Duration / Session Dropdown */}
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "Full Day") {
                          handleSetAllDayType("Full Day");
                        } else if (val === "First Half") {
                          handleSetAllDayType("Half Day");
                          handleSetAllSession("First Half");
                        } else if (val === "Second Half") {
                          handleSetAllDayType("Half Day");
                          handleSetAllSession("Second Half");
                        }
                      }}
                      className="px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-700 outline-none focus:border-sky-500 cursor-pointer shadow-2xs"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Set Duration (All)...
                      </option>
                      <option value="Full Day">
                        All Full Day (1.0 Day)
                      </option>
                      <option value="First Half">
                        All 1st Half (Morning: 9 AM - 1:30 PM)
                      </option>
                      <option value="Second Half">
                        All 2nd Half (Afternoon: 1:30 PM - 6 PM)
                      </option>
                    </select>
                  </div>
                </div>

                {/* Individual Date Rows with Clean Dropdown Select Boxes */}
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1 rounded-2xl border border-sky-100 bg-sky-50/40 p-2.5">
                  {dateBreakdown.map((item, idx) => (
                    <div
                      key={item.date}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 rounded-xl border border-slate-200/90 bg-white shadow-2xs hover:border-sky-300 transition"
                    >
                      {/* Left: Date Details */}
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 text-white font-extrabold text-[11px] shadow-2xs">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                            <CalendarIcon
                              size={13}
                              className="text-sky-500 shrink-0"
                            />
                            <span>{formatDate(item.date)}</span>
                            <span className="text-[10px] font-extrabold text-sky-700 bg-sky-50 border border-sky-100 px-1.5 py-0.5 rounded">
                              {getDayName(item.date)}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Right: Dropdowns & Action */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Per-Date Leave Type Dropdown */}
                        <select
                          value={item.leaveType || formData.leaveType || "Casual Leave"}
                          onChange={(e) =>
                            handleLeaveTypeChange(item.date, e.target.value)
                          }
                          className="px-2.5 py-1.5 border border-slate-200 bg-white text-slate-800 rounded-xl text-xs font-bold outline-none focus:border-sky-500 cursor-pointer shadow-2xs transition hover:border-sky-300"
                        >
                          <option value="Casual Leave">Casual Leave</option>
                          <option value="Sick Leave">Sick Leave</option>
                          <option value="Paid Leave">Paid Leave</option>
                          <option value="Annual / Earned Leave">Earned Leave</option>
                          <option value="Work From Home">Work From Home</option>
                          <option value="Unpaid Leave / LWP">Unpaid Leave</option>
                          <option value="Compensatory Off">Comp-Off</option>
                        </select>

                        {/* Pay Type Dropdown */}
                        <select
                          value={item.payType}
                          onChange={(e) =>
                            handlePayTypeChange(item.date, e.target.value)
                          }
                          className={`px-2.5 py-1.5 border rounded-xl text-xs font-bold outline-none focus:border-sky-500 cursor-pointer shadow-2xs transition ${item.payType === "Paid"
                            ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                            : "border-amber-300 bg-amber-50 text-amber-900"
                            }`}
                        >
                          <option value="Paid">Paid</option>
                          <option value="Unpaid">Unpaid</option>
                        </select>

                        {/* Day Duration & Session Dropdown */}
                        <select
                          value={
                            item.dayType === "Half Day"
                              ? item.halfDaySession === "Second Half"
                                ? "Second Half"
                                : "First Half"
                              : "Full Day"
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "Full Day") {
                              handleDayTypeChange(item.date, "Full Day");
                            } else if (val === "First Half") {
                              handleDayTypeChange(item.date, "Half Day");
                              handleSessionChange(item.date, "First Half");
                            } else if (val === "Second Half") {
                              handleDayTypeChange(item.date, "Half Day");
                              handleSessionChange(item.date, "Second Half");
                            }
                          }}
                          className={`px-2.5 py-1.5 border rounded-xl text-xs font-bold outline-none focus:border-sky-500 cursor-pointer shadow-2xs transition ${item.dayType === "Half Day"
                            ? "border-purple-300 bg-purple-50 text-purple-900"
                            : "border-slate-200 bg-white text-slate-700"
                            }`}
                        >
                          <option value="Full Day">
                            Full Day (1.0 Day)
                          </option>
                          <option value="First Half">
                            1st Half (Morning: 9:00 AM - 1:30 PM)
                          </option>
                          <option value="Second Half">
                            2nd Half (Afternoon: 1:30 PM - 6:00 PM)
                          </option>
                        </select>

                        {/* Remove Date Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveDate(item.date)}
                          title="Remove Date"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              required
              rows="3"
              placeholder="Enter reason for leave..."
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 resize-none transition"
            />
          </div>

          {/* Inline Validation Alert */}
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2">
              <span>⚠️</span>
              <span>{formError}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-200 transition cursor-pointer"
            >
              Submit Leave
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveFormModal;
