import { useState, useEffect, useRef, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGet, usePut, useDelete } from "../../hooks/useApi";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  X,
  CalendarDays,
  CheckSquare,
  FileText,
  Clock,
  ShieldCheck,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";

const INITIAL_STATIC_NOTIFICATIONS = [
  {
    id: "notif-1",
    title: "Leave Application Pending",
    message: "Rajesh Kumar requested 3 Days Paid Leave (16 Sep - 18 Sep) awaiting manager review.",
    type: "leave",
    time: "10m ago",
    isRead: false,
    link: "/hr/leave",
  },
  {
    id: "notif-2",
    title: "Task Deadline Approaching",
    message: "Task 'UI Layout Adjustment & Responsiveness' is due today by 5:00 PM.",
    type: "task",
    time: "45m ago",
    isRead: false,
    link: "/employee/dashboard",
  },
  {
    id: "notif-3",
    title: "New Shift Schedule Assigned",
    message: "Your monthly shift schedule & working hours policy for Sep 2026 has been published.",
    type: "calendar",
    time: "2h ago",
    isRead: false,
    link: "/employee/calendar",
  },
];

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return "Just now";
  const diff = (new Date() - new Date(dateStr)) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const NotificationDropdown = ({ portalType = "employee" }) => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [filterTab, setFilterTab] = useState("All");
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  /* ── TanStack Query: Fetch Notifications with 30s background polling via useGet ── */
  const { data: notifRes } = useGet(
    "/notifications",
    ["notifications"],
    {},
    { refetchInterval: 30000 }
  );

  const notifications = useMemo(() => {
    if (notifRes?.success && Array.isArray(notifRes.data)) {
      return notifRes.data.map((item) => ({
        id: item._id,
        title: item.title,
        message: item.message,
        type: item.type || "system",
        time: formatRelativeTime(item.createdAt),
        isRead: item.isRead,
        link: item.link || "",
      }));
    }
    return INITIAL_STATIC_NOTIFICATIONS;
  }, [notifRes]);

  const unreadCount = useMemo(() => {
    if (notifRes?.unreadCount !== undefined) return notifRes.unreadCount;
    return notifications.filter((n) => !n.isRead).length;
  }, [notifRes, notifications]);

  // Close popover on clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ── 1. Mark Single Notification as Read (via usePut hook) ── */
  const markAsReadMutation = usePut("/notifications", {
    invalidateKeys: [["notifications"]],
    mutationFn: async (id) => {
      if (!String(id).startsWith("notif-")) {
        return API.put(`/notifications/${id}/read`);
      }
      return null;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previousNotifications = queryClient.getQueryData(["notifications"]);

      queryClient.setQueryData(["notifications"], (old) => {
        if (!old || !Array.isArray(old.data)) {
          return {
            success: true,
            data: INITIAL_STATIC_NOTIFICATIONS.map((n) =>
              n.id === id ? { ...n, _id: n.id, isRead: true } : { ...n, _id: n.id }
            ),
            unreadCount: Math.max(
              0,
              INITIAL_STATIC_NOTIFICATIONS.filter((n) => !n.isRead && n.id !== id).length
            ),
          };
        }

        const updatedData = old.data.map((item) =>
          item._id === id || item.id === id ? { ...item, isRead: true } : item
        );

        const currentUnread =
          old.unreadCount !== undefined
            ? old.unreadCount
            : old.data.filter((i) => !i.isRead).length;

        return {
          ...old,
          data: updatedData,
          unreadCount: Math.max(0, currentUnread - 1),
        };
      });

      return { previousNotifications };
    },
    onError: (err, id, context) => {
      console.error("Failed to mark notification as read:", err);
      if (context?.previousNotifications !== undefined) {
        queryClient.setQueryData(["notifications"], context.previousNotifications);
      }
    },
  });

  /* ── 2. Mark All Notifications as Read (via usePut hook) ── */
  const markAllAsReadMutation = usePut("/notifications/read-all", {
    invalidateKeys: [["notifications"]],
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previousNotifications = queryClient.getQueryData(["notifications"]);

      queryClient.setQueryData(["notifications"], (old) => {
        if (!old || !Array.isArray(old.data)) {
          return {
            success: true,
            data: INITIAL_STATIC_NOTIFICATIONS.map((n) => ({
              ...n,
              _id: n.id,
              isRead: true,
            })),
            unreadCount: 0,
          };
        }

        return {
          ...old,
          data: old.data.map((item) => ({ ...item, isRead: true })),
          unreadCount: 0,
        };
      });

      return { previousNotifications };
    },
    onError: (err, variables, context) => {
      console.error("Failed to mark all as read:", err);
      if (context?.previousNotifications !== undefined) {
        queryClient.setQueryData(["notifications"], context.previousNotifications);
      }
    },
  });

  /* ── 3. Delete Single Notification (via useDelete hook) ── */
  const deleteNotificationMutation = useDelete("/notifications", {
    invalidateKeys: [["notifications"]],
    mutationFn: async (id) => {
      if (!String(id).startsWith("notif-")) {
        return API.delete(`/notifications/${id}`);
      }
      return null;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previousNotifications = queryClient.getQueryData(["notifications"]);

      queryClient.setQueryData(["notifications"], (old) => {
        if (!old || !Array.isArray(old.data)) {
          const filtered = INITIAL_STATIC_NOTIFICATIONS.filter((n) => n.id !== id);
          return {
            success: true,
            data: filtered.map((n) => ({ ...n, _id: n.id })),
            unreadCount: filtered.filter((n) => !n.isRead).length,
          };
        }

        const target = old.data.find((item) => item._id === id || item.id === id);
        const isUnread = target && !target.isRead;
        const updatedData = old.data.filter((item) => item._id !== id && item.id !== id);

        return {
          ...old,
          data: updatedData,
          unreadCount:
            isUnread && old.unreadCount !== undefined
              ? Math.max(0, old.unreadCount - 1)
              : old.unreadCount,
        };
      });

      return { previousNotifications };
    },
    onError: (err, id, context) => {
      console.error("Failed to delete notification:", err);
      if (context?.previousNotifications !== undefined) {
        queryClient.setQueryData(["notifications"], context.previousNotifications);
      }
    },
  });

  /* ── 4. Clear All Notifications (via useDelete hook) ── */
  const clearAllMutation = useDelete("/notifications/clear-all", {
    invalidateKeys: [["notifications"]],
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previousNotifications = queryClient.getQueryData(["notifications"]);

      queryClient.setQueryData(["notifications"], (old) => ({
        ...(old || {}),
        success: true,
        data: [],
        unreadCount: 0,
      }));

      return { previousNotifications };
    },
    onError: (err, variables, context) => {
      console.error("Failed to clear notifications:", err);
      if (context?.previousNotifications !== undefined) {
        queryClient.setQueryData(["notifications"], context.previousNotifications);
      }
    },
  });

  // Action Triggers
  const handleMarkAsRead = (id, e) => {
    if (e) e.stopPropagation();
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDeleteNotification = (id, e) => {
    if (e) e.stopPropagation();
    deleteNotificationMutation.mutate(id);
  };

  const handleClearAll = () => {
    clearAllMutation.mutate();
  };

  // Handle clicking notification card
  const handleNotificationClick = (notif) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif.id);
    }
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  // Filtered notifications
  const filteredNotifications = notifications.filter((n) => {
    if (filterTab === "Unread") return !n.isRead;
    if (filterTab === "Leaves") return n.type === "leave";
    if (filterTab === "Tasks") return n.type === "task";
    return true;
  });

  // Icon mapping helper
  const getNotifIcon = (type) => {
    switch (type) {
      case "leave":
        return <FileText size={16} className="text-sky-500" />;
      case "task":
        return <CheckSquare size={16} className="text-indigo-500" />;
      case "calendar":
        return <CalendarDays size={16} className="text-emerald-500" />;
      case "policy":
        return <ShieldCheck size={16} className="text-amber-500" />;
      case "attendance":
        return <Clock size={16} className="text-blue-500" />;
      default:
        return <Sparkles size={16} className="text-purple-500" />;
    }
  };

  // Container styling helper
  const getIconBgStyle = (type) => {
    switch (type) {
      case "leave":
        return "bg-sky-50 border-sky-200/80";
      case "task":
        return "bg-indigo-50 border-indigo-200/80";
      case "calendar":
        return "bg-emerald-50 border-emerald-200/80";
      case "policy":
        return "bg-amber-50 border-amber-200/80";
      case "attendance":
        return "bg-blue-50 border-blue-200/80";
      default:
        return "bg-purple-50 border-purple-200/80";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button with Badge Counter */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative rounded-xl p-2.5 transition-all duration-200 cursor-pointer ${isOpen
            ? "bg-sky-50 text-sky-600 ring-2 ring-sky-200 shadow-xs"
            : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          }`}
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white shadow-md animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Flyout Notification Drawer Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl bg-white shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-white/20 backdrop-blur-xs">
                <Bell size={16} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold tracking-tight">Notifications</h3>
                <p className="text-[10px] text-sky-100 font-semibold">
                  {unreadCount > 0 ? `${unreadCount} unread notification(s)` : "All caught up!"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  disabled={markAllAsReadMutation.isPending}
                  onClick={handleMarkAllAsRead}
                  className="px-2 py-1 rounded-lg hover:bg-white/20 disabled:opacity-50 text-white transition text-[10px] font-extrabold flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                  title="Mark all as read"
                >
                  <CheckCheck size={13} />
                  <span>{markAllAsReadMutation.isPending ? "Updating..." : "Read All"}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Filter Tabs & Clear Action */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              {["All", "Unread", "Leaves", "Tasks"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterTab(tab)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${filterTab === tab
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "text-slate-600 hover:bg-slate-200/60"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[10px] font-bold text-rose-500 hover:text-rose-700 transition cursor-pointer flex items-center gap-0.5"
                title="Clear all notifications"
              >
                <Trash2 size={12} />
                Clear
              </button>
            )}
          </div>

          {/* Notification List Items */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center">
                  <Bell size={20} />
                </div>
                <p className="text-xs font-bold text-slate-700">No Notifications</p>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  {filterTab === "Unread"
                    ? "You've read all your notifications!"
                    : "Notifications for leave requests, tasks, and updates will appear here."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`group p-3.5 flex items-start gap-3 transition-colors cursor-pointer relative ${!notif.isRead
                      ? "bg-sky-50/40 hover:bg-sky-50/80"
                      : "bg-white hover:bg-slate-50"
                    }`}
                >
                  {/* Unread Pill Dot */}
                  {!notif.isRead && (
                    <span className="absolute left-1.5 top-5 h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                  )}

                  {/* Icon */}
                  <div
                    className={`h-9 w-9 rounded-2xl border flex items-center justify-center shrink-0 shadow-2xs ${getIconBgStyle(
                      notif.type
                    )}`}
                  >
                    {getNotifIcon(notif.type)}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={`text-xs font-extrabold truncate ${!notif.isRead ? "text-slate-900" : "text-slate-700"
                          }`}
                      >
                        {notif.title}
                      </p>
                      <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                        {notif.time}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 font-medium mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>

                    {notif.link && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-sky-600 mt-1 hover:underline">
                        <span>View Details</span>
                        <ChevronRight size={11} />
                      </span>
                    )}
                  </div>

                  {/* Card Actions (Mark Read & Delete) */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    {!notif.isRead && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkAsRead(notif.id, e)}
                        className="p-1 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-100 transition cursor-pointer"
                        title="Mark as read"
                      >
                        <Check size={13} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleDeleteNotification(notif.id, e)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                      title="Delete notification"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
            <span className="text-[11px] font-bold text-slate-400">
              Notification Center • HRMS Portal
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
