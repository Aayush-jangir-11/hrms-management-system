import { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Sparkles,
  Trash2,
  Edit3,
} from "lucide-react";

const ToastContext = createContext(null);

export const TOAST_ICONS = {
  delete: Trash2,
  error: AlertCircle,
  warning: AlertTriangle,
  create: Sparkles,
  update: Edit3,
  info: Info,
  success: CheckCircle2,
};

export const TOAST_STYLES = {
  // 1. DELETE: Fiery Red-Orange-Coral gradient (destructive action)
  delete:
    "bg-gradient-to-r from-red-600 via-rose-600 to-orange-500 text-white border border-white/20 shadow-xl shadow-red-600/35",

  // 2. ERROR: Deep Crimson / Dark Ruby Danger Red (system error, denied, validation)
  error:
    "bg-gradient-to-r from-rose-950 via-red-800 to-rose-900 text-white border border-white/20 shadow-xl shadow-rose-900/40",

  // 3. CREATE: Vibrant Neon Indigo + Purple + Pink (new record created)
  create:
    "bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 text-white border border-white/20 shadow-xl shadow-purple-500/35",

  // 4. UPDATE: Fresh Ocean Cyan + Teal + Blue (record modified / edited)
  update:
    "bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 text-white border border-white/20 shadow-xl shadow-cyan-500/35",

  // 5. SUCCESS: Lush Emerald + Green (general success, login, status)
  success:
    "bg-gradient-to-r from-emerald-500 via-green-600 to-teal-600 text-white border border-white/20 shadow-xl shadow-emerald-500/35",

  // 6. WARNING: Warm Golden Amber + Orange (alerts, missing fields)
  warning:
    "bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-white border border-white/20 shadow-xl shadow-amber-500/35",

  // 7. INFO: Deep Royal Blue + Sapphire Violet (informational notices)
  info:
    "bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 text-white border border-white/20 shadow-xl shadow-indigo-500/35",
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Remove toast by id
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Universal showToast dispatcher
  const showToast = useCallback((messageOrOptions, type = "success", options = {}) => {
    let rawMessage = "";
    let rawType = "success";
    let duration = 3500;

    if (typeof messageOrOptions === "object" && messageOrOptions !== null) {
      rawMessage = messageOrOptions.message || "";
      rawType = messageOrOptions.type || type || "success";
      duration = messageOrOptions.duration || 3500;
    } else {
      rawMessage = String(messageOrOptions || "");
      rawType = type || "success";
      duration = options?.duration || 3500;
    }

    // Smart action auto-detection: If generic "success" or omitted,
    // detect specific action from message so delete / create / update
    // automatically trigger their respective dedicated gradient color & icon
    if (rawType === "success" || !rawType) {
      const lower = rawMessage.toLowerCase();
      if (/\b(delete|deleted|remove|removed)\b/.test(lower)) {
        rawType = "delete";
      } else if (/\b(create|created|added)\b/.test(lower)) {
        rawType = "create";
      } else if (/\b(update|updated|saved|edited)\b/.test(lower)) {
        rawType = "update";
      }
    }

    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const newToast = {
      id,
      message: rawMessage,
      type: rawType,
      duration,
    };

    setToasts((prev) => {
      // Prevent identical message spam in the same second
      const isDuplicate = prev.some(
        (t) => t.message === newToast.message && t.type === newToast.type
      );
      if (isDuplicate) return prev;
      return [...prev.slice(-3), newToast];
    });

    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, [removeToast]);

  const toast = {
    success: (msg, opts) => showToast(msg, "success", opts),
    error: (msg, opts) => showToast(msg, "error", opts),
    warning: (msg, opts) => showToast(msg, "warning", opts),
    info: (msg, opts) => showToast(msg, "info", opts),
    create: (msg, opts) => showToast(msg, "create", opts),
    update: (msg, opts) => showToast(msg, "update", opts),
    delete: (msg, opts) => showToast(msg, "delete", opts),
  };

  // Automatically listen to Axios 403 Forbidden events from api.js
  useEffect(() => {
    const handleForbidden = (event) => {
      const detail = event?.detail || {};
      const message =
        detail.message || "Access Denied: You do not have permission to perform this action.";
      showToast(message, "error");
    };

    window.addEventListener("hrms:forbidden", handleForbidden);
    return () => {
      window.removeEventListener("hrms:forbidden", handleForbidden);
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, toast, removeToast }}>
      {children}

      {/* Floating Global Toast Stack */}
      <div
        className="fixed top-5 right-5 z-[99999] flex flex-col gap-2.5 max-w-sm sm:max-w-md pointer-events-none"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((t) => {
          const Icon = TOAST_ICONS[t.type] || TOAST_ICONS.success;
          const style = TOAST_STYLES[t.type] || TOAST_STYLES.success;

          return (
            <div
              key={t.id}
              role="alert"
              className={`pointer-events-auto flex items-center gap-3 rounded-2xl px-5 py-3.5 text-xs font-bold shadow-2xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-4 ${style}`}
            >
              <Icon
                size={18}
                className={`shrink-0 ${t.type === "create" ? "animate-pulse" : ""}`}
              />
              <span className="tracking-wide break-words">{t.message}</span>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="ml-2 text-white/80 hover:text-white transition cursor-pointer shrink-0"
                aria-label="Close notification"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export default ToastContext;
