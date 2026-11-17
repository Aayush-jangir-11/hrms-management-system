import { useState, useMemo } from "react";
import {
  CalendarDays,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  Sparkles,
  Loader,
  ShieldCheck,
  Search,
  X,
  FileText,
} from "lucide-react";
import LeaveFormModal from "../../components/common/LeaveFormModal";
import { useGet, usePost, useDelete } from "../../hooks/useApi";
import { useDebounce } from "../../hooks/useDebounce";
import { usePermission } from "../../hooks/usePermission";
import { useToast } from "../../hooks/useToast";

const Leave = () => {
  const { can } = usePermission("leave");
  const { showToast } = useToast();
  const canApply = can("apply") || can("create");
  const canCancel = can("cancel") || can("delete");

  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState("All");

  // ================================
  // Fetch Leaves via TanStack Query
  // ================================
  const { data: leavesRes, isLoading: loadingLeaves } = useGet(
    "/leave/my-leaves",
    "employee-my-leaves"
  );

  const leaves = useMemo(() => {
    if (leavesRes?.success && Array.isArray(leavesRes.data)) {
      return leavesRes.data.map((leave) => {
        const fromFormatted = new Date(leave.fromDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        const toFormatted = new Date(leave.toDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });

        return {
          id: leave._id,
          type: leave.leaveType || "Paid Leave",
          from: fromFormatted,
          to: toFormatted,
          rawFrom: leave.fromDate,
          rawTo: leave.toDate,
          days: leave.days || 1,
          reason: leave.reason,
          status: leave.status,
          rejectionReason: leave.rejectionReason,
          dateBreakdown: leave.dateBreakdown || [],
          createdAt: leave.createdAt,
        };
      });
    }
    return [];
  }, [leavesRes]);

  // Fetch Working Policies via TanStack Query
  const { data: policiesRes } = useGet(
    "/policies",
    "working-policies"
  );

  const policies = useMemo(() => {
    return policiesRes?.success && Array.isArray(policiesRes.data) ? policiesRes.data : [];
  }, [policiesRes]);

  const loading = loadingLeaves;

  // Active Policy & Dynamic Stats
  // ================================
  const activePolicy = useMemo(() => {
    return policies.find((p) => p.status === "Active") || policies[0] || null;
  }, [policies]);

  const totalAllocated = useMemo(() => {
    if (!activePolicy || !activePolicy.paidLeavesPerMonth) return 24;
    const numericPerMonth = parseFloat(
      activePolicy.paidLeavesPerMonth.toString().replace(/[^0-9.]/g, "")
    );
    if (!isNaN(numericPerMonth) && numericPerMonth > 0) {
      return Math.round(numericPerMonth * 12);
    }
    return 24;
  }, [activePolicy]);

  const approvedLeavesCount = useMemo(() => {
    return leaves
      .filter((l) => l.status === "Approved")
      .reduce((sum, l) => sum + (Number(l.days) || 0), 0);
  }, [leaves]);

  const pendingLeavesCount = useMemo(() => {
    return leaves.filter((l) => l.status === "Pending").length;
  }, [leaves]);

  const totalApprovedRequests = useMemo(() => {
    return leaves.filter((l) => l.status === "Approved").length;
  }, [leaves]);

  // ================================
  // TanStack Query Mutations
  // ================================
  const { mutate: applyLeaveMutation } = usePost("/leave/apply", {
    invalidateKeys: ["employee-my-leaves"],
    onSuccess: (data) => {
      if (data && data.success) {
        showToast("Leave request submitted successfully!", "success");
        setShowForm(false);
      }
    },
    onError: (err) => {
      console.error("[Employee] Error submitting leave application:", err);
      showToast(err.response?.data?.message || "Failed to submit leave request.", "error");
    },
  });

  const { mutate: withdrawLeaveMutation } = useDelete("/leave", {
    invalidateKeys: ["employee-my-leaves"],
    onSuccess: (data) => {
      showToast("Leave request cancelled successfully.", "success");
    },
    onError: (err) => {
      console.error("[Employee] Error cancelling leave:", err);
      showToast(err.response?.data?.message || "Failed to cancel leave request.", "error");
    },
  });

  // Submit Leave (POST /api/leave/apply)
  const handleLeaveSubmit = (data) => {
    const payload = {
      leaveType: data.leaveType || "Paid Leave",
      fromDate: data.fromDate,
      toDate: data.toDate,
      reason: data.reason,
      dateBreakdown: data.dateBreakdown || [],
    };
    applyLeaveMutation(payload);
  };

  // Cancel Pending Leave (DELETE /api/leave/:id)
  const handleCancelLeave = (leaveId) => {
    if (window.confirm("Are you sure you want to cancel this pending leave request?")) {
      withdrawLeaveMutation(leaveId);
    }
  };

  // Filtered leaves
  const filteredLeaves = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return leaves.filter((leave) => {
      const matchesSearch =
        !query ||
        leave.type.toLowerCase().includes(query) ||
        leave.reason.toLowerCase().includes(query) ||
        leave.from.toLowerCase().includes(query) ||
        leave.to.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" ? true : leave.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [leaves, debouncedSearch, statusFilter]);

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Leave Management
            </h1>
            {activePolicy && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold bg-sky-50 text-sky-700 border border-sky-200/80">
                <ShieldCheck size={13} className="text-sky-600" />
                {activePolicy.name}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Track your policy-based leave quota, applications, and approvals
          </p>
        </div>

        {canApply && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-md shadow-blue-200 active:scale-95 transition-all cursor-pointer"
              title="Apply Leave"
            >
              <Plus size={18} />
              Apply Leave
            </button>
          </div>
        )}
      </div>

      {/* ================= SUMMARY STAT CARDS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* 1. Total Leave */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-sky-200 transition">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Leave</p>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <CalendarDays size={18} />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-800 mt-3">{totalAllocated}</h2>
          <p className="text-[11px] font-semibold text-slate-400 mt-1">
            {activePolicy?.paidLeavesPerMonth
              ? `${activePolicy.paidLeavesPerMonth}/mo (${totalAllocated} Days/yr)`
              : "Days allocated per year"}
          </p>
        </div>

        {/* 2. Used Leaves */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-amber-200 transition">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Used Leaves</p>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <h2 className="text-2xl font-black text-amber-600 mt-3">{approvedLeavesCount}</h2>
          <p className="text-[11px] font-semibold text-slate-400 mt-1">Days taken (Approved)</p>
        </div>

        {/* 3. Pending Leaves */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-blue-200 transition">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Leaves</p>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <AlertCircle size={18} />
            </div>
          </div>
          <h2 className="text-2xl font-black text-blue-600 mt-3">{pendingLeavesCount}</h2>
          <p className="text-[11px] font-semibold text-slate-400 mt-1">Awaiting HR review</p>
        </div>

        {/* 4. Approved */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-emerald-200 transition">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Approved</p>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle size={18} />
            </div>
          </div>
          <h2 className="text-2xl font-black text-emerald-600 mt-3">{totalApprovedRequests}</h2>
          <p className="text-[11px] font-semibold text-slate-400 mt-1">Approved requests</p>
        </div>
      </div>

      {/* ================= LEAVE REQUESTS TABLE ================= */}
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
        {/* Table Toolbar */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-800">My Leave Applications</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Live records synced directly with your HR database
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search leaves..."
                className="pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:border-sky-500 focus:outline-none w-44"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-700 outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Loading Spinner State */}
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader size={28} className="animate-spin text-sky-600" />
            <p className="text-xs font-bold">Syncing your leave records...</p>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-800">No Leave Applications Found</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                You haven't submitted any leave applications yet. Click "Apply Leave" to submit your first request.
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="mt-2 text-xs font-bold text-sky-600 hover:text-sky-700 underline cursor-pointer"
            >
              + Apply for Leave Now
            </button>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE VIEW (Screens >= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80">
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Leave Type
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      From
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      To
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Days
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Reason
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Status
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredLeaves.map((leave) => (
                    <tr key={leave.id} className="hover:bg-sky-50/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                            <CalendarDays size={16} />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800">{leave.type}</span>
                            {leave.dateBreakdown?.some((db) => db.isSandwiched) && (
                              <span className="mt-0.5 block text-[10px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 w-max">
                                Sandwich Rule
                              </span>
                            )}
                            {leave.dateBreakdown?.length > 1 && (
                              <p className="text-[10px] text-slate-400 font-medium">
                                {leave.dateBreakdown.length} date sessions
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs font-semibold text-slate-600">{leave.from}</td>
                      <td className="px-5 py-4 text-xs font-semibold text-slate-600">{leave.to}</td>
                      <td className="px-5 py-4 text-xs font-extrabold text-slate-700">
                        {leave.days} {leave.days > 1 ? "Days" : "Day"}
                      </td>

                      <td className="px-5 py-4 text-xs font-medium text-slate-500 max-w-xs truncate">
                        {leave.reason}
                        {leave.rejectionReason && (
                          <p className="text-[10px] text-rose-500 font-bold mt-0.5">
                            Note: {leave.rejectionReason}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold ${leave.status === "Approved"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200/60"
                            : leave.status === "Rejected"
                              ? "bg-rose-50 text-rose-600 border border-rose-200/60"
                              : "bg-amber-50 text-amber-600 border border-amber-200/60"
                            }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${leave.status === "Approved"
                              ? "bg-emerald-500"
                              : leave.status === "Rejected"
                                ? "bg-rose-500"
                                : "bg-amber-500 animate-pulse"
                              }`}
                          />
                          {leave.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        {leave.status === "Pending" && canCancel ? (
                          <button
                            onClick={() => handleCancelLeave(leave.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition border bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer border-rose-200/60"
                            title="Cancel pending request"
                          >
                            <Trash2 size={13} />
                            Cancel
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-300 font-medium">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARD VIEW (Phone screens < 768px) */}
            <div className="md:hidden p-3.5 space-y-3 bg-slate-50/50">
              {filteredLeaves.map((leave) => (
                <div
                  key={leave.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3"
                >
                  {/* Top Row: Leave Type + Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                        <CalendarDays size={18} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-800 truncate">
                          {leave.type}
                        </h4>
                        <span className="text-xs font-bold text-slate-500">
                          {leave.days} {leave.days > 1 ? "Days" : "Day"}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold shrink-0 ${
                        leave.status === "Approved"
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200/60"
                          : leave.status === "Rejected"
                          ? "bg-rose-50 text-rose-600 border border-rose-200/60"
                          : "bg-amber-50 text-amber-600 border border-amber-200/60"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          leave.status === "Approved"
                            ? "bg-emerald-500"
                            : leave.status === "Rejected"
                            ? "bg-rose-500"
                            : "bg-amber-500 animate-pulse"
                        }`}
                      />
                      {leave.status}
                    </span>
                  </div>

                  {/* Date Box */}
                  <div className="rounded-xl bg-slate-50/80 p-3 text-xs space-y-1.5 border border-slate-100 text-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Duration:</span>
                      <span className="font-bold text-slate-800">
                        {leave.from} → {leave.to}
                      </span>
                    </div>

                    {leave.dateBreakdown?.some((db) => db.isSandwiched) && (
                      <div className="pt-1 border-t border-slate-200/60">
                        <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                          Sandwich Rule Applied
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Reason */}
                  {leave.reason && (
                    <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="font-bold text-slate-400 text-[10px] block uppercase mb-0.5">Reason:</span>
                      <p className="line-clamp-2">{leave.reason}</p>
                    </div>
                  )}

                  {leave.rejectionReason && (
                    <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-100 font-medium">
                      <span className="font-bold text-rose-500 text-[10px] block uppercase mb-0.5">HR Remark:</span>
                      <p>{leave.rejectionReason}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {leave.status === "Pending" && canCancel && (
                    <div className="flex justify-end pt-1 border-t border-slate-100">
                      <button
                        onClick={() => handleCancelLeave(leave.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer border-rose-200/60"
                      >
                        <Trash2 size={13} />
                        Cancel Request
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ================= APPLY LEAVE MODAL ================= */}
      <LeaveFormModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleLeaveSubmit}
        isHrView={false}
      />
    </>
  );
};

export default Leave;
