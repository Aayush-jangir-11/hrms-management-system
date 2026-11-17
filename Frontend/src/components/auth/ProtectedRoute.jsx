import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = (user.role || "").toLowerCase();
  const normalizedAllowed = allowedRoles?.map((r) => r.toLowerCase());

  if (normalizedAllowed && !normalizedAllowed.includes(userRole)) {
    // Redirect to their appropriate dashboard if logged in as wrong role
    if (userRole === "admin") return <Navigate to="/admin" replace />;
    if (userRole === "hr") return <Navigate to="/hr" replace />;
    if (userRole === "employee") return <Navigate to="/employee" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
