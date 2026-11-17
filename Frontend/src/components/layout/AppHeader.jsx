import { Bell, Menu, Search, LogOut, ShieldCheck, ArrowLeft, ArrowRightLeft, Users } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getGreeting } from "../../utils/greeting";
import NotificationDropdown from "../common/NotificationDropdown";

const AppHeader = ({ sidebarOpen, setSidebarOpen, portalType }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Detect active portal if not explicitly provided
  const activePortal =
    portalType ||
    (location.pathname.startsWith("/admin")
      ? "admin"
      : location.pathname.startsWith("/hr")
        ? "hr"
        : "employee");

  // Portal titles
  const portalTitles = {
    admin: "Admin Dashboard",
    hr: "HR Portal",
    employee: "Employee Portal",
  };

  // Dynamic user initials from name
  const getInitials = (name) => {
    if (!name) {
      if (activePortal === "admin") return "AD";
      if (activePortal === "hr") return "HR";
      return "EMP";
    }
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Dynamic role label
  const getRoleLabel = () => {
    if (!user || !user.role) return "User";
    const role = String(user.role).toLowerCase();
    if (role === "admin") return "Super Admin";
    if (role === "hr") return "HR Manager";
    if (role === "employee") return user.position || "Employee";
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-8">
      {/* Left: Mobile Sidebar Trigger & Portal Title */}
      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={() => setSidebarOpen && setSidebarOpen(!sidebarOpen)}
          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 hover:text-sky-600 lg:hidden cursor-pointer transition-colors"
          title="Toggle Navigation Menu"
        >
          <Menu size={22} />
        </button>

        <div>
          <h2 className="text-lg font-bold text-slate-800 md:text-xl">
            {portalTitles[activePortal] || "HRMS Portal"}
          </h2>

          <p className="hidden text-xs text-slate-400 sm:block">
            {getGreeting()}, {user?.name || "User"}
          </p>
        </div>
      </div>

      {/* Right: Actions, Portal Switchers & User Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3 md:gap-4">
        {/* Switch back to Admin Portal (When in HR portal and user is admin) */}
        {activePortal === "hr" && user?.role === "admin" && (
          <button
            onClick={() => navigate("/admin")}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
            title="Return to Admin Dashboard"
          >
            <ShieldCheck size={15} className="text-amber-600" />
            <span className="hidden sm:inline">Admin Mode (Back to Admin)</span>
            <span className="sm:hidden">Admin</span>
            <ArrowLeft size={13} className="text-amber-600" />
          </button>
        )}

        {/* Switch to HR Portal (When in Admin portal and user is admin) */}
        {activePortal === "admin" && user?.role === "admin" && (
          <button
            onClick={() => navigate("/hr")}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-900/20 transition-all cursor-pointer active:scale-95"
            title="Switch to HR Portal"
          >
            <Users size={15} />
            <span className="hidden sm:inline">Switch to HR Portal</span>
            <span className="sm:hidden">HR Portal</span>
            <ArrowRightLeft size={13} className="opacity-80" />
          </button>
        )}

        {/* Search */}
        <div className="hidden items-center rounded-xl border border-slate-200 bg-slate-50 px-3 md:flex">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-36 lg:w-44 bg-transparent px-2 py-2 text-sm outline-none text-slate-700 placeholder:text-slate-400"
          />
        </div>

        {/* Notification Dropdown */}
        <NotificationDropdown portalType={activePortal} />

        {/* User Profile Badge & Logout */}
        <div className="flex items-center gap-3 border-l border-slate-200 pl-3">
          <div
            onClick={() => navigate(`/${activePortal}/profile`)}
            title="View Profile"
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 font-semibold text-white shadow-xs text-xs sm:text-sm overflow-hidden border border-slate-200 group-hover:ring-2 group-hover:ring-sky-400 transition-all">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.name || "User"}
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials(user?.name)
              )}
            </div>

            <div className="hidden md:block">
              <p className="text-sm font-semibold text-slate-700 leading-tight group-hover:text-sky-600 transition-colors">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-slate-400 capitalize">
                {getRoleLabel()}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            title="Logout"
            className="ml-1 sm:ml-2 rounded-xl p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
