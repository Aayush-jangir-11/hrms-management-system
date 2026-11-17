// Master Navigation Catalog for HRMS Portals
const HR_MENU = [
  { module: "dashboard", name: "Dashboard", to: "/hr" },
  { module: "employees", name: "Employees", to: "/hr/employees" },
  { module: "tasks", name: "Tasks", to: "/hr/tasks" },
  { module: "policies", name: "Work Policies", to: "/hr/policies" },
  { module: "attendance", name: "Attendance", to: "/hr/attendance" },
  { module: "leave", name: "Leave Management", to: "/hr/leave" },
  { module: "payroll", name: "Payroll", to: "/hr/payroll" },
  { module: "departments", name: "Departments", to: "/hr/departments" },
  { module: "reports", name: "Reports", to: "/hr/reports" },
  { module: "calendar", name: "Calendar", to: "/hr/calendar" },
  { module: "profile", name: "Profile", to: "/hr/profile" },
];

const EMPLOYEE_MENU = [
  { module: "dashboard", name: "Dashboard", to: "/employee" },
  { module: "attendance", name: "Attendance", to: "/employee/attendance" },
  { module: "leave", name: "Leave", to: "/employee/leave" },
  { module: "payroll", name: "Payroll", to: "/employee/payroll" },
  { module: "calendar", name: "Calendar", to: "/employee/calendar" },
  { module: "profile", name: "Profile", to: "/employee/profile" },
  { module: "settings", name: "Settings", to: "/employee/settings" },
];

// Filter allowed menu items dynamically based on user role and permissions.
// @param {string} role - e.g. "admin", "hr", "employee"
// @param {Array|string} permissions - e.g. "ALL" or [{ module: "payroll", enabled: false, actions: [] }]
// @returns {Array<{ module: string, name: string, to: string }>}

const getSidebarMenu = (role, permissions) => {
  const r = (role || "").toLowerCase();

  // Admin / Super Admin gets master HR menu
  if (r === "admin" || r === "super admin" || permissions === "ALL") {
    return HR_MENU;
  }

  // HR users get dynamically filtered HR_MENU based on admin permissions
  if (r === "hr") {
    if (!Array.isArray(permissions)) {
      return HR_MENU;
    }
    return HR_MENU.filter((item) => {
      if (["dashboard", "calendar", "profile"].includes(item.module)) {
        return true;
      }
      const perm = permissions.find(
        (p) => (p.module || "").toLowerCase() === item.module.toLowerCase()
      );
      if (perm) {
        return Boolean(perm.enabled);
      }
      return true;
    });
  }

  // Employee Portal self-service modules (Dashboard, Attendance, Leave, Payroll, Calendar, Profile)
  return EMPLOYEE_MENU;
};

module.exports = {
  HR_MENU,
  EMPLOYEE_MENU,
  getSidebarMenu,
};
