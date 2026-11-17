import { createContext, useContext, useState, useEffect } from "react";
import API from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("hrms_user");
      return savedUser && savedUser !== "undefined" && savedUser !== "null" ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem("hrms_token");
    return savedToken && savedToken !== "undefined" && savedToken !== "null" ? savedToken : null;
  });

  // Automatically refresh user profile on app load to sync latest position & details
  useEffect(() => {
    const refreshUser = async () => {
      const storedToken = localStorage.getItem("hrms_token");
      if (!storedToken || storedToken === "undefined" || storedToken === "null") return;

      try {
        const response = await API.get("/auth/me");
        const data = response.data;
        if (data?.success && data?.data?.user) {
          const u = data.data.user;
          const updatedInfo = {
            id: u._id,
            name: u.userName || u.name,
            email: u.email,
            role: u.role?.toLowerCase() || "employee",
            position: u.position || u.designation || "",
            department: u.department,
            avatar: u.avatar || "",
            permissions: u.permissions || [],
            sidebarMenu: u.sidebarMenu || [],
          };
          setUser(updatedInfo);
          localStorage.setItem("hrms_user", JSON.stringify(updatedInfo));
        }
      } catch (err) {
        console.warn("Could not sync user profile:", err?.message);
      }
    };

    refreshUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await API.post("/auth/login", {
        email,
        password,
      });
      const data = response.data;

      if (!data.success || !data.data) {
        return {
          success: false,
          message: data.message || "Invalid email or password",
        };
      }

      const userData = data.data;

      const userInfo = {
        id: userData._id,
        name: userData.userName || userData.name,
        email: userData.email,
        role: userData.role?.toLowerCase() || "employee",
        position: userData.position || userData.employee?.position || "",
        department: userData.department,
        avatar: userData.avatar || userData.employee?.avatar || "",
        permissions: userData.permissions || [],
        sidebarMenu: userData.sidebarMenu || [],
      };

      setUser(userInfo);
      setToken(userData.token);

      localStorage.setItem("hrms_user", JSON.stringify(userInfo));
      localStorage.setItem("hrms_token", userData.token);

      return {
        success: true,
        user: userInfo,
      };

    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Something went wrong during login",
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("hrms_user");
    localStorage.removeItem("hrms_token");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
