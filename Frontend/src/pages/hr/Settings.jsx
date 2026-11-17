import { useState, useEffect, useMemo } from "react";
import {
  Bell,
  Save,
  Settings2,
  Loader,
  Mail,
  Clock,
  CalendarDays,
  Sparkles,
  CheckCircle2,
  Sliders,
  Volume2,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  Laptop,
  Lock,
  User,
  CheckCheck,
  FileText,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useGet, usePut } from "../../hooks/useApi";
import { useToast } from "../../hooks/useToast";

const Settings = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("notifications");
  const [saving, setSaving] = useState(false);

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Notification state (unified across all portals, managed directly via MongoDB)
  const [notifications, setNotifications] = useState({
    leaveUpdates: true,
    payslipReady: true,
    taskAssigned: true,
    attendanceReminder: true,
    emailAlerts: true,
  });

  // Fetch notification preferences from server
  const { data: prefRes } = useGet("/auth/preferences", "hr-preferences");

  useEffect(() => {
    if (prefRes?.success && prefRes?.data) {
      setNotifications((prev) => ({
        ...prev,
        ...prefRes.data,
      }));
    }
  }, [prefRes]);

  // Mutation to persist preferences to MongoDB
  const { mutate: updatePreferencesMutation, isPending: prefSaving } = usePut(
    "/auth/preferences",
    {
      invalidateKeys: ["hr-preferences"],
      onSuccess: (data) => {
        if (data?.success) {
          showToast(data.message || "HR notification preferences saved successfully!", "success");
        }
      },
      onError: (error) => {
        const msg = error.response?.data?.message || "Failed to update preferences";
        showToast(msg, "error");
      },
    }
  );

  const activeCount = Object.values(notifications).filter(Boolean).length;

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    const pwd = passwordForm.newPassword;
    if (!pwd) return { score: 0, text: "Not entered", color: "bg-slate-200" };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score: 1, text: "Weak", color: "bg-rose-500", labelColor: "text-rose-500" };
    if (score <= 4) return { score: 2, text: "Good", color: "bg-amber-500", labelColor: "text-amber-500" };
    return { score: 3, text: "Strong", color: "bg-emerald-500", labelColor: "text-emerald-500" };
  }, [passwordForm.newPassword]);

  const { mutate: changePasswordMutation, isPending: passwordLoading } = usePut(
    "/auth/change-password",
    {
      onSuccess: (data) => {
        if (data?.success) {
          showToast(data.message || "Password updated successfully!", "success");
          setPasswordForm({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
        }
      },
      onError: (error) => {
        const msg = error.response?.data?.message || "Failed to update password";
        showToast(msg, "error");
      },
    }
  );

  const tabs = [
    {
      id: "notifications",
      name: "Notification & Alert Rules",
      shortLabel: "Alerts",
      icon: Bell,
      badge: `${activeCount} Rules`,
    },
    {
      id: "security",
      name: "Security & Credentials",
      shortLabel: "Security",
      icon: KeyRound,
      badge: "Protected",
    },
  ];

  const handleSave = () => {
    try {
      setSaving(true);
      updatePreferencesMutation({ preferences: notifications });
    } catch (err) {
      showToast(err?.message || "Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      return showToast("Please enter current password.", "error");
    }
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      return showToast("New password must be at least 6 characters long.", "error");
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return showToast("New passwords do not match.", "error");
    }

    changePasswordMutation({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* ================= HEADER HERO BANNER ================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-600 via-blue-700 to-indigo-800 p-6 md:p-8 text-white shadow-xl shadow-blue-200/50">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-indigo-950/30 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-md mb-2">
              <Settings2 size={14} />
              <span>HR System Configuration</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              HR Portal Settings
            </h1>
            <p className="text-blue-100 text-sm mt-1 max-w-lg">
              Manage automated notification triggers, operational email digests, and account password security.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
            {activeTab === "notifications" && (
              <button
                onClick={handleSave}
                disabled={saving || prefSaving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-blue-700 font-bold text-xs shadow-md hover:bg-sky-50 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {saving || prefSaving ? (
                  <>
                    <Loader size={14} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>Save Alerts</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Quick Highlights Row */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/20 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/15">
              <User size={16} />
            </div>
            <div>
              <p className="text-sky-200 text-[10px] uppercase font-bold">HR Account</p>
              <p className="font-extrabold text-white truncate max-w-[120px]">{user?.name || "HR Manager"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/15">
              <Bell size={16} />
            </div>
            <div>
              <p className="text-sky-200 text-[10px] uppercase font-bold">Active Rules</p>
              <p className="font-extrabold text-white text-sm">{activeCount} of 5 Enabled</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/15">
              <Mail size={16} />
            </div>
            <div>
              <p className="text-sky-200 text-[10px] uppercase font-bold">Delivery</p>
              <p className="font-extrabold text-white text-sm">Dashboard & Email</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/15">
              <ShieldCheck size={16} />
            </div>
            <div>
              <p className="text-sky-200 text-[10px] uppercase font-bold">Session Security</p>
              <p className="font-extrabold text-white text-sm">Encrypted JWT</p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MODERN HORIZONTAL TABS ================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-1.5 shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[170px] flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer select-none active:scale-98 ${
                isActive
                  ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-blue-200"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon
                  size={17}
                  className={isActive ? "text-white" : "text-slate-400"}
                />
                <span className="truncate">{tab.name}</span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold uppercase shrink-0 ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* ================= TAB 1: NOTIFICATION RULES ================= */}
      {activeTab === "notifications" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
                <Bell size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Automated Notification Triggers
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enable or disable automated event alerts delivered to your HR portal and registered email
                </p>
              </div>
            </div>

            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
              <Sparkles size={13} />
              <span>{activeCount} Active</span>
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {/* Leave Applications */}
            <div className="py-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 shrink-0">
                  <CalendarDays size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-800">
                      Leave Application & Review Alerts
                    </p>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                      LEAVE
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl">
                    Instant alerts whenever an employee applies for leave, cancels a request, or awaits departmental approval.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={notifications.leaveUpdates}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      leaveUpdates: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 shadow-inner" />
              </label>
            </div>

            {/* Attendance Digest */}
            <div className="py-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-sky-50 text-sky-600 shrink-0">
                  <Clock size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-800">
                      Daily Attendance & Check-In Summary
                    </p>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700">
                      ATTENDANCE
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl">
                    Daily summary alerts for employee punch-ins, late mark occurrences, and missing check-in events.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={notifications.attendanceReminder}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      attendanceReminder: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 shadow-inner" />
              </label>
            </div>

            {/* Task Updates */}
            <div className="py-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 shrink-0">
                  <CheckCheck size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-800">
                      Task Assignment & Milestone Alerts
                    </p>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                      TASKS
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl">
                    Real-time notifications whenever project tasks are created, completed, or reassigned across departments.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={notifications.taskAssigned}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      taskAssigned: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 shadow-inner" />
              </label>
            </div>

            {/* Payslip & Payroll Dispatches */}
            <div className="py-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 shrink-0">
                  <FileText size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-800">
                      Monthly Payroll & Payslip Dispatches
                    </p>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700">
                      PAYROLL
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl">
                    Confirmation notifications upon monthly salary computation, bulk slips generation, and disbursements.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={notifications.payslipReady}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      payslipReady: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 shadow-inner" />
              </label>
            </div>

            {/* Email Digests */}
            <div className="py-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-800">
                      System Email Digest & Critical Alerts
                    </p>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700">
                      EMAIL
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl">
                    Dispatch copies of urgent company announcements and operational notices to your registered email address.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={notifications.emailAlerts}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      emailAlerts: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 shadow-inner" />
              </label>
            </div>
          </div>

          {/* Footer Info & Save Action */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
              <span>Notification preferences are synced to your HR account and applied immediately</span>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || prefSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {saving || prefSaving ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Save Preferences</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ================= TAB 2: SECURITY & CREDENTIALS ================= */}
      {activeTab === "security" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100">
                  <KeyRound size={22} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">
                    HR Account Password & Credentials
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Update your HR portal login password to keep administrative functions secure
                  </p>
                </div>
              </div>

              <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                <ShieldCheck size={13} />
                <span>Protected Account</span>
              </span>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-2xl">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        currentPassword: e.target.value,
                      })
                    }
                    placeholder="Enter current password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-sky-500 pr-10 text-slate-800 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          newPassword: e.target.value,
                        })
                      }
                      placeholder="Minimum 6 characters"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-sky-500 pr-10 text-slate-800 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          confirmPassword: e.target.value,
                        })
                      }
                      placeholder="Re-enter new password"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-sky-500 pr-10 text-slate-800 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Strength Meter */}
              {passwordForm.newPassword && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500">Strength:</span>
                    <span className={passwordStrength.labelColor}>{passwordStrength.text}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden flex gap-1">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        passwordStrength.score >= 1 ? passwordStrength.color : "bg-transparent"
                      } w-1/3`}
                    />
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        passwordStrength.score >= 2 ? passwordStrength.color : "bg-transparent"
                      } w-1/3`}
                    />
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        passwordStrength.score >= 3 ? passwordStrength.color : "bg-transparent"
                      } w-1/3`}
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-xs shadow-md shadow-blue-200 hover:from-sky-600 hover:to-blue-700 transition cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {passwordLoading ? (
                    <>
                      <Loader size={14} className="animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound size={14} />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Active Session Info Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <Laptop size={22} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">
                    Active Login Session
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Current device and browser authentication session
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Active Now</span>
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/60 gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-sky-600 shadow-xs">
                  <Laptop size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Web Browser Client</p>
                  <p className="text-xs text-slate-400">
                    Signed in as <span className="font-semibold text-slate-700">{user?.email || "HR Manager"}</span>
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-500 sm:text-right space-y-0.5">
                <p className="font-semibold text-slate-700">Security: Encrypted JWT</p>
                <p className="text-slate-400">Auto-expires upon session timeout</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
