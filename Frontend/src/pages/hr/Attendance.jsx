import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  CheckCircle2,
  X,
} from "lucide-react";
import API from "../../services/api";
import { useGet, usePut } from "../../hooks/useApi";
import { useDebounce } from "../../hooks/useDebounce";
import { usePermission } from "../../hooks/usePermission";
import { useToast } from "../../hooks/useToast";
import { getArrayData } from "../../utils/helpers";

// Modular Subcomponents
import AttendanceHeader from "../../components/hr/attendance/AttendanceHeader";
import AttendanceTable from "../../components/hr/attendance/AttendanceTable";
import AttendanceMonthlyModal from "../../components/hr/attendance/AttendanceMonthlyModal";
import AttendanceActionModal from "../../components/hr/attendance/AttendanceActionModal";
import AttendanceDayDetailModal from "../../components/hr/attendance/AttendanceDayDetailModal";
import AttendanceEditModal from "../../components/hr/attendance/AttendanceEditModal";

// Helper to format record
const formatRecord = (item) => {
  const emp = item.employee || {};
  const empName = emp.name || "Employee";
  const initials = empName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Extract YYYY-MM-DD cleanly without timezone shift
  const rawDateStr =
    typeof item.date === "string"
      ? item.date.split("T")[0]
      : new Date(item.date).toISOString().split("T")[0];

  const [y, m, dayNum] = rawDateStr.split("-").map((n) => parseInt(n, 10));
  const utcDateObj = new Date(Date.UTC(y, m - 1, dayNum, 0, 0, 0, 0));

  const dateStr = utcDateObj.toLocaleDateString("en-GB", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const rawCheckIn = item.checkIn ? new Date(item.checkIn) : null;
  const rawCheckOut = item.checkOut ? new Date(item.checkOut) : null;

  return {
    id: item._id,
    employeeId: emp.employeeId || "EMP",
    employeeMongoId: emp._id || item.employee,
    employeeName: empName,
    department: emp.department || "General",
    position: emp.position || "Staff",
    email: emp.email || "",
    initials: initials || "EM",
    rawDate: rawDateStr,
    date: dateStr,
    checkIn: rawCheckIn
      ? rawCheckIn.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : null,
    checkOut: rawCheckOut
      ? rawCheckOut.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : null,
    rawCheckInTime: rawCheckIn
      ? `${String(rawCheckIn.getHours()).padStart(2, "0")}:${String(
          rawCheckIn.getMinutes()
        ).padStart(2, "0")}`
      : "",
    rawCheckOutTime: rawCheckOut
      ? `${String(rawCheckOut.getHours()).padStart(2, "0")}:${String(
          rawCheckOut.getMinutes()
        ).padStart(2, "0")}`
      : "",
    workingHours:
      item.totalHours > 0
        ? `${Math.floor(item.totalHours)}h ${Math.round(
            (item.totalHours % 1) * 60
          )}m`
        : null,
    status: item.status || "Present",
    remark: item.remark || "",
  };
};

const monthNames = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const yearOptions = [2024, 2025, 2026, 2027];

const Attendance = () => {
  const { can } = usePermission("attendance");
  const { showToast } = useToast();
  const canStatusAction = can("approve") || can("edit");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDept, setFilterDept] = useState("All");

  // Modals state
  const [showActionModal, setShowActionModal] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Monthly Full Record Modal state
  const [showMonthlyModal, setShowMonthlyModal] = useState(false);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [monthlyData, setMonthlyData] = useState(null);
  const [selectedEmployeeForMonthly, setSelectedEmployeeForMonthly] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTabInModal, setActiveTabInModal] = useState("daily"); // "daily" | "logs"

  // Edit form state
  const [editForm, setEditForm] = useState({
    status: "Present",
    checkIn: "",
    checkOut: "",
    remark: "",
  });

  /* ── TanStack Query: Fetch Attendance Records ── */
  const { data: rawAttendanceData, isLoading: loading, refetch } = useGet(
    "/attendance/all",
    ["attendanceRecords", filterDate],
    { date: filterDate }
  );

  const attendanceRecords = useMemo(() => {
    const records = getArrayData(rawAttendanceData, "attendance");
    return records.map(formatRecord);
  }, [rawAttendanceData]);

  const departments = useMemo(() => {
    const depts = new Set(["All"]);
    attendanceRecords.forEach((r) => {
      if (r.department && r.department !== "General") {
        depts.add(r.department);
      }
    });
    return Array.from(depts);
  }, [attendanceRecords]);

  // Fetch Monthly Full Summary & Punch Logs from Backend API
  const fetchMonthlySummary = useCallback(async (empId, month, year) => {
    if (!empId) return;
    setMonthlyLoading(true);
    try {
      const { data } = await API.get(`/attendance/monthly-summary/${empId}`, {
        params: { month, year },
      });

      if (data.success && data.data) {
        setMonthlyData(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch monthly summary:", error);
      showToast("Failed to fetch monthly attendance record", "error");
    } finally {
      setMonthlyLoading(false);
    }
  }, []);

  // Open Monthly Full Record Modal for an Employee
  const handleOpenMonthlyModal = (record) => {
    const empId = record.employeeMongoId || record.id || record.employeeId;
    const now = new Date();
    const currentM = now.getMonth() + 1;
    const currentY = now.getFullYear();

    setSelectedEmployeeForMonthly(record);
    setSelectedMonth(currentM);
    setSelectedYear(currentY);
    setActiveTabInModal("daily");
    setShowActionModal(null);
    setShowMonthlyModal(true);

    fetchMonthlySummary(empId, currentM, currentY);
  };

  // Handle Month change inside modal
  const handleMonthChangeInModal = (newMonth) => {
    setSelectedMonth(newMonth);
    const empId =
      selectedEmployeeForMonthly?.employeeMongoId ||
      selectedEmployeeForMonthly?.id ||
      selectedEmployeeForMonthly?.employeeId;
    fetchMonthlySummary(empId, newMonth, selectedYear);
  };

  // Handle Year change inside modal
  const handleYearChangeInModal = (newYear) => {
    setSelectedYear(newYear);
    const empId =
      selectedEmployeeForMonthly?.employeeMongoId ||
      selectedEmployeeForMonthly?.id ||
      selectedEmployeeForMonthly?.employeeId;
    fetchMonthlySummary(empId, selectedMonth, newYear);
  };

  // ── TanStack Query Mutations ──
  const updateAttendanceMutation = usePut("/attendance", {
    invalidateKeys: [["attendanceRecords"]],
  });

  const actionLoading = updateAttendanceMutation.isPending;

  // Quick Status Update
  const handleQuickStatus = async (recordTarget, newStatus) => {
    const record = typeof recordTarget === "object" ? recordTarget : showActionModal;
    const recordId = record?.id || recordTarget;

    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    const payload = {
      status: newStatus,
      remark: `Marked ${newStatus} by HR`,
      date: record?.rawDate || todayStr,
      employeeId: record?.employeeMongoId || record?.employeeId,
    };

    if (newStatus === "Present") {
      payload.checkIn = new Date();
    } else if (newStatus === "Absent") {
      payload.checkIn = null;
      payload.checkOut = null;
    }

    try {
      await updateAttendanceMutation.mutateAsync({
        id: recordId,
        data: payload,
      });
      showToast(`Status updated to ${newStatus}`, "success");
      setShowActionModal(null);
    } catch (error) {
      console.error("Attendance update error:", error);
      showToast(error.response?.data?.message || `Failed to update status to ${newStatus}`, "error");
    }
  };

  // Open Detail Modal
  const handleView = (record) => {
    setSelectedRecord(record);
    setShowActionModal(null);
    setShowDetailModal(true);
  };

  // Open Edit Modal
  const handleEdit = (record) => {
    setSelectedRecord(record);
    setEditForm({
      status: record.status || "Present",
      checkIn: record.rawCheckInTime || "",
      checkOut: record.rawCheckOutTime || "",
      remark: record.remark || "",
    });
    setShowActionModal(null);
    setShowEditModal(true);
  };

  // Submit Edit Form
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedRecord) return;

    const dNow = new Date();
    const todayStr =
      selectedRecord.rawDate ||
      `${dNow.getFullYear()}-${String(dNow.getMonth() + 1).padStart(2, "0")}-${String(dNow.getDate()).padStart(2, "0")}`;
    const [y, mon, dNum] = todayStr.split("-").map((n) => parseInt(n, 10));

    const payload = {
      status: editForm.status,
      remark: editForm.remark,
      date: todayStr,
      employeeId: selectedRecord.employeeMongoId || selectedRecord.employeeId,
    };

    if (editForm.checkIn && editForm.checkOut && editForm.checkOut <= editForm.checkIn) {
      showToast("Check-out time must be after check-in time", "error");
      return;
    }

    if (editForm.checkIn) {
      const [h, m] = editForm.checkIn.split(":");
      payload.checkIn = new Date(Date.UTC(y, mon - 1, dNum, parseInt(h, 10), parseInt(m, 10), 0, 0));
    }

    if (editForm.checkOut) {
      const [h, m] = editForm.checkOut.split(":");
      payload.checkOut = new Date(Date.UTC(y, mon - 1, dNum, parseInt(h, 10), parseInt(m, 10), 0, 0));
    }

    try {
      await updateAttendanceMutation.mutateAsync({
        id: selectedRecord.id,
        data: payload,
      });
      showToast("Attendance record updated successfully", "success");
      setShowEditModal(false);
      setShowActionModal(null);
    } catch (error) {
      console.error("Attendance update error:", error);
      showToast(error.response?.data?.message || "Failed to update record", "error");
    }
  };

  // Dynamic KPI Stats calculated from loaded database records
  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    const total = attendanceRecords.length;

    for (let i = 0; i < total; i++) {
      const status = attendanceRecords[i].status;
      if (status === "Present") present++;
      else if (status === "Absent") absent++;
      else if (status === "Late") late++;
    }

    return [
      {
        title: "Total Records Filtered",
        value: total.toString(),
        icon: Users,
        trend: "Today's logs",
        period: "current filter",
        color: "blue",
      },
      {
        title: "Present Employees",
        value: present.toString(),
        icon: CheckCircle,
        trend: `${total > 0 ? Math.round((present / total) * 100) : 0}%`,
        period: "attendance rate",
        color: "green",
      },
      {
        title: "Absent Employees",
        value: absent.toString(),
        icon: AlertCircle,
        trend: `${total > 0 ? Math.round((absent / total) * 100) : 0}%`,
        period: "absence rate",
        color: "red",
      },
      {
        title: "Late Arrivals",
        value: late.toString(),
        icon: Clock,
        trend: "Requires Review",
        period: "shift grace window",
        color: "amber",
      },
    ];
  }, [attendanceRecords]);

  // Filtering records
  const filteredRecords = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return attendanceRecords.filter((r) => {
      const matchSearch =
        !query ||
        r.employeeName.toLowerCase().includes(query) ||
        r.employeeId.toLowerCase().includes(query) ||
        r.email.toLowerCase().includes(query);

      const matchDept = filterDept === "All" || r.department === filterDept;
      const matchStatus = filterStatus === "All" || r.status === filterStatus;
      const matchDate = !filterDate || r.rawDate === filterDate;

      return matchSearch && matchDept && matchStatus && matchDate;
    });
  }, [attendanceRecords, debouncedSearch, filterDept, filterStatus, filterDate]);

  // Pagination State & Logic
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterDept, filterStatus, filterDate]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRecords, currentPage, itemsPerPage]);

  return (
    <div className="space-y-6 selection:bg-sky-500 selection:text-white pb-10">
      {/* Header: Hero Banner, KPI Stats Grid, and Filters Toolbar */}
      <AttendanceHeader
        onRefresh={() => refetch()}
        loading={loading}
        stats={stats}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterDate={filterDate}
        onDateChange={setFilterDate}
        onClearDate={() => setFilterDate("")}
        filterDept={filterDept}
        onDeptChange={setFilterDept}
        departments={departments}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
      />

      {/* Main Records Table with Pagination */}
      <AttendanceTable
        records={paginatedRecords}
        loading={loading}
        filteredCount={filteredRecords.length}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(val) => {
          setItemsPerPage(val);
          setCurrentPage(1);
        }}
        onOpenMonthlyModal={handleOpenMonthlyModal}
        onOpenActionModal={setShowActionModal}
      />

      {/* Monthly Full Record Modal */}
      <AttendanceMonthlyModal
        isOpen={showMonthlyModal}
        onClose={() => setShowMonthlyModal(false)}
        employee={selectedEmployeeForMonthly}
        monthlyData={monthlyData}
        loading={monthlyLoading}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={handleMonthChangeInModal}
        onYearChange={handleYearChangeInModal}
        activeTab={activeTabInModal}
        onTabChange={setActiveTabInModal}
        monthNames={monthNames}
        yearOptions={yearOptions}
      />

      {/* Action Popover Modal */}
      <AttendanceActionModal
        record={showActionModal}
        onClose={() => setShowActionModal(null)}
        onOpenMonthly={handleOpenMonthlyModal}
        onView={handleView}
        onEdit={handleEdit}
        onQuickStatus={handleQuickStatus}
        canEdit={can("edit")}
        canStatusAction={canStatusAction}
        actionLoading={actionLoading}
      />

      {/* Single Day Detail Modal */}
      <AttendanceDayDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        record={selectedRecord}
        onEdit={handleEdit}
      />

      {/* Edit Record Modal */}
      <AttendanceEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        record={selectedRecord}
        editForm={editForm}
        setEditForm={setEditForm}
        onSubmit={handleSaveEdit}
        loading={actionLoading}
      />
    </div>
  );
};

export default Attendance;
