import { useState } from "react";
import LoginLeft from "../../components/auth/LoginLeft";
import { ArrowLeft, Eye, EyeOff, Loader, CheckCircle2, Lock } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { usePost } from "../../hooks/useApi";

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const { mutate: resetPassword, isPending: loading } = usePost(`/auth/reset-password/${token}`, {
    onSuccess: (response) => {
      if (response && response.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setErrorMessage(response?.message || "Failed to reset password. Link may have expired.");
      }
    },
    onError: (err) => {
      console.error("[ResetPassword] Error:", err);
      const serverMessage = err.response?.data?.message;
      setErrorMessage(serverMessage || "Network error. Please check your connection.");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    resetPassword({ password });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Branding Section */}
      <LoginLeft />

      {/* Right Form Container */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 md:p-16 bg-slate-50/60">
        <div className="w-full max-w-lg animate-fade-in">
          {/* Back Button */}
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-700 text-sm font-semibold mb-6 transition-colors"
          >
            <ArrowLeft size={18} />
            Back to login
          </Link>

          {/* Card */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 md:p-12 shadow-2xl shadow-slate-200/70">
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
                Reset Password
              </h1>
              <p className="text-slate-500 text-sm sm:text-base mt-2 font-medium">
                Enter your new password below to secure your account.
              </p>
            </div>

            {/* Success View */}
            {success ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Password Reset Successful!</h3>
                <p className="text-sm text-slate-600 font-medium">
                  Redirecting you to the login page in 3 seconds...
                </p>
                <div className="pt-2">
                  <Link
                    to="/login"
                    className="inline-block px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl transition-all"
                  >
                    Go to Login Now
                  </Link>
                </div>
              </div>
            ) : (
              /* Password Reset Form */
              <form className="space-y-6" onSubmit={handleSubmit}>
                {errorMessage && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-sm font-bold text-rose-700 flex items-center gap-2.5">
                    <span>⚠️</span>
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* New Password */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full px-5 py-3.5 pr-12 border border-slate-200 rounded-2xl outline-none text-slate-800 text-sm sm:text-base font-medium placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 transition-all bg-slate-50/50"
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full px-5 py-3.5 pr-12 border border-slate-200 rounded-2xl outline-none text-slate-800 text-sm sm:text-base font-medium placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 transition-all bg-slate-50/50"
                    />
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 mt-3 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-2xl text-sm sm:text-base font-bold shadow-lg shadow-blue-200 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader size={20} className="animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    "Set New Password"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
