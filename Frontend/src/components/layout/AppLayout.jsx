import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import HrSidebar from "./HrSidebar";
import EmployeeSidebar from "./EmployeeSidebar";
import AppHeader from "./AppHeader";

const AppLayout = ({ portalType }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Detect active portal
  const activePortal =
    portalType ||
    (location.pathname.startsWith("/admin")
      ? "admin"
      : location.pathname.startsWith("/hr")
        ? "hr"
        : "employee");

  // Render matching sidebar
  const renderSidebar = () => {
    switch (activePortal) {
      case "admin":
        return <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />;
      case "hr":
        return <HrSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />;
      case "employee":
      default:
        return <EmployeeSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f8fc] text-slate-800 flex flex-col">
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Dynamic Portal Sidebar */}
      {renderSidebar()}

      {/* Main App Content Area */}
      <div className="lg:ml-72 flex-1 flex flex-col min-h-screen">
        {/* Unified Dynamic App Header */}
        <AppHeader
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          portalType={activePortal}
        />

        {/* Dynamic Route Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
