import { Link, useLocation } from "react-router-dom";
import {
  CalendarDays,
  Clock,
  LayoutDashboard,
  LogOut,
  Users,
  Wallet,
  Building2,
  BarChart3,
  Settings,
  BriefcaseBusiness,
  ShieldCheck,
  CheckSquare,
  User,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const HR_ICON_MAP = {
  dashboard: LayoutDashboard,
  employees: Users,
  tasks: CheckSquare,
  policies: ShieldCheck,
  attendance: Clock,
  leave: CalendarDays,
  payroll: Wallet,
  departments: Building2,
  reports: BarChart3,
  calendar: CalendarDays,
  profile: User,
};

export const hrMenuItems = [
  { module: "dashboard", icon: LayoutDashboard, name: "Dashboard", to: "/hr" },
  { module: "employees", icon: Users, name: "Employees", to: "/hr/employees" },
  { module: "tasks", icon: CheckSquare, name: "Tasks", to: "/hr/tasks" },
  { module: "policies", icon: ShieldCheck, name: "Work Policies", to: "/hr/policies" },
  { module: "attendance", icon: Clock, name: "Attendance", to: "/hr/attendance" },
  { module: "leave", icon: CalendarDays, name: "Leave Management", to: "/hr/leave" },
  { module: "payroll", icon: Wallet, name: "Payroll", to: "/hr/payroll" },
  { module: "departments", icon: Building2, name: "Departments", to: "/hr/departments" },
  { module: "reports", icon: BarChart3, name: "Reports", to: "/hr/reports" },
  { module: "calendar", icon: CalendarDays, name: "Calendar", to: "/hr/calendar" },
  { module: "profile", icon: User, name: "Profile", to: "/hr/profile" },
];

const HrSidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { logout, user } = useAuth();
  const location = useLocation();

  // Use pre-filtered backend sidebarMenu if available, otherwise fallback to hrMenuItems
  const rawMenuItems =
    user?.sidebarMenu && Array.isArray(user.sidebarMenu) && user.sidebarMenu.length > 0
      ? user.sidebarMenu
      : hrMenuItems;

  // Ensure Profile is present in menu items even if session was established before this update
  const menuItems = rawMenuItems.some(
    (item) => item.module === "profile" || item.to === "/hr/profile"
  )
    ? rawMenuItems
    : [...rawMenuItems, { module: "profile", icon: User, name: "Profile", to: "/hr/profile" }];

  const closeSidebar = () => {
    if (setSidebarOpen) setSidebarOpen(false);
  };

  const itemClasses = (isActive) => `
    group flex w-full items-center gap-3 rounded-xl px-4 py-3
    text-sm font-medium transition-all duration-200
    ${isActive
      ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-blue-200"
      : "text-slate-600 hover:bg-sky-50 hover:text-sky-600"
    }
  `;

  const iconClasses = (isActive) =>
    isActive ? "text-white" : "text-slate-400 group-hover:text-sky-500";

  return (
    <aside
      className={`
        fixed left-0 top-0 z-50 h-screen w-72
        bg-white border-r border-slate-200
        transition-transform duration-300
        flex flex-col justify-between
        lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      {/* Top Section: Logo & Navigation */}
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Logo */}
        <div className="flex h-20 items-center justify-between border-b border-slate-200 px-6 shrink-0">
          <Link to="/hr" onClick={closeSidebar} className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-blue-200">
              <BriefcaseBusiness size={23} />
            </div>

            <div>
              <h1 className="text-lg font-bold text-slate-800">HRMS</h1>
              <p className="text-xs text-slate-400">HR Portal</p>
            </div>
          </Link>

          {setSidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-2 hover:bg-slate-100 lg:hidden cursor-pointer"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="px-4 py-6">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Main Menu
          </p>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = HR_ICON_MAP[item.module] || item.icon || LayoutDashboard;
              const isActive =
                item.to === "/hr"
                  ? location.pathname === "/hr"
                  : location.pathname.startsWith(item.to);

              return (
                <Link
                  key={item.name}
                  to={item.to}
                  onClick={closeSidebar}
                  className={itemClasses(isActive)}
                >
                  <Icon size={19} className={iconClasses(isActive)} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Section: Account */}
      <div className="p-4 border-t border-slate-100 shrink-0">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Account
        </p>

        <Link
          to="/hr/settings"
          onClick={closeSidebar}
          className={itemClasses(location.pathname === "/hr/settings")}
        >
          <Settings
            size={19}
            className={iconClasses(location.pathname === "/hr/settings")}
          />
          <span>Settings</span>
        </Link>

        <button
          onClick={logout}
          className="group mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition cursor-pointer"
        >
          <LogOut size={19} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default HrSidebar;
