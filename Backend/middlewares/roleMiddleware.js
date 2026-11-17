// Middleware to authorize specific roles (e.g. authorizeRoles('Admin', 'HR Manager', 'HR'))
const authorizeRoles = (...roles) => {
  const allowed = roles.map((r) => r.toLowerCase().trim());
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ success: false, message: "User role not authenticated" });
    }

    const userRole = (req.user.role || "").toLowerCase().trim();
    const isAuthorized = allowed.some(
      (role) => role === userRole || userRole.includes(role) || role.includes(userRole)
    );

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user.role}) is not authorized to access this resource`,
      });
    }

    next();
  };
};

module.exports = { authorizeRoles };
