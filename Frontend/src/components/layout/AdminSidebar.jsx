import { useLocation, Link } from "react-router-dom";
import {
  BriefcaseBusiness,
  LogOut,
  Settings,
  X,
  LayoutDashboard,
  Users,
  ShieldCheck,
  Building2,
  BarChart3,
  FileText,
  User,
  CalendarDays,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const AdminSidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const { logout } = useAuth();

  const sidebarItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      path: "/admin",
    },
    {
      title: "Roles & Permissions",
      icon: ShieldCheck,
      path: "/admin/roles-permissions",
    },
    {
      title: "Reports",
      icon: BarChart3,
      path: "/admin/reports",
    },
    {
      title: "Calendar",
      icon: CalendarDays,
      path: "/admin/calendar",
    },
    {
      title: "Profile",
      icon: User,
      path: "/admin/profile",
    },
    {
      title: "Settings",
      icon: Settings,
      path: "/admin/settings",
    },
  ];

  const activeItem =
    sidebarItems.find((item) => item.path === location.pathname)?.title ??
    "Dashboard";

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
          <Link to="/" onClick={closeSidebar} className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-blue-200">
              <BriefcaseBusiness size={23} />
            </div>

            <div>
              <h1 className="text-lg font-bold text-slate-800">HRMS</h1>
              <p className="text-xs text-slate-400">Admin Portal</p>
            </div>
          </Link>

          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 hover:bg-slate-100 lg:hidden cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="px-4 py-6">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Main Menu
          </p>

          <nav className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.title;

              return (
                <Link
                  key={item.title}
                  to={item.path}
                  onClick={closeSidebar}
                  className={itemClasses(isActive)}
                >
                  <Icon size={19} className={iconClasses(isActive)} />
                  <span>{item.title}</span>
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

        <button
          onClick={logout}
          className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition cursor-pointer"
        >
          <LogOut size={19} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
