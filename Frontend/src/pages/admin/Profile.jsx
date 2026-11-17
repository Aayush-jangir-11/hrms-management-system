import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  Calendar,
  ShieldCheck,
  MapPin,
  HeartHandshake,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Loader,
  X,
  Save,
  Shield,
  BadgeCheck,
  Crown,
  Camera,
  Trash2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import PageLoader from "../../components/common/PageLoader";
import { useGet, usePut } from "../../hooks/useApi";
import { useToast } from "../../hooks/useToast";

const AdminProfile = () => {
  const { showToast } = useToast();
  const { user, setUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  // Edit contact info state
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    address: "",
    emergencyContact: "",
  });

  /* ── TanStack Query: Fetch Admin Profile ── */
  const { data: profileRes, isLoading: loading } = useGet(
    "/auth/me",
    "admin-profile"
  );

  /* ── Mutations ── */
  const { mutate: updateProfileMutation, isPending: saving } = usePut("/auth/update-profile", {
    invalidateKeys: ["admin-profile"],
    onSuccess: (data) => {
      if (data?.success) {
        showToast("Admin profile details updated successfully!", "success");
        setIsEditing(false);
      }
    },
    onError: (error) => {
      const msg = error.response?.data?.message || "Failed to update profile";
      showToast(msg, "error");
    },
  });



  useEffect(() => {
    if (!profileRes?.success || !profileRes?.data) return;
    const emp = profileRes.data.employee || profileRes.data.user;
    setProfileData(emp);
    setEditForm({
      name: emp.name || emp.userName || "",
      phone: emp.phone || "",
      address: emp.address || "",
      emergencyContact: emp.emergencyContact || "",
    });

    if (setUser) {
      setUser((prev) => {
        const updatedUserInfo = {
          ...prev,
          id: emp._id,
          employeeId: emp.employeeId,
          name: emp.name || emp.userName,
          email: emp.email,
          role: emp.role?.toLowerCase() || prev?.role || "admin",
          department: emp.department,
          position: emp.position,
          phone: emp.phone,
          status: emp.status,
          joinDate: emp.joinDate,
          address: emp.address,
          emergencyContact: emp.emergencyContact,
          avatar: emp.avatar || prev?.avatar || "",
          permissions: prev?.permissions || [],
          sidebarMenu: prev?.sidebarMenu || [],
        };
        localStorage.setItem("hrms_user", JSON.stringify(updatedUserInfo));
        return updatedUserInfo;
      });
    }
  }, [profileRes, setUser]);

  // Handle Image Upload
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file (JPG, PNG, WebP).", "error");
      return;
    }

    // Limit to 4MB
    if (file.size > 4 * 1024 * 1024) {
      showToast("Image size must be less than 4MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result;
      setIsUploadingImage(true);
      updateProfileMutation(
        { avatar: base64String },
        {
          onSuccess: () => {
            setIsUploadingImage(false);
            showToast("Profile image updated successfully!", "success");
          },
          onError: () => {
            setIsUploadingImage(false);
            showToast("Failed to upload profile image.", "error");
          },
        }
      );
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    if (!profileData?.avatar && !user?.avatar) return;
    setIsUploadingImage(true);
    updateProfileMutation(
      { avatar: "" },
      {
        onSuccess: () => {
          setIsUploadingImage(false);
          showToast("Profile photo removed.", "success");
        },
        onError: () => {
          setIsUploadingImage(false);
          showToast("Failed to remove profile photo.", "error");
        },
      }
    );
  };

  // Save profile edits
  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateProfileMutation(editForm);
  };



  const activeEmp = profileData || user || {};
  const currentAvatar = profileData?.avatar || user?.avatar || "";

  const initials = activeEmp.name
    ? activeEmp.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : "AD";

  const joinDateFormatted = activeEmp.joinDate
    ? new Date(activeEmp.joinDate).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    : "January 10, 2024";

  if (loading) {
    return <PageLoader message="Loading Administrator Profile..." />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Hidden File Input for Avatar */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageChange}
        accept="image/*"
        className="hidden"
      />

      {/* ================= PROFILE HERO BANNER ================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 p-6 md:p-8 text-white shadow-xl shadow-blue-200/50">
        <div className="absolute -right-16 -top-16 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-16 -bottom-16 h-60 w-60 rounded-full bg-indigo-900/30 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
            {/* Avatar Circle with Camera Upload */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl bg-white/20 border-2 border-white/40 backdrop-blur-md text-white flex items-center justify-center text-3xl font-extrabold shadow-inner overflow-hidden">
                {currentAvatar ? (
                  <img
                    src={currentAvatar}
                    alt={activeEmp.name || "Admin"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials
                )}
                {isUploadingImage && (
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
                    <Loader size={24} className="animate-spin text-white" />
                  </div>
                )}
              </div>

              {/* Camera Upload Trigger */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                title="Change Profile Photo"
                className="absolute -bottom-2 -right-2 p-2 bg-white text-blue-700 hover:bg-sky-50 hover:text-blue-800 rounded-xl shadow-lg border border-sky-100 transition-all active:scale-90 cursor-pointer"
              >
                <Camera size={16} />
              </button>

              {/* Remove Photo Trigger if avatar exists */}
              {currentAvatar && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={isUploadingImage}
                  title="Remove Photo"
                  className="absolute -top-2 -right-2 p-1.5 bg-rose-500 text-white hover:bg-rose-600 rounded-xl shadow-md transition-all active:scale-90 cursor-pointer"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            <div>
              <div className="flex items-center justify-center md:justify-start gap-2.5">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  {activeEmp.name || "Super Administrator"}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-200 border border-amber-300/30">
                  <Crown size={12} /> Root Admin
                </span>
              </div>

              <p className="text-sky-100 font-medium text-sm mt-1">
                {activeEmp.position || "System Administrator"} • Master Governance & System Control
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3 text-xs font-semibold text-sky-100">
                <span className="bg-white/15 px-3 py-1 rounded-xl backdrop-blur-sm border border-white/20">
                  ID: {activeEmp.employeeId || "ADMIN01"}
                </span>
                <span className="bg-white/15 px-3 py-1 rounded-xl backdrop-blur-sm border border-white/20">
                  Role: SUPER ADMIN
                </span>
                <span className="bg-white/15 px-3 py-1 rounded-xl backdrop-blur-sm border border-white/20">
                  Since: {joinDateFormatted}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 self-center md:self-start">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer backdrop-blur-xs"
            >
              <Camera size={14} /> Upload Photo
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-blue-700 hover:bg-sky-50 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Edit3 size={15} />
              <span>{isEditing ? "Cancel Edit" : "Edit Profile"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= EDIT PROFILE FORM (IF ACTIVE) ================= */}
      {isEditing && (
        <form
          onSubmit={handleSaveProfile}
          className="bg-white border border-sky-200 rounded-3xl p-6 sm:p-8 shadow-md shadow-sky-100 animate-in fade-in zoom-in-95 duration-200 space-y-6"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Update Administrator Personal & Contact Details
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Keep your administrator contact information updated
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Administrator Name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Contact Phone
              </label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm({ ...editForm, phone: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition"
              />
            </div>

            {/* Emergency Contact */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Emergency Hotline / Backup Contact
              </label>
              <input
                type="text"
                placeholder="Name - +91 98765 00000"
                value={editForm.emergencyContact}
                onChange={(e) =>
                  setEditForm({ ...editForm, emergencyContact: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition"
              />
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Primary Station / Office Location
              </label>
              <textarea
                rows={2}
                placeholder="HQ Command Center, Mumbai"
                value={editForm.address}
                onChange={(e) =>
                  setEditForm({ ...editForm, address: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-200 transition active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ================= DETAILS GRID ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Contact & Personal Details */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                <User size={18} />
              </div>
              <h2 className="text-base font-bold text-slate-800">
                Administrator Identity & Contact
              </h2>
            </div>
          </div>

          <div className="space-y-4">
            {/* Email */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600">
                <Mail size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-slate-400 uppercase">
                  Primary Admin Email
                </p>
                <p className="text-sm font-bold text-slate-800 truncate">
                  {activeEmp.email || "admin@fuelit.online"}
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="p-2.5 rounded-xl bg-sky-100 text-sky-600">
                <Phone size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-slate-400 uppercase">
                  Direct Line
                </p>
                <p className="text-sm font-bold text-slate-800">
                  {activeEmp.phone || "+91 98765 43210"}
                </p>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600">
                <MapPin size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-slate-400 uppercase">
                  Location / Data Center
                </p>
                <p className="text-sm font-bold text-slate-800">
                  {activeEmp.address || "Corporate Operations Center, Mumbai"}
                </p>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="p-2.5 rounded-xl bg-rose-100 text-rose-600">
                <HeartHandshake size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-slate-400 uppercase">
                  Backup Technical Contact
                </p>
                <p className="text-sm font-bold text-slate-800">
                  {activeEmp.emergencyContact || "System Operations Team"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Master Privileges & Governance */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <ShieldCheck size={18} />
              </div>
              <h2 className="text-base font-bold text-slate-800">
                Master Privileges & System Scope
              </h2>
            </div>
          </div>

          <div className="space-y-4">
            {/* System Access Scope */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
                <Crown size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-slate-400 uppercase">
                  Authorization Scope
                </p>
                <p className="text-sm font-bold text-slate-800">
                  Full System Root & Governance
                </p>
              </div>
            </div>

            {/* Department */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="p-2.5 rounded-xl bg-violet-100 text-violet-600">
                <Building size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-slate-400 uppercase">
                  Department
                </p>
                <p className="text-sm font-bold text-slate-800">
                  {activeEmp.department || "Executive Leadership"}
                </p>
              </div>
            </div>

            {/* Account Status */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600">
                <BadgeCheck size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-slate-400 uppercase">
                  Account Status
                </p>
                <p className="text-sm font-bold text-emerald-700">
                  Active Master Account
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
