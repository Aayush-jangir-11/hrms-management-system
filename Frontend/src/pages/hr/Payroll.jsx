import React, { useMemo, useState, useCallback } from "react";
import {
  WalletCards,
  CreditCard,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import API from "../../services/api";
import { useGet, usePost, usePut, useDelete } from "../../hooks/useApi";
import { useDebounce } from "../../hooks/useDebounce";
import { usePermission } from "../../hooks/usePermission";
import MonthYearPicker from "../../components/common/MonthYearPicker";

// Subcomponents & Helpers
import PayslipModal, {
  MONTHS,
  currentYear,
  currentMonthName,
  getRowData,
} from "../../components/hr/payroll/PayslipModal";
import SalarySetupTab from "../../components/hr/payroll/SalarySetupTab";
import PayrollStatsGrid from "../../components/hr/payroll/PayrollStatsGrid";
import PayrollTableToolbar from "../../components/hr/payroll/PayrollTableToolbar";
import PayrollTable from "../../components/hr/payroll/PayrollTable";
import GeneratePayrollModal from "../../components/hr/payroll/GeneratePayrollModal";
import PayrollDetailModal from "../../components/hr/payroll/PayrollDetailModal";
import AttendanceReportModal from "../../components/hr/payroll/AttendanceReportModal";
import { useToast } from "../../hooks/useToast";

const Payroll = () => {
  const { can, isAdmin } = usePermission("payroll");
  const { showToast } = useToast();
  /* ── Filter States ── */
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 350);
  const [filterDept, setFilterDept] = useState("All Departments");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [filterMonth, setFilterMonth] = useState(currentMonthName);
  const [filterYear, setFilterYear] = useState(String(currentYear));

  /* ── Active Tab ── */
  const [activeTab, setActiveTab] = useState("records"); // "records" | "salaries"

  /* ── Excel Grid Editing States ── */
  const [gridEdits, setGridEdits] = useState({});
  const [dirtyRowIds, setDirtyRowIds] = useState(new Set());
  const [savingGridId, setSavingGridId] = useState(null);
  const [savingAllGrid, setSavingAllGrid] = useState(false);

  /* ── Employee Salary Setup States ── */
  const [editingSalaryId, setEditingSalaryId] = useState(null);
  const [editSalaryValue, setEditSalaryValue] = useState("");

  /* ── Modals State ── */
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showAction, setShowAction] = useState(null);
  const [showPayslipModal, setShowPayslipModal] = useState(null);

  /* ── Comprehensive Attendance & LOP Report Modal ── */
  const [showReportModal, setShowReportModal] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportEmpInfo, setReportEmpInfo] = useState({ name: "", id: "" });
  const [reportMonth, setReportMonth] = useState(currentMonthName);
  const [reportYear, setReportYear] = useState(String(currentYear));

  /* ── Generate Payroll Form State ── */
  const [genMonth, setGenMonth] = useState(currentMonthName);
  const [genYear, setGenYear] = useState(String(currentYear));
  const [genBonus, setGenBonus] = useState("0");
  const [genRemarks, setGenRemarks] = useState("");

  /* ── TanStack Query 1: Fetch departments ── */
  const { data: rawDepartments } = useGet("/hr/departments", ["hr-departments"]);
  const departmentsList = useMemo(() => {
    if (rawDepartments && rawDepartments.success && Array.isArray(rawDepartments.data)) {
      return rawDepartments.data.map((d) => d.name || d.departmentName || d).filter(Boolean);
    }
    return [];
  }, [rawDepartments]);

  /* ── TanStack Query 2: Fetch payroll records ── */
  const payrollParams = useMemo(() => {
    const params = { month: filterMonth, year: filterYear };
    if (filterStatus && filterStatus !== "All Status") params.status = filterStatus;
    if (filterDept && filterDept !== "All Departments") params.department = filterDept;
    if (debouncedSearch && debouncedSearch.trim()) params.search = debouncedSearch.trim();
    return params;
  }, [filterMonth, filterYear, filterStatus, filterDept, debouncedSearch]);

  const { data: payrollsRes, isLoading: loading } = useGet(
    "/payroll",
    ["payrolls", filterMonth, filterYear, filterStatus, filterDept, debouncedSearch],
    payrollParams
  );
  const payrolls = payrollsRes?.data || [];

  /* ── TanStack Query 3: Fetch employee base salaries ── */
  const { data: employeeSalariesRes, isLoading: loadingSalaries } = useGet(
    "/payroll/employee-salaries",
    ["employeeSalaries"],
    {},
    { enabled: activeTab === "salaries" }
  );
  const employeeSalaries = employeeSalariesRes?.data || [];

  /* ── TanStack Mutation: Save single employee CTC ── */
  const saveSalaryMutation = usePut("/payroll/employee-salaries", {
    invalidateKeys: [["employeeSalaries"]],
    onSuccess: (data) => {
      showToast(data?.message || "Annual CTC updated successfully", "success");
      setEditingSalaryId(null);
    },
    onError: (err) => {
      showToast(err.response?.data?.message || "Failed to update CTC", "error");
    },
  });

  const savingSalaryId = saveSalaryMutation.isPending ? saveSalaryMutation.variables?.id : null;

  const handleSaveSalary = (empId, newCtcValue) => {
    const ctcNumber = Number(newCtcValue);
    if (!newCtcValue || isNaN(ctcNumber) || ctcNumber <= 0) {
      showToast("Please enter a valid positive salary amount (CTC)", "warning");
      return;
    }
    const monthlySalaryCalculated = Math.round(ctcNumber / 12);
    saveSalaryMutation.mutate({
      id: empId,
      data: { salary: monthlySalaryCalculated },
    });
  };

  /* ── View Comprehensive Attendance & LOP Report ── */
  const handleViewComprehensiveReport = async (employeeId, employeeName, targetMonth, targetYear) => {
    try {
      if (!employeeId) {
        showToast("Employee ID is missing", "error");
        return;
      }
      const selMonth = targetMonth || reportMonth || filterMonth;
      const selYear = String(targetYear || reportYear || filterYear);

      setReportEmpInfo({ name: employeeName || "Employee", id: employeeId });
      setReportMonth(selMonth);
      setReportYear(selYear);
      setShowReportModal(true);
      setLoadingReport(true);
      setReportData(null);

      let monthIdx = MONTHS.indexOf(selMonth);
      if (monthIdx === -1) {
        monthIdx = MONTHS.findIndex((m) => m.toLowerCase() === String(selMonth).toLowerCase());
      }
      const m = monthIdx !== -1 ? monthIdx : new Date().getMonth();
      const y = Number(selYear) || new Date().getFullYear();

      const startDate = `${y}-${String(m + 1).padStart(2, "0")}-01`;
      const lastDay = new Date(y, m + 1, 0).getDate();
      const endDate = `${y}-${String(m + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

      const { data } = await API.get("/reports/comprehensive", {
        params: {
          employeeId,
          startDate,
          endDate,
        },
      });

      if (data) {
        setReportData(data);
      }
    } catch (err) {
      console.error("[Payroll] Comprehensive report error:", err);
      showToast(err.response?.data?.message || "Failed to load attendance report", "error");
    } finally {
      setLoadingReport(false);
    }
  };

  /* ── TanStack Mutation: Generate Payroll ── */
  const generatePayrollMutation = usePost("/payroll/generate", {
    invalidateKeys: [["payrolls"]],
    onSuccess: (data) => {
      if (data && data.success) {
        showToast(data.message || `Payroll generated for ${genMonth} ${genYear}`, "success");
        setShowGenerateModal(false);
        setFilterMonth(genMonth);
        setFilterYear(genYear);
      }
    },
    onError: (err) => {
      showToast(err.response?.data?.message || "Failed to generate payroll", "error");
    },
  });

  const generating = generatePayrollMutation.isPending;

  const handleGenerate = () => {
    generatePayrollMutation.mutate({
      month: genMonth,
      year: Number(genYear),
      bonus: Number(genBonus) || 0,
      remarks: genRemarks,
    });
  };

  /* ── TanStack Mutation: Update Payroll Status ── */
  const updatePayrollStatusMutation = usePut("/payroll", {
    invalidateKeys: [["payrolls"]],
    onSuccess: (data, variables) => {
      if (data && data.success) {
        if (selectedRecord && selectedRecord._id === variables.id?.split("/")?.[0]) {
          setSelectedRecord((prev) => ({ ...prev, status: variables.data?.status }));
        }
        showToast(`Status updated to ${variables.data?.status}`, "success");
      }
    },
    onError: (err) => {
      showToast(err.response?.data?.message || "Failed to update status", "error");
    },
    onSettled: () => {
      setShowAction(null);
    },
  });

  const statusUpdatingId = updatePayrollStatusMutation.isPending
    ? updatePayrollStatusMutation.variables?.id?.split("/")?.[0]
    : null;

  const handleStatusChange = (recordId, newStatus) => {
    updatePayrollStatusMutation.mutate({ id: `${recordId}/status`, data: { status: newStatus } });
  };

  /* ── TanStack Mutation: Delete Payroll Record ── */
  const deletePayrollMutation = useDelete("/payroll", {
    invalidateKeys: [["payrolls"]],
    onSuccess: (data, recordId) => {
      if (data && data.success) {
        if (selectedRecord && selectedRecord._id === recordId) {
          setSelectedRecord(null);
        }
        showToast("Payroll record deleted", "delete");
      }
    },
    onError: (err) => {
      showToast(err.response?.data?.message || "Failed to delete payroll record", "error");
    },
    onSettled: () => {
      setShowAction(null);
    },
  });

  const handleDelete = (recordId) => {
    if (!isAdmin && !can("delete")) {
      showToast("Permission Denied: Delete record not allowed", "error");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this payroll record?")) return;
    deletePayrollMutation.mutate(recordId);
  };

  /* ── TanStack Mutation: Row Grid Edit ── */
  const updatePayrollRecordMutation = usePut("/payroll", {
    invalidateKeys: [["payrolls"]],
  });

  /* ── Print Payslip ── */
  const handlePrint = () => {
    window.print();
  };

  /* ── Excel Grid Handlers ── */
  const handleGridCellChange = (recordId, field, val) => {
    const numVal = Math.max(0, Number(val) || 0);
    setGridEdits((prev) => {
      const record = payrolls.find((p) => p._id === recordId);
      const e = record?.earnings || {};
      const d = record?.deductions || {};
      const current = prev[recordId] || {
        basicSalary: e.basicSalary || 0,
        hra: e.hra || 0,
        specialAllowance: e.specialAllowance || 0,
        overtimePay: e.overtimePay || 0,
        bonus: e.bonus || 0,
        providentFund: d.providentFund || 0,
        professionalTax: d.professionalTax || 0,
        lwp: d.lwp || 0,
        tds: d.tds || 0,
        otherDeductions: d.otherDeductions || 0,
      };
      return {
        ...prev,
        [recordId]: {
          ...current,
          [field]: numVal,
        },
      };
    });
    setDirtyRowIds((prev) => new Set(prev).add(recordId));
  };

  const handleAutoCalculateRow = (record) => {
    const empSalary = record.employee?.salary || 0;
    const currentE = getRowData(record, gridEdits);
    const monthlyGross =
      empSalary > 0 ? empSalary : currentE.basicSalary > 0 ? currentE.basicSalary * 2 : 50000;
    const basicSalary = Math.round(monthlyGross * 0.5);
    const hra = Math.round(monthlyGross * 0.2);
    const specialAllowance = Math.max(0, monthlyGross - (basicSalary + hra));
    const providentFund = Math.min(Math.round(basicSalary * 0.12), 1800);
    const professionalTax = monthlyGross >= 15000 ? 200 : 0;

    setGridEdits((prev) => ({
      ...prev,
      [record._id]: {
        ...(prev[record._id] || {}),
        basicSalary,
        hra,
        specialAllowance,
        providentFund,
        professionalTax,
      },
    }));
    setDirtyRowIds((prev) => new Set(prev).add(record._id));
  };

  const handleAutoCalculateAll = () => {
    if (!can("process")) {
      showToast("Permission Denied: Auto-calculate payroll not allowed", "error");
      return;
    }
    if (!payrolls || payrolls.length === 0) return;
    payrolls.forEach((rec) => handleAutoCalculateRow(rec));
    showToast(
      `Calculated formula (Basic 50%, HRA 20%, PF 12%) for ${payrolls.length} row(s)`,
      "info"
    );
  };

  const handleSaveGridRow = async (recordId) => {
    if (!can("process")) {
      showToast("Permission Denied: Save payroll row not allowed", "error");
      return;
    }
    try {
      setSavingGridId(recordId);
      const rowPayload = gridEdits[recordId];
      if (!rowPayload) {
        showToast("No changes to save for this row", "info");
        return;
      }

      const data = await updatePayrollRecordMutation.mutateAsync({
        id: recordId,
        data: rowPayload,
      });
      if (data && data.success) {
        showToast("Payroll record updated successfully", "success");
        setDirtyRowIds((prev) => {
          const next = new Set(prev);
          next.delete(recordId);
          return next;
        });
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update payroll", "error");
    } finally {
      setSavingGridId(null);
    }
  };

  const handleSaveAllGrid = async () => {
    const dirtyIds = Array.from(dirtyRowIds);
    if (dirtyIds.length === 0) {
      showToast("No unsaved changes in payroll table", "info");
      return;
    }
    try {
      setSavingAllGrid(true);
      let successCount = 0;

      for (const id of dirtyIds) {
        const rowPayload = gridEdits[id];
        if (rowPayload) {
          const data = await updatePayrollRecordMutation.mutateAsync({ id, data: rowPayload });
          if (data && data.success) {
            successCount++;
          }
        }
      }
      setDirtyRowIds(new Set());
      showToast(`Successfully saved ${successCount} updated payroll record(s)`, "success");
    } catch {
      showToast("Failed to save some table rows", "error");
    } finally {
      setSavingAllGrid(false);
    }
  };

  const handleExportCSV = () => {
    if (!can("download")) {
      showToast("Permission Denied: Download payslips/reports not allowed", "error");
      return;
    }
    if (!payrolls || payrolls.length === 0) {
      showToast("No payroll data available to export", "error");
      return;
    }

    const headers = [
      "Employee ID",
      "Employee Name",
      "Department",
      "Month",
      "Year",
      "Basic Salary",
      "HRA",
      "Special Allowance",
      "Overtime Pay",
      "Bonus",
      "Total Earnings",
      "Provident Fund (PF)",
      "Professional Tax (PT)",
      "Loss of Pay (LWP)",
      "TDS",
      "Other Deductions",
      "Total Deductions",
      "Net Salary",
      "Status",
    ];

    const csvRows = payrolls.map((record) => {
      const row = getRowData(record, gridEdits);
      const emp = record.employee || {};
      return [
        `"${emp.employeeId || ""}"`,
        `"${emp.name || ""}"`,
        `"${emp.department || ""}"`,
        `"${record.month || ""}"`,
        `"${record.year || ""}"`,
        row.basicSalary,
        row.hra,
        row.specialAllowance,
        row.overtimePay,
        row.bonus,
        row.totalEarnings,
        row.providentFund,
        row.professionalTax,
        row.lwp,
        row.tds,
        row.otherDeductions,
        row.totalDeductions,
        row.netSalary,
        `"${record.status || "Pending"}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...csvRows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Payroll_${filterMonth}_${filterYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${payrolls.length} records to CSV`, "success");
  };

  /* ── Derived Stats (Memoized) ── */
  const { totalNetSalary, paidPayrolls, pendingPayrolls, totalPaid, totalPending } = useMemo(() => {
    let net = 0;
    let paidSum = 0;
    let pendingSum = 0;
    const paidList = [];
    const pendingList = [];

    for (let i = 0; i < payrolls.length; i++) {
      const p = payrolls[i];
      const salary = p.netSalary || 0;
      net += salary;
      if (p.status === "Paid") {
        paidList.push(p);
        paidSum += salary;
      } else {
        pendingList.push(p);
        pendingSum += salary;
      }
    }

    return {
      totalNetSalary: net,
      paidPayrolls: paidList,
      pendingPayrolls: pendingList,
      totalPaid: paidSum,
      totalPending: pendingSum,
    };
  }, [payrolls]);

  /* ── Filtered Salaries List (Memoized) ── */
  const filteredEmployeeSalaries = useMemo(() => {
    if (!debouncedSearch.trim()) return employeeSalaries;
    const query = debouncedSearch.toLowerCase();
    return employeeSalaries.filter(
      (emp) =>
        emp.name?.toLowerCase().includes(query) ||
        emp.employeeId?.toLowerCase().includes(query) ||
        emp.department?.toLowerCase().includes(query)
    );
  }, [employeeSalaries, debouncedSearch]);

  /* ── Filtered Departments List for Select ── */
  const departments = useMemo(() => {
    const payrollDepts = payrolls.map((p) => p.employee?.department).filter(Boolean);
    const combined = Array.from(new Set([...departmentsList, ...payrollDepts]));
    return combined;
  }, [departmentsList, payrolls]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Payroll Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Configure employee base salaries, generate monthly payroll and process payslips
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Tab Navigation */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setActiveTab("records")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer ${activeTab === "records"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
                }`}
            >
              <WalletCards size={15} />
              Payroll Slips
            </button>
            <button
              onClick={() => setActiveTab("salaries")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer ${activeTab === "salaries"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
                }`}
            >
              <CreditCard size={15} />
              Salary Setup
            </button>
          </div>

          {/* Month / Year Calendar Picker */}
          {activeTab === "records" && (
            <MonthYearPicker
              selectedMonth={filterMonth}
              selectedYear={filterYear}
              onSelect={(m, y) => {
                setFilterMonth(m);
                setFilterYear(y);
              }}
            />
          )}
        </div>
      </div>

      {activeTab === "salaries" ? (
        <SalarySetupTab
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onOpenGenerateModal={() => setShowGenerateModal(true)}
          loadingSalaries={loadingSalaries}
          filteredEmployeeSalaries={filteredEmployeeSalaries}
          totalEmployeesCount={employeeSalaries.length}
          editingSalaryId={editingSalaryId}
          setEditingSalaryId={setEditingSalaryId}
          editSalaryValue={editSalaryValue}
          setEditSalaryValue={setEditSalaryValue}
          savingSalaryId={savingSalaryId}
          onSaveSalary={handleSaveSalary}
          onViewReport={handleViewComprehensiveReport}
          can={can}
        />
      ) : (
        <>
          {/* Stats Cards */}
          <PayrollStatsGrid
            totalNetSalary={totalNetSalary}
            payrollsCount={payrolls.length}
            totalPaid={totalPaid}
            paidCount={paidPayrolls.length}
            totalPending={totalPending}
            pendingCount={pendingPayrolls.length}
          />

          {/* Filters Toolbar */}
          <PayrollTableToolbar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            departments={departments}
            filterDept={filterDept}
            setFilterDept={setFilterDept}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            onOpenGenerateModal={() => setShowGenerateModal(true)}
            onAutoCalculateAll={handleAutoCalculateAll}
            onExportCSV={handleExportCSV}
            onSaveAllGrid={handleSaveAllGrid}
            savingAllGrid={savingAllGrid}
            dirtyRowCount={dirtyRowIds.size}
            can={can}
          />

          {/* Payroll Table */}
          <PayrollTable
            payrolls={payrolls}
            loading={loading}
            filterMonth={filterMonth}
            filterYear={filterYear}
            gridEdits={gridEdits}
            dirtyRowIds={dirtyRowIds}
            savingGridId={savingGridId}
            statusUpdatingId={statusUpdatingId}
            showAction={showAction}
            setShowAction={setShowAction}
            onGridCellChange={handleGridCellChange}
            onSaveGridRow={handleSaveGridRow}
            onStatusChange={handleStatusChange}
            onDeleteRecord={handleDelete}
            onSelectRecord={setSelectedRecord}
            onSelectPayslipRecord={setShowPayslipModal}
            onViewReport={handleViewComprehensiveReport}
            can={can}
            isAdmin={isAdmin}
          />
        </>
      )}

      {/* ── Generate Payroll Modal ── */}
      <GeneratePayrollModal
        show={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        genMonth={genMonth}
        setGenMonth={setGenMonth}
        genYear={genYear}
        setGenYear={setGenYear}
        genBonus={genBonus}
        setGenBonus={setGenBonus}
        genRemarks={genRemarks}
        setGenRemarks={setGenRemarks}
        onGenerate={handleGenerate}
        generating={generating}
      />

      {/* ── View Payroll Detail Modal ── */}
      <PayrollDetailModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
        onOpenPayslip={(record) => setShowPayslipModal(record)}
      />

      {/* ── Payslip Print / View Modal ── */}
      <PayslipModal
        record={showPayslipModal}
        onClose={() => setShowPayslipModal(null)}
        onPrint={handlePrint}
      />

      {/* ── Comprehensive Monthly Attendance & LOP Report Modal ── */}
      <AttendanceReportModal
        show={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportEmpInfo={reportEmpInfo}
        reportMonth={reportMonth}
        reportYear={reportYear}
        setReportMonth={setReportMonth}
        setReportYear={setReportYear}
        loadingReport={loadingReport}
        reportData={reportData}
        onRefreshReport={handleViewComprehensiveReport}
      />
    </div>
  );
};

export default Payroll;
