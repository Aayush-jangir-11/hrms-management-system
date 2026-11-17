import { useAuth } from "../context/AuthContext";


//Custom hook to check button-level action permissions for a specific module.
// @param {string} moduleName - e.g. "employees", "attendance", "leave", "payroll"


export const usePermission = (moduleName) => {
  const { user } = useAuth();
  const role = (user?.role || "").toLowerCase();
  const isAdmin = role === "admin" || role === "super admin";
  const permissions = user?.permissions;


  // Check if the user is allowed to perform a specific action on the module.
  // e.g. can("create"), can("edit"), can("delete"), can("approve"), can("export")

  const can = (actionName) => {
    // 1. Admin has master access to all actions
    if (isAdmin || permissions === "ALL") return true;

    if (!permissions || !Array.isArray(permissions)) return false;

    // 2. Find the module in user's permissions array
    const mod = permissions.find(
      (p) => (p.module || "").toLowerCase() === (moduleName || "").toLowerCase()
    );

    // If module is not enabled or not found, action is denied
    if (!mod || !mod.enabled) return false;

    // 3. Check if action exists in allowed actions list
    const actionList = (mod.actions || []).map((a) => a.toLowerCase());
    return actionList.includes((actionName || "").toLowerCase());
  };

  return { can, isAdmin };
};

export default usePermission;
