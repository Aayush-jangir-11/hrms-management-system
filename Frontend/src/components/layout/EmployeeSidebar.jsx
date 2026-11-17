import { Link, useLocation, NavLink } from "react-router-dom";
import {
  BriefcaseBusiness,
  CalendarDays,
  Clock,
  LayoutDashboard,
  LogOut,
  Settings,
  User,
  Wallet,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const EMP_ICON_MAP = {
  dashboard: LayoutDashboard,
  attendance: Clock,
  leave: CalendarDays,
  payroll: Wallet,
  calendar: CalendarDays,
  profile: User,
  settings: Settings,
};

export const empMenuItems = [
  { module: "dashboard", name: "Dashboard", to: "/employee" },
  { module: "attendance", name: "Attendance", to: "/employee/attendance" },
  { module: "leave", name: "Leave", to: "/employee/leave" },
  { module: "payroll", name: "Payroll", to: "/employee/payroll" },
  { module: "calendar", name: "Calendar", to: "/employee/calendar" },
  { module: "profile", name: "Profile", to: "/employee/profile" },
  { module: "settings", name: "Settings", to: "/employee/settings" },
];

const EmployeeSidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { logout, user } = useAuth();

  // Pre-filtered by backend or fallback to default
  const rawMenuItems =
    user?.sidebarMenu && Array.isArray(user.sidebarMenu) && user.sidebarMenu.length > 0
      ? user.sidebarMenu
      : empMenuItems;

  // Ensure Settings is always present even if session was saved in localStorage before this update
  const menuItems = rawMenuItems.some(
    (item) => item.module === "settings" || item.to === "/employee/settings"
  )
    ? rawMenuItems
    : [...rawMenuItems, { module: "settings", name: "Settings", to: "/employee/settings" }];

  const closeSidebar = () => {
    if (setSidebarOpen) {
      setSidebarOpen(false);
    }
  };

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
      {/* Logo Header */}
      <div className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200/80 px-6">
        <Link
          to="/employee"
          onClick={closeSidebar}
          className="flex items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md shadow-blue-200">
            <BriefcaseBusiness size={22} />
          </div>

          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">HRMS</h1>
            <p className="text-xs font-semibold text-sky-600">Employee Portal</p>
          </div>
        </Link>

        {/* Mobile Close Button */}
        <button
          onClick={closeSidebar}
          className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden cursor-pointer"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation & Menu */}
      <div className="flex flex-1 flex-col justify-between px-4 py-6">
        <div>
          <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            Main Menu
          </p>

          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const IconComponent = EMP_ICON_MAP[item.module] || LayoutDashboard;
              return (
                <NavLink
                  key={item.name}
                  to={item.to}
                  end={item.to === "/employee"}
                  onClick={closeSidebar}
                  className={({ isActive }) =>
                    `group flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${isActive
                      ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-blue-200 font-bold"
                      : "text-slate-600 hover:bg-sky-50/70 hover:text-sky-600"
                    }`
                  }
                >
                  <IconComponent size={18} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Account / Logout */}
        <div className="pt-6 border-t border-slate-100 mt-6">
          <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            Account
          </p>

          <button
            onClick={logout}
            className="group flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 cursor-pointer"
          >
            <LogOut size={19} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default EmployeeSidebar;
