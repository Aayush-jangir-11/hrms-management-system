import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach JWT token automatically
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("hrms_token");
    if (token && token !== "undefined" && token !== "null") {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiry and global errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // 1. Check if token is expired or unauthorized (401)
    if (error.response && error.response.status === 401) {
      const hadToken = !!localStorage.getItem("hrms_token");
      localStorage.removeItem("hrms_token");
      localStorage.removeItem("hrms_user");

      // Redirect to login page only if user was logged in and not already on auth/public pages
      const publicPaths = ["/login", "/forgot-password", "/reset-password", "/"];
      const currentPath = window.location.pathname;

      if (hadToken && !publicPaths.some((p) => currentPath.startsWith(p) && p !== "/")) {
        window.location.href = "/login?expired=true";
      }
    }

    // 2. Check if user is forbidden / lacks permission (403)
    if (error.response && error.response.status === 403) {
      const message =
        error.response.data?.message ||
        "Access Denied: You do not have permission to perform this action.";

      // Dispatch custom window event
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("hrms:forbidden", {
            detail: {
              message,
              url: error.config?.url,
              method: error.config?.method?.toUpperCase(),
              data: error.response?.data,
            },
          })
        );
      }
    }

    return Promise.reject(error);
  }
);

export default API;
