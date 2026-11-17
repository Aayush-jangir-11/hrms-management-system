import { useState, useEffect, useRef } from "react";
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
  Camera,
  Trash2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import PageLoader from "../../components/common/PageLoader";
import { useGet, usePut } from "../../hooks/useApi";
import { useToast } from "../../hooks/useToast";

const Profile = () => {
  const { showToast } = useToast();

  const { user, setUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  // Edit contact info state
  const [editForm, setEditForm] = useState({
    phone: "",
    address: "",
    emergencyContact: "",
  });

  /* ── TanStack Query: Fetch employee profile ── */
  const { data: profileRes, isLoading: loading } = useGet(
    "/auth/me",
    "employee-profile"
  );

  /* ── Mutations ── */
  const { mutate: updateProfileMutation, isPending: saving } = usePut("/auth/update-profile", {
    invalidateKeys: ["employee-profile"],
    onSuccess: (data) => {
      if (data?.success) {
        showToast("Profile details updated successfully!", "success");
        setIsEditing(false);
      }
    },
    onError: (error) => {
      const msg = error.response?.data?.message || "Failed to update profile";
      showToast(msg, "error");
    },
  });



  useEffect(() => {
    if (!profileRes) return;
    const emp = profileRes.data?.employee || profileRes.data?.user || profileRes.employee || profileRes.user || profileRes.data || profileRes;
    if (!emp || typeof emp !== "object") return;

    setProfileData(emp);
    setEditForm({
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
          role: emp.role?.toLowerCase() || prev?.role || "employee",
          department: emp.department,
          position: emp.position,
          phone: emp.phone,
          status: emp.status,
          joinDate: emp.joinDate,
          salary: emp.salary,
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

  // Handle Photo Upload
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file (JPG, PNG, WebP).", "error");
      return;
    }

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
          showToast("Failed to remove photo.", "error");
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
    : "EM";

  const joinDateFormatted = activeEmp.joinDate
    ? new Date(activeEmp.joinDate).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    : "January 15, 2024";

  if (loading) {
    return <PageLoader message="Loading Your Profile..." />;
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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-600 via-blue-700 to-indigo-800 p-6 md:p-8 text-white shadow-xl shadow-blue-200/50">
        <div className="absolute -right-16 -top-16 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-16 -bottom-16 h-60 w-60 rounded-full bg-indigo-900/40 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
            {/* Avatar Circle with Camera Upload */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl bg-white/20 border-2 border-white/40 backdrop-blur-md text-white flex items-center justify-center text-3xl font-extrabold shadow-inner overflow-hidden">
                {currentAvatar ? (
                  <img
                    src={currentAvatar}
                    alt={activeEmp.name || "Employee"}
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
                title="Change Photo"
                className="absolute -bottom-2 -right-2 p-2 bg-white text-blue-700 hover:bg-sky-50 rounded-xl shadow-lg border border-sky-100 transition-all active:scale-90 cursor-pointer"
              >
                <Camera size={16} />
              </button>

              {/* Remove Photo Trigger */}
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
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  {activeEmp.name || "Employee Name"}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
                  {activeEmp.status || "Active"}
                </span>
              </div>

              <p className="text-sky-100 font-medium text-sm mt-1">
                {activeEmp.position || "Software Engineer"} • {activeEmp.department || "Engineering"}
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3 text-xs font-semibold text-sky-100">
                <span className="bg-white/15 px-3 py-1 rounded-xl backdrop-blur-sm border border-white/20">
                  ID: {activeEmp.employeeId || "EMP"}
                </span>
                <span className="bg-white/15 px-3 py-1 rounded-xl backdrop-blur-sm border border-white/20">
                  Role: {(activeEmp.role || "Employee").toUpperCase()}
                </span>
                <span className="bg-white/15 px-3 py-1 rounded-xl backdrop-blur-sm border border-white/20">
                  Joined: {joinDateFormatted}
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
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-blue-700 hover:bg-sky-50 shadow-md transition-all active:scale-95 cursor-pointer"
              title="Edit Profile"
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
                Update Contact & Personal Information
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Keep your phone number and address updated for HR communication
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
            {/* Phone */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Phone Number
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
                Emergency Contact
              </label>
              <input
                type="text"
                placeholder="Name - +91 98765 00000 (Relationship)"
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
                Residential Address
              </label>
              <textarea
                rows={2}
                placeholder="Flat / Street, City, State, PIN Code"
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
                Personal & Contact Info
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
                  Official Email Address
                </p>
                <p className="text-sm font-bold text-slate-800 truncate">
                  {activeEmp.email || "employee@fuelit.online"}
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
                  Contact Number
                </p>
                <p className="text-sm font-bold text-slate-800">
                  {activeEmp.phone || "Not Provided"}
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
                  Residential Address
                </p>
                <p className="text-sm font-bold text-slate-800">
                  {activeEmp.address || "Not Specified"}
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
                  Emergency Contact
                </p>
                <p className="text-sm font-bold text-slate-800">
                  {activeEmp.emergencyContact || "Not Configured"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Job & Organization Details */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Briefcase size={18} />
              </div>
              <h2 className="text-base font-bold text-slate-800">
                Employment & Organization
              </h2>
            </div>
          </div>

          <div className="space-y-4">
            {/* Department */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="p-2.5 rounded-xl bg-violet-100 text-violet-600">
                <Building size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-slate-400 uppercase">
                  Assigned Department
                </p>
                <p className="text-sm font-bold text-slate-800">
                  {activeEmp.department || "General"}
                </p>
              </div>
            </div>

            {/* Designation */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600">
                <Briefcase size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-slate-400 uppercase">
                  Job Position / Designation
                </p>
                <p className="text-sm font-bold text-slate-800">
                  {activeEmp.position || "Staff"}
                </p>
              </div>
            </div>

            {/* Date of Joining */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600">
                <Calendar size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-slate-400 uppercase">
                  Date of Joining
                </p>
                <p className="text-sm font-bold text-slate-800">
                  {joinDateFormatted}
                </p>
              </div>
            </div>

            {/* Assigned HR / Admin */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="p-2.5 rounded-xl bg-teal-100 text-teal-600">
                <ShieldCheck size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-slate-400 uppercase">
                  Assigned HR Manager
                </p>
                <p className="text-sm font-bold text-slate-800">
                  {activeEmp.assignedHr || "HR Operations Team"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};

export default Profile;
