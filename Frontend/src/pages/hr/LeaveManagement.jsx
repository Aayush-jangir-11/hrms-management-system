import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  FileText,
  Loader,
  CheckCircle2,
  X,
  Sparkles,
} from "lucide-react";
import StatCard from "../../components/common/StatCard";
import LeaveRequestRow from "../../components/hr/LeaveRequestRow";
import LeaveRequestCard from "../../components/hr/LeaveRequestCard";
import LeaveFormModal from "../../components/common/LeaveFormModal";
import TableSkeleton from "../../components/common/TableSkeleton";
import API from "../../services/api";
import { useGet, usePost, usePut, useDelete } from "../../hooks/useApi";
import { useDebounce } from "../../hooks/useDebounce";
import { usePermission } from "../../hooks/usePermission";
import { useToast } from "../../hooks/useToast";

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return "N/A";
  if (/^\d{1,2}\s+[A-Za-z]{3,}\s+\d{4}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const LeaveManagement = () => {
  const { can } = usePermission("leave");
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterType, setFilterType] = useState("All");

  /* ── TanStack Query: Fetch all leave requests ── */
  const { data: rawLeaveData, isLoading: loading } = useGet("/leave/all", ["leaveRequests"]);

  const leaveRequests = useMemo(() => {
    if (rawLeaveData && rawLeaveData.success) {
      return (rawLeaveData.data || []).map((leave) => ({
        id: leave._id,
        employeeName: leave.employee?.name || "Employee",
        employeeId: leave.employee?.employeeId || `EMP${leave._id.substring(0, 4)}`,
        department: leave.employee?.department || "General",
        email: leave.employee?.email || "N/A",
        leaveType: leave.leaveType || "Casual Leave",
        fromDate: leave.fromDate ? leave.fromDate.split("T")[0] : "",
        toDate: leave.toDate ? leave.toDate.split("T")[0] : "",
        days: leave.days || 1,
        reason: leave.reason || "N/A",
        status: leave.status || "Pending",
        appliedDate: leave.createdAt ? leave.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
        dateBreakdown: leave.dateBreakdown || [],
      }));
    }
    return [];
  }, [rawLeaveData]);

  // Compute Live Statistics
  const totalCount = leaveRequests.length;
  const approvedCount = leaveRequests.filter((l) => l.status === "Approved").length;
  const pendingCount = leaveRequests.filter((l) => l.status === "Pending").length;
  const rejectedCount = leaveRequests.filter((l) => l.status === "Rejected").length;

  const stats = [
    {
      icon: Calendar,
      title: "Total Applications",
      value: String(totalCount),
      subtitle: "Total leave requests",
      color: "bg-gradient-to-br from-sky-500 to-blue-600",
    },
    {
      icon: CheckCircle,
      title: "Approved Leaves",
      value: String(approvedCount),
      subtitle: "Approved applications",
      color: "bg-emerald-500",
    },
    {
      icon: Clock,
      title: "Pending Approvals",
      value: String(pendingCount),
      subtitle: "Awaiting HR action",
      color: "bg-orange-500",
    },
    {
      icon: AlertCircle,
      title: "Rejected Leaves",
      value: String(rejectedCount),
      subtitle: "Declined applications",
      color: "bg-rose-500",
    },
  ];

  const leaveTypes = [
    "All",
    "Casual Leave",
    "Sick Leave",
    "Work From Home",
    "Maternity / Paternity Leave",
    "Compensatory Off (Comp-Off)",
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterStatus, filterType]);

  const filteredRequests = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return leaveRequests.filter((req) => {
      const matchesSearch =
        !query ||
        req.employeeName.toLowerCase().includes(query) ||
        req.employeeId.toLowerCase().includes(query);
      const matchesStatus = filterStatus === "All" || req.status === filterStatus;
      const matchesType = filterType === "All" || req.leaveType === filterType;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [leaveRequests, debouncedSearch, filterStatus, filterType]);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage) || 1;
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ── TanStack Query Mutations ──
  const applyLeaveMutation = usePost("/leave/apply", {
    invalidateKeys: [["leaveRequests"]],
    onSuccess: (dataRes) => {
      if (dataRes && dataRes.success) {
        showToast("Leave request submitted successfully!", "success");
        setShowForm(false);
      }
    },
    onError: (err) => {
      console.error("[HR] Error submitting leave:", err);
      showToast(err.response?.data?.message || "Failed to submit leave request.", "error");
    },
  });

  const updateLeaveStatusMutation = usePut("/leave", {
    invalidateKeys: [["leaveRequests"]],
    onSuccess: (dataRes, variables) => {
      if (dataRes && dataRes.success) {
        const isApproved = variables?.data?.status === "Approved";
        showToast(
          isApproved
            ? "Leave request approved successfully!"
            : "Leave request rejected.",
          isApproved ? "success" : "delete"
        );
      }
    },
    onError: (err, variables) => {
      console.error(`[HR] Error updating leave:`, err);
      showToast(
        err.response?.data?.message || `Failed to update leave status.`,
        "error"
      );
    },
  });

  const deleteLeaveMutation = useDelete("/leave", {
    invalidateKeys: [["leaveRequests"]],
    onSuccess: (dataRes) => {
      if (dataRes && dataRes.success) {
        showToast("Leave request deleted.", "delete");
      }
    },
    onError: (err) => {
      console.error("[HR] Error deleting leave:", err);
      showToast(err.response?.data?.message || "Failed to delete leave request.", "error");
    },
  });

  // Apply for Leave (POST /api/leave/apply)
  const handleLeaveFormSubmit = (data) => {
    const payload = {
      employeeId: data.employeeId,
      leaveType: data.leaveType,
      fromDate: data.fromDate,
      toDate: data.toDate,
      reason: data.reason,
      dateBreakdown: data.dateBreakdown || [],
    };
    applyLeaveMutation.mutate(payload);
  };

  // Approve Leave (PUT /api/leave/:id/status)
  const handleApprove = (id) => {
    updateLeaveStatusMutation.mutate({ id: `${id}/status`, data: { status: "Approved" } });
  };

  // Reject Leave (PUT /api/leave/:id/status)
  const handleReject = (id) => {
    updateLeaveStatusMutation.mutate({ id: `${id}/status`, data: { status: "Rejected" } });
  };

  // Delete Leave (DELETE /api/leave/:id)
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this leave request record?")) {
      deleteLeaveMutation.mutate(id);
    }
  };

  const handleView = (request) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  return (
    <div className="relative">
      {/* ================= HERO SECTION ================= */}
      <div className="relative mb-7 overflow-hidden rounded-[28px] bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-200/50 md:p-8">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 right-32 h-56 w-56 rounded-full bg-indigo-400/20 blur-xl" />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 text-xs font-semibold backdrop-blur-md border border-white/20">
              <Sparkles size={14} className="text-sky-200" />
              <span className="tracking-wide">Leave Management & Approvals</span>
            </div>

            <h1 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
              Employee Leave Portal
            </h1>

            <p className="max-w-2xl text-xs font-medium text-sky-100 sm:text-sm">
              Review employee leave applications, approve or decline requests, track leave balances, and log team leaves smoothly.
            </p>
          </div>

          {can("create") && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-bold text-blue-700 shadow-lg shadow-blue-900/20 transition hover:-translate-y-0.5 hover:bg-sky-50 active:translate-y-0 cursor-pointer shrink-0"
              title="Apply / Grant Leave"
            >
              <Plus size={16} />
              Apply / Grant Leave
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Leave Applications ({filteredRequests.length})
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                View and process all workforce leave requests synced with backend database
              </p>
            </div>
            {can("create") && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white transition shadow-md shadow-blue-200 cursor-pointer"
                title="Apply / Grant Leave"
              >
                <Plus size={16} />
                Apply / Grant Leave
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search employee name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-sky-500"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-sky-500 cursor-pointer bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending Approvals</option>
              <option value="Approved">Approved Leaves</option>
              <option value="Rejected">Rejected Leaves</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-sky-500 cursor-pointer bg-white"
            >
              {leaveTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* DESKTOP TABLE VIEW (Screens >= 768px) */}
        <div className="hidden md:block overflow-x-auto max-h-[580px] overflow-y-auto">
          <table className="w-full min-w-[1050px] text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 shadow-2xs">
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4 pl-6">Employee</th>
                <th className="p-4">Leave Type</th>
                <th className="p-4">From Date</th>
                <th className="p-4">To Date</th>
                <th className="p-4">Days</th>
                <th className="p-4">Reason</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <TableSkeleton rows={itemsPerPage || 10} cols={8} hasAvatar={true} />
              ) : paginatedRequests.length > 0 ? (
                paginatedRequests.map((request) => (
                  <LeaveRequestRow
                    key={request.id}
                    request={request}
                    onView={handleView}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onDelete={handleDelete}
                    canApprove={can("approve")}
                    canDelete={can("delete")}
                  />
                ))
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <FileText size={24} className="text-slate-400 mb-3" />
                      <p className="text-xs font-bold text-slate-500">No leave requests found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARD VIEW (Phone screens < 768px) */}
        <div className="md:hidden p-3.5 space-y-3 bg-slate-50/50">
          {loading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs animate-pulse space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-200 shrink-0" />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="h-4 w-32 rounded bg-slate-200" />
                    <div className="h-3 w-20 rounded bg-slate-100" />
                  </div>
                  <div className="h-6 w-16 rounded-full bg-slate-100 shrink-0" />
                </div>
                <div className="flex gap-2">
                  <div className="h-6 w-24 rounded-lg bg-slate-100" />
                  <div className="h-6 w-16 rounded-lg bg-slate-100" />
                </div>
                <div className="h-16 rounded-xl bg-slate-50 border border-slate-100" />
                <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
                  <div className="h-7 w-16 rounded-xl bg-slate-100" />
                  <div className="h-7 w-20 rounded-xl bg-slate-100" />
                </div>
              </div>
            ))
          ) : paginatedRequests.length > 0 ? (
            paginatedRequests.map((request) => (
              <LeaveRequestCard
                key={request.id}
                request={request}
                onView={handleView}
                onApprove={handleApprove}
                onReject={handleReject}
                onDelete={handleDelete}
                canApprove={can("approve")}
                canDelete={can("delete")}
              />
            ))
          ) : (
            <div className="py-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200/80 p-6">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FileText size={22} className="text-slate-400" />
              </div>
              <p className="text-sm font-bold text-slate-700">No leave requests found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria</p>
            </div>
          )}
        </div>

        {/* Pagination Controls Footer */}
        {filteredRequests.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
            <p className="text-slate-500">
              Showing{" "}
              <span className="font-extrabold text-slate-800">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{" "}
              to{" "}
              <span className="font-extrabold text-slate-800">
                {Math.min(currentPage * itemsPerPage, filteredRequests.length)}
              </span>{" "}
              of{" "}
              <span className="font-extrabold text-slate-800">
                {filteredRequests.length}
              </span>{" "}
              requests
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold hover:bg-sky-50 hover:text-sky-600 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-700 transition cursor-pointer shadow-2xs"
              >
                Previous
              </button>

              <span className="px-3 py-1.5 rounded-xl bg-sky-100 text-sky-800 font-extrabold border border-sky-200">
                Page {currentPage} of {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold hover:bg-sky-50 hover:text-sky-600 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-700 transition cursor-pointer shadow-2xs"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Leave Request Form Modal Component */}
      <LeaveFormModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleLeaveFormSubmit}
        isHrView={true}
        employeesList={leaveRequests}
      />

      {/* Leave Request Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-5 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-between text-white shadow-md">
              <div>
                <h2 className="text-lg font-extrabold tracking-tight">Leave Request Details</h2>
                <p className="text-xs text-sky-100 font-medium">Full information & schedule</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1 rounded-full hover:bg-white/20 text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">EMPLOYEE</p>
                <p className="text-sm font-extrabold text-slate-800">
                  {selectedRequest.employeeName} <span className="text-xs text-slate-500 font-medium">({selectedRequest.employeeId})</span>
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">LEAVE TYPE</p>
                <span className="px-2.5 py-1 bg-sky-100 text-sky-800 rounded-lg text-xs font-bold inline-block border border-sky-200">
                  {selectedRequest.leaveType}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">FROM DATE</p>
                  <p className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Calendar size={13} className="text-sky-500 shrink-0" />
                    <span>{formatDateDisplay(selectedRequest.fromDate)}</span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">TO DATE</p>
                  <p className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Calendar size={13} className="text-blue-500 shrink-0" />
                    <span>{formatDateDisplay(selectedRequest.toDate)}</span>
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">TOTAL DURATION</p>
                <p className="text-xs font-extrabold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200/80 w-fit">
                  {selectedRequest.days || 1} {selectedRequest.days === 1 ? "Day" : "Days"}
                </p>
              </div>

              {/* Date Breakdown List if available */}
              {selectedRequest.dateBreakdown && selectedRequest.dateBreakdown.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">DAY-BY-DAY BREAKDOWN</p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {selectedRequest.dateBreakdown.map((item, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                            <Calendar size={12} className="text-sky-500 shrink-0" />
                            <span>{formatDateDisplay(item.date || item.formattedDate)}</span>
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${item.payType === "Paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                              {item.payType || "Paid"}
                            </span>
                            {item.isSandwiched && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-orange-100 text-orange-800">
                                Sandwiched
                              </span>
                            )}
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${item.dayType === "Half Day" ? "bg-purple-100 text-purple-800" : "bg-sky-100 text-sky-800"}`}>
                              {item.dayType || "Full Day"}
                            </span>
                          </div>
                        </div>
                        {item.dayType === "Half Day" && (
                          <div className="text-[10px] font-bold text-purple-700 flex items-center gap-1 bg-purple-50 px-2 py-0.5 rounded border border-purple-200/60 mt-0.5">
                            <span>Session:</span>
                            <span className="font-extrabold">
                              {item.halfDaySession === "Second Half" ? "2nd Half (Afternoon to Evening)" : "1st Half (Morning to Afternoon)"}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">REASON</p>
                <p className="text-xs font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {selectedRequest.reason}
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">STATUS</p>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full inline-block ${selectedRequest.status === "Approved"
                      ? "bg-green-100 text-green-700"
                      : selectedRequest.status === "Rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                      }`}
                  >
                    {selectedRequest.status}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">APPLIED ON</p>
                  <p className="text-xs font-semibold text-slate-700">
                    {selectedRequest.appliedDate}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl hover:from-sky-600 hover:to-blue-700 transition font-bold text-xs shadow-md shadow-blue-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
