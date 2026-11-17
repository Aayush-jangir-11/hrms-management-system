import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PageLoader from "./components/common/PageLoader";

// ─── Eagerly loaded (always needed immediately) ───────────────────────────────
import AppLayout from "./components/layout/AppLayout";

// ─── Public Pages (Lazy) ──────────────────────────────────────────────────────
const LandingPage = lazy(() => import("./pages/Landingpage"));
const FeaturesPage = lazy(() => import("./pages/Features"));
const AboutPage = lazy(() => import("./pages/About"));
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/auth/ResetPasswordPage"));

// ─── Admin Pages (Lazy) ───────────────────────────────────────────────────────
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const RoleAndPermission = lazy(() => import("./pages/admin/RoleAndPermission"));
const AdminReports = lazy(() => import("./pages/admin/Reports"));
const AdminCalendar = lazy(() => import("./pages/admin/Calendar"));
const AdminProfile = lazy(() => import("./pages/admin/Profile"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));

// ─── HR Pages (Lazy) ──────────────────────────────────────────────────────────
const HrDashboard = lazy(() => import("./pages/hr/Dashboard"));
const Employees = lazy(() => import("./pages/hr/Employees"));
const HrTasks = lazy(() => import("./pages/hr/Tasks"));
const HrPolicies = lazy(() => import("./pages/hr/Policies"));
const HrAttendance = lazy(() => import("./pages/hr/Attendance"));
const LeaveManagement = lazy(() => import("./pages/hr/LeaveManagement"));
const HrPayroll = lazy(() => import("./pages/hr/Payroll"));
const HrDepartments = lazy(() => import("./pages/hr/Departments"));
const HrReports = lazy(() => import("./pages/hr/Reports"));
const HrCalendar = lazy(() => import("./pages/hr/Calendar"));
const HrProfile = lazy(() => import("./pages/hr/Profile"));
const Settings = lazy(() => import("./pages/hr/Settings"));

// ─── Employee Pages (Lazy) ────────────────────────────────────────────────────
const EmpDashboard = lazy(() => import("./pages/employee/Dashboard"));
const EmpAttendance = lazy(() => import("./pages/employee/Attendance"));
const EmpLeave = lazy(() => import("./pages/employee/Leave"));
const EmpPayroll = lazy(() => import("./pages/employee/Payroll"));
const EmpCalendar = lazy(() => import("./pages/employee/Calendar"));
const EmpProfile = lazy(() => import("./pages/employee/Profile"));
const EmpSettings = lazy(() => import("./pages/employee/Settings"));

const App = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

            {/* Admin Portal Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AppLayout portalType="admin" />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="roles-permissions" element={<RoleAndPermission />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="calendar" element={<AdminCalendar />} />
              <Route path="profile" element={<AdminProfile />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* HR Portal Routes */}
            <Route
              path="/hr"
              element={
                <ProtectedRoute allowedRoles={["hr", "admin"]}>
                  <AppLayout portalType="hr" />
                </ProtectedRoute>
              }
            >
              <Route index element={<HrDashboard />} />
              <Route path="employees" element={<Employees />} />
              <Route path="tasks" element={<HrTasks />} />
              <Route path="policies" element={<HrPolicies />} />
              <Route path="attendance" element={<HrAttendance />} />
              <Route path="leave" element={<LeaveManagement />} />
              <Route path="payroll" element={<HrPayroll />} />
              <Route path="departments" element={<HrDepartments />} />
              <Route path="reports" element={<HrReports />} />
              <Route path="calendar" element={<HrCalendar />} />
              <Route path="profile" element={<HrProfile />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Employee Portal Routes */}
            <Route
              path="/employee"
              element={
                <ProtectedRoute allowedRoles={["employee", "admin", "hr"]}>
                  <AppLayout portalType="employee" />
                </ProtectedRoute>
              }
            >
              <Route index element={<EmpDashboard />} />
              <Route path="attendance" element={<EmpAttendance />} />
              <Route path="leave" element={<EmpLeave />} />
              <Route path="payroll" element={<EmpPayroll />} />
              <Route path="calendar" element={<EmpCalendar />} />
              <Route path="profile" element={<EmpProfile />} />
              <Route path="settings" element={<EmpSettings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;

