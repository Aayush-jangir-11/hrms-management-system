import { useState, useEffect } from "react";
import {
  Building2,
  Shield,
  Mail,
  KeyRound,
  Save,
  Globe,
  Clock,
  Send,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Settings2,
  Sparkles,
  Loader,
  Server,
  DollarSign,
  Phone,
  MapPin,
  FileText,
  Laptop,
  ExternalLink,
  HelpCircle,
  Info,
  Zap,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useGet, usePost, usePut } from "../../hooks/useApi";
import { useToast } from "../../hooks/useToast";

const AdminSettings = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("company");
  const [showEmailPass, setShowEmailPass] = useState(false);
  const [showGoogleGuide, setShowGoogleGuide] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState("");

  // Company / Organization Settings
  const [companySettings, setCompanySettings] = useState({
    companyName: "Fuel It Online Pvt. Ltd.",
    companyEmail: "admin@fuelit.online",
    companyPhone: "+91 11 4567 8900",
    companyAddress: "Tech Park, Tower B, Sector 62, Noida, India",
    taxId: "07AAACF1234F1Z8",
    timezone: "Asia/Kolkata (IST +5:30)",
    currency: "INR (₹)",
    website: "https://fuelit.online",
  });

  // Security & Compliance Policies
  const [securityPolicies, setSecurityPolicies] = useState({
    sessionTimeout: "60",
    passwordExpiry: "90",
    twoFactorEnforced: false,
    maxLoginAttempts: "5",
    requireSpecialChar: true,
  });

  // Email / SMTP Settings (stored in MongoDB SystemSetting model)
  const [smtpSettings, setSmtpSettings] = useState({
    smtpHost: "smtp.gmail.com",
    smtpPort: "587",
    emailUser: "",
    emailPass: "",
    senderName: "Fuel It Online HRMS",
    encryption: "TLS",
    isPasswordSet: false,
  });

  // Fetch settings from Database on load
  const { data: serverSettingsData, isLoading: settingsLoading } = useGet(
    "/admin/settings",
    "admin-settings"
  );

  useEffect(() => {
    if (serverSettingsData?.data) {
      const { companySettings: comp, securityPolicies: sec, emailSettings: mail } =
        serverSettingsData.data;
      if (comp) setCompanySettings((prev) => ({ ...prev, ...comp }));
      if (sec) setSecurityPolicies((prev) => ({ ...prev, ...sec }));
      if (mail) {
        setSmtpSettings((prev) => ({
          ...prev,
          smtpHost: mail.smtpHost || "smtp.gmail.com",
          smtpPort: String(mail.smtpPort || "587"),
          emailUser: mail.emailUser || "",
          emailPass: mail.emailPass || "",
          senderName: mail.senderName || "Fuel It Online HRMS",
          encryption: mail.encryption || "TLS",
          isPasswordSet: Boolean(mail.isPasswordSet),
        }));
      }
    }
  }, [serverSettingsData]);

  // Admin Password Form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { mutate: changePasswordMutation, isPending: passwordLoading } = usePut(
    "/auth/change-password",
    {
      onSuccess: (data) => {
        if (data?.success) {
          showToast(data.message || "Admin password updated successfully!", "success");
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

  // Update Settings mutation
  const { mutate: updateSettingsMutation, isPending: saving } = usePut(
    "/admin/settings",
    {
      invalidateKeys: ["admin-settings"],
      onSuccess: (data) => {
        showToast(data?.message || "System settings saved successfully!", "success");
      },
      onError: (err) => {
        showToast(err.response?.data?.message || "Failed to save settings.", "error");
      },
    }
  );

  // Test Email mutation
  const { mutate: sendTestEmailMutation, isPending: testingEmail } = usePost(
    "/admin/settings/test-email",
    {
      onSuccess: (data) => {
        showToast(data?.message || "Test email dispatched successfully!", "success");
      },
      onError: (err) => {
        const errorMsg = err.response?.data?.message || "Failed to dispatch test email.";
        showToast(errorMsg, "error");
      },
    }
  );

  const tabs = [
    {
      id: "company",
      name: "Company & Branding",
      shortLabel: "Company",
      subtitle: "Organization profile & currency",
      icon: Building2,
      badge: companySettings.currency.split(" ")[0],
    },
    {
      id: "email",
      name: "Email & SMTP Gateway",
      shortLabel: "Email",
      subtitle: "Outgoing mail server",
      icon: Mail,
      badge: smtpSettings.isPasswordSet ? "Active" : "Not Set",
    },
    {
      id: "security",
      name: "Security & Access Policies",
      shortLabel: "Security",
      subtitle: "Session & auth rules",
      icon: Shield,
      badge: "Active",
    },
    {
      id: "credentials",
      name: "Admin Credentials",
      shortLabel: "Credentials",
      subtitle: "Password & root access",
      icon: KeyRound,
      badge: "Super Admin",
    },
  ];

  const handleSave = () => {
    updateSettingsMutation({
      companySettings,
      securityPolicies,
      emailSettings: smtpSettings,
    });
  };

  const handleSendTestEmail = () => {
    const recipient = testEmailRecipient.trim() || smtpSettings.emailUser || user?.email;
    if (!recipient) {
      return showToast("Please provide a recipient email address for testing.", "error");
    }
    if (!smtpSettings.emailUser) {
      return showToast("Please provide the Sender Gmail address first.", "error");
    }
    if (!smtpSettings.isPasswordSet && !smtpSettings.emailPass) {
      return showToast("Please enter the Google App Password or Token first.", "error");
    }

    sendTestEmailMutation({
      testRecipient: recipient,
      emailUser: smtpSettings.emailUser,
      emailPass: smtpSettings.emailPass,
      smtpHost: smtpSettings.smtpHost,
      smtpPort: smtpSettings.smtpPort,
      senderName: smtpSettings.senderName,
      encryption: smtpSettings.encryption,
    });
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

  // Helper to prefill Gmail defaults
  const applyGmailDefaults = () => {
    setSmtpSettings((prev) => ({
      ...prev,
      smtpHost: "smtp.gmail.com",
      smtpPort: "587",
      encryption: "TLS",
    }));
    showToast("Applied Gmail recommended SMTP defaults (Host: smtp.gmail.com, Port: 587, TLS)", "info");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* ================= HEADER BANNER ================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-600 via-blue-700 to-indigo-800 p-6 md:p-8 text-white shadow-xl shadow-blue-200/50">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-indigo-950/30 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-md mb-2">
              <Settings2 size={14} />
              <span>Super Admin System Control</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Global Platform Settings
            </h1>
            <p className="text-blue-100 text-sm mt-1 max-w-xl">
              Manage organization identity, default accounting currency, security compliance policies, and email integrations.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            {activeTab !== "credentials" && (
              <button
                onClick={() => handleSave(activeTab)}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-blue-700 font-bold text-xs shadow-md hover:bg-sky-50 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader size={14} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>Save {tabs.find((t) => t.id === activeTab)?.shortLabel}</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => handleSave("all")}
              disabled={saving}
              title="Save all configuration sections at once"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs border border-white/30 backdrop-blur-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Save size={14} />
              <span className="hidden sm:inline">Save All</span>
            </button>
          </div>
        </div>

        {/* Quick Highlights Row */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/20 text-xs">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white/15">
              <Building2 size={14} />
            </div>
            <div>
              <p className="text-sky-200 text-[10px] uppercase font-bold">Organization</p>
              <p className="font-extrabold text-white truncate max-w-[120px]">{companySettings.companyName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white/15">
              <DollarSign size={14} />
            </div>
            <div>
              <p className="text-sky-200 text-[10px] uppercase font-bold">Base Currency</p>
              <p className="font-extrabold text-white">{companySettings.currency}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white/15">
              <Mail size={14} />
            </div>
            <div>
              <p className="text-sky-200 text-[10px] uppercase font-bold">SMTP Gateway</p>
              <p className="font-extrabold text-white">{smtpSettings.smtpHost}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white/15">
              <Shield size={14} />
            </div>
            <div>
              <p className="text-sky-200 text-[10px] uppercase font-bold">Session Security</p>
              <p className="font-extrabold text-white">{securityPolicies.sessionTimeout}m Timeout</p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MODERN STRIPE / LINEAR HORIZONTAL TABS ================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-1.5 shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[160px] flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer select-none active:scale-98 ${isActive
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
                className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold uppercase shrink-0 ${isActive
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

      {/* ================= TAB 1: COMPANY & BRANDING ================= */}
      {activeTab === "company" && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
                  <Building2 size={22} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">
                    Organization Details & Legal Identity
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    These official details appear across generated payslips, tax summaries, and system emails
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold self-start sm:self-auto">
                <Sparkles size={13} />
                <span>Global Tenant</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Company Legal Name
                </label>
                <input
                  type="text"
                  value={companySettings.companyName}
                  onChange={(e) =>
                    setCompanySettings({ ...companySettings, companyName: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Official Support & HR Email
                </label>
                <input
                  type="email"
                  value={companySettings.companyEmail}
                  onChange={(e) =>
                    setCompanySettings({ ...companySettings, companyEmail: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Official Telephone Number
                </label>
                <input
                  type="text"
                  value={companySettings.companyPhone}
                  onChange={(e) =>
                    setCompanySettings({ ...companySettings, companyPhone: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Tax / GST Identification Number
                </label>
                <input
                  type="text"
                  value={companySettings.taxId}
                  onChange={(e) =>
                    setCompanySettings({ ...companySettings, taxId: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Headquarters Physical Address
                </label>
                <textarea
                  rows={2}
                  value={companySettings.companyAddress}
                  onChange={(e) =>
                    setCompanySettings({ ...companySettings, companyAddress: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition resize-none"
                />
              </div>

              {/* Base Currency (Master Setting) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Base Accounting Currency
                </label>
                <div className="relative">
                  <select
                    value={companySettings.currency}
                    onChange={(e) =>
                      setCompanySettings({ ...companySettings, currency: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition appearance-none cursor-pointer"
                  >
                    <option value="INR (₹)">INR (₹) - Indian Rupee (Default)</option>
                    <option value="USD ($)">USD ($) - United States Dollar</option>
                    <option value="EUR (€)">EUR (€) - Euro</option>
                    <option value="GBP (£)">GBP (£) - British Pound</option>
                  </select>
                  <DollarSign size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Master currency code applied across all payroll runs and financial reports.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Organization Timezone
                </label>
                <div className="relative">
                  <select
                    value={companySettings.timezone}
                    onChange={(e) =>
                      setCompanySettings({ ...companySettings, timezone: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition appearance-none cursor-pointer"
                  >
                    <option value="Asia/Kolkata (IST +5:30)">Asia/Kolkata (IST +5:30)</option>
                    <option value="UTC (GMT +0:00)">UTC (GMT +0:00)</option>
                    <option value="America/New_York (EST -5:00)">America/New_York (EST -5:00)</option>
                    <option value="Asia/Dubai (GST +4:00)">Asia/Dubai (GST +4:00)</option>
                  </select>
                  <Clock size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Official Website
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={companySettings.website}
                    onChange={(e) =>
                      setCompanySettings({ ...companySettings, website: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  />
                  <Globe size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: EMAIL & SMTP GATEWAY ================= */}
      {activeTab === "email" && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
            {/* Header + Gateway Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <Server size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-800">
                      Outgoing Mail Gateway (Gmail / SMTP)
                    </h2>
                    {smtpSettings.isPasswordSet ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Token Required
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure your official Gmail or SMTP server to dispatch password resets, leave approvals, and digital payslips.
                  </p>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={applyGmailDefaults}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition cursor-pointer active:scale-95"
                >
                  <Zap size={13} className="text-indigo-600" />
                  <span>Use Gmail Defaults</span>
                </button>
              </div>
            </div>

            {/* Google App Password Guide Toggle Banner */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <HelpCircle size={18} className="text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-blue-900">
                      Gmail me token / App Password kaise banayein?
                    </h4>
                    <p className="text-[11px] text-blue-700 mt-0.5 leading-relaxed">
                      Google security policies ke tehat direct Gmail login password accept nahi hota. Google Account se 16-character ka App Password generate karna hota hai.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGoogleGuide(!showGoogleGuide)}
                  className="text-xs font-bold text-blue-700 hover:text-blue-800 underline underline-offset-2 shrink-0 cursor-pointer"
                >
                  {showGoogleGuide ? "Hide Guide" : "View Step-by-Step Guide"}
                </button>
              </div>

              {showGoogleGuide && (
                <div className="mt-4 pt-4 border-t border-blue-200/60 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-xs">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px] mb-1.5">
                      Step 1
                    </span>
                    <p className="font-semibold text-slate-800 text-[11px]">2-Step Verification ON</p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Apne Google Account me 2-Step Verification enable karein.
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-xs">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px] mb-1.5">
                      Step 2
                    </span>
                    <p className="font-semibold text-slate-800 text-[11px]">App Passwords Page</p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Google Security me jakar "App passwords" search karein.
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-xs">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px] mb-1.5">
                      Step 3
                    </span>
                    <p className="font-semibold text-slate-800 text-[11px]">Name & Generate</p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      App Name me <strong>HRMS</strong> likhein aur Generate par click karein.
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-xs flex flex-col justify-between">
                    <div>
                      <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] mb-1.5">
                        Step 4
                      </span>
                      <p className="font-semibold text-slate-800 text-[11px]">Paste & Save</p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        16-digit code ko yahan password field me paste karke Save karein.
                      </p>
                    </div>
                    <a
                      href="https://myaccount.google.com/apppasswords"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800"
                    >
                      <span>Open Google Security</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Sender Email / Gmail */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Sender Gmail / Email ID <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={smtpSettings.emailUser}
                    onChange={(e) =>
                      setSmtpSettings({ ...smtpSettings, emailUser: e.target.value })
                    }
                    placeholder="e.g. hr.fuelitonline@gmail.com"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                  />
                  <Mail size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Sabhi outgoing emails is Gmail address se send ki jayengi.
                </p>
              </div>

              {/* Google App Password / Token */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Google App Password / Token <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showEmailPass ? "text" : "password"}
                    value={smtpSettings.emailPass}
                    onChange={(e) =>
                      setSmtpSettings({ ...smtpSettings, emailPass: e.target.value })
                    }
                    placeholder={
                      smtpSettings.isPasswordSet
                        ? "•••••••••••••••• (Leave blank to keep existing)"
                        : "Enter 16-character App Password"
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmailPass(!showEmailPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showEmailPass ? "Hide password" : "Show password"}
                  >
                    {showEmailPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[11px] text-slate-400">
                    Google 16-char App Password (spaces will be trimmed automatically)
                  </p>
                  {smtpSettings.isPasswordSet && (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 size={11} /> Saved in DB
                    </span>
                  )}
                </div>
              </div>

              {/* Sender Display Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Sender Display Name
                </label>
                <input
                  type="text"
                  value={smtpSettings.senderName}
                  onChange={(e) =>
                    setSmtpSettings({ ...smtpSettings, senderName: e.target.value })
                  }
                  placeholder="e.g. Fuel It Online HRMS"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Employees ke inbox me sender name ye show hoga.
                </p>
              </div>

              {/* SMTP Host Server */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  SMTP Host Server
                </label>
                <input
                  type="text"
                  value={smtpSettings.smtpHost}
                  onChange={(e) =>
                    setSmtpSettings({ ...smtpSettings, smtpHost: e.target.value })
                  }
                  placeholder="smtp.gmail.com"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Gmail ke liye standard host <code>smtp.gmail.com</code> hota hai.
                </p>
              </div>

              {/* Port Number */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Port Number
                </label>
                <input
                  type="text"
                  value={smtpSettings.smtpPort}
                  onChange={(e) =>
                    setSmtpSettings({ ...smtpSettings, smtpPort: e.target.value })
                  }
                  placeholder="587"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Common ports: <strong>587</strong> (TLS/STARTTLS) ya <strong>465</strong> (SSL).
                </p>
              </div>

              {/* Transport Encryption */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Transport Encryption
                </label>
                <select
                  value={smtpSettings.encryption}
                  onChange={(e) =>
                    setSmtpSettings({ ...smtpSettings, encryption: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition cursor-pointer"
                >
                  <option value="TLS">TLS (Transport Layer Security - Port 587)</option>
                  <option value="SSL">SSL (Secure Sockets Layer - Port 465)</option>
                  <option value="None">None (Unencrypted)</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Gmail ke liye TLS recommended hai.
                </p>
              </div>
            </div>

            {/* Live Test Email Dispatcher Card */}
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-slate-50 to-blue-50/60 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                    <Send size={14} className="text-indigo-600" />
                    <span>Live Outgoing Email Connection Test</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Save karne se pehle test email bhej kar verify karein ki naya Gmail aur App Password kaam kar rahe hain.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex-1">
                  <input
                    type="email"
                    value={testEmailRecipient}
                    onChange={(e) => setTestEmailRecipient(e.target.value)}
                    placeholder={`Enter recipient email (default: ${user?.email || smtpSettings.emailUser || 'admin@fuelit.online'})`}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={testingEmail}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
                >
                  {testingEmail ? (
                    <>
                      <Loader size={14} className="animate-spin" />
                      <span>Sending Test Email...</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Send Live Test Email</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Bottom Status Info */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-center gap-3">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>
                Backend ka <code>sendEmail.js</code> utility ab seedha MongoDB Database se dynamic credentials read karta hai. Jab aap yahan Save karenge, to poore HRMS portal ke sabhi notifications naye Gmail se send honge.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: SECURITY & COMPLIANCE POLICIES ================= */}
      {activeTab === "security" && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Shield size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Global Authentication & Session Policies
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enforce company-wide login limits, auto-logout timeouts, and credential hygiene rules
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Session Inactivity Auto-Logout
                </label>
                <select
                  value={securityPolicies.sessionTimeout}
                  onChange={(e) =>
                    setSecurityPolicies({ ...securityPolicies, sessionTimeout: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition cursor-pointer"
                >
                  <option value="15">15 Minutes of idle time</option>
                  <option value="30">30 Minutes (Recommended)</option>
                  <option value="60">60 Minutes (1 Hour)</option>
                  <option value="120">120 Minutes (2 Hours)</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Idle user sessions are terminated automatically to prevent unauthorized console access.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Password Expiration Cycle
                </label>
                <select
                  value={securityPolicies.passwordExpiry}
                  onChange={(e) =>
                    setSecurityPolicies({ ...securityPolicies, passwordExpiry: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition cursor-pointer"
                >
                  <option value="90">Every 90 Days (Corporate High Security)</option>
                  <option value="180">Every 180 Days (Semi-Annual)</option>
                  <option value="365">Every 365 Days (Annual)</option>
                  <option value="never">Never Expire</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Prompts employees to rotate credentials when expiration threshold is reached.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Max Failed Login Attempts
                </label>
                <select
                  value={securityPolicies.maxLoginAttempts}
                  onChange={(e) =>
                    setSecurityPolicies({ ...securityPolicies, maxLoginAttempts: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition cursor-pointer"
                >
                  <option value="3">3 Attempts (Strict lockout)</option>
                  <option value="5">5 Attempts (Standard)</option>
                  <option value="10">10 Attempts</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Rate limiting lock-out duration triggered by express-rate-limit middleware.
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 pt-2">
              <div className="py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Mandatory Special Character Requirement
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Require at least one special character (!@#$%^&*) on all employee passwords.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={securityPolicies.requireSpecialChar}
                    onChange={(e) =>
                      setSecurityPolicies({
                        ...securityPolicies,
                        requireSpecialChar: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 shadow-inner" />
                </label>
              </div>

              <div className="py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Two-Factor Authentication (2FA) Enforcement
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Require email/SMS verification OTP upon login for HR and Administrator roles.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={securityPolicies.twoFactorEnforced}
                    onChange={(e) =>
                      setSecurityPolicies({
                        ...securityPolicies,
                        twoFactorEnforced: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 shadow-inner" />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: ADMIN CREDENTIALS ================= */}
      {activeTab === "credentials" && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
                <KeyRound size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Root Administrator Authentication
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update your Super Admin password to protect complete tenant data
                </p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-xl">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Current Master Password
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
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    New Master Password
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
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Confirm New Master Password
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
                      placeholder="Re-enter password"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition pr-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Requirement Checklist */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-2">
                <p className="font-bold text-slate-700">Password Requirements Checklist:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className={passwordForm.newPassword.length >= 6 ? "text-emerald-500" : "text-slate-300"} />
                    <span>Minimum 6 characters</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className={/[A-Z]/.test(passwordForm.newPassword) ? "text-emerald-500" : "text-slate-300"} />
                    <span>Uppercase letter</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className={/[0-9]/.test(passwordForm.newPassword) ? "text-emerald-500" : "text-slate-300"} />
                    <span>Number (0-9)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className={/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(passwordForm.newPassword) ? "text-emerald-500" : "text-slate-300"} />
                    <span>Special character</span>
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {passwordLoading ? (
                    <>
                      <Loader size={14} className="animate-spin" />
                      <span>Updating Credentials...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound size={14} />
                      <span>Update Master Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
