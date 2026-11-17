import { useState, useEffect } from "react";
import LoginLeft from "../../components/auth/LoginLeft";
import { ArrowLeft, Eye, EyeOff, Loader, AlertCircle } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    if (searchParams.get("expired") === "true") {
      setSessionExpired(true);
    }
  }, [searchParams]);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    const lowerEmail = email.trim().toLowerCase();
    console.log("[Login] Submitting form for:", lowerEmail);

    const result = await login(lowerEmail, password);
    setLoading(false);

    if (result.success) {
      const userRole = (result.user && result.user.role) || "employee";
      console.log("[Login] Success. Navigating to portal:", userRole);
      if (userRole === "admin") {
        navigate("/admin", { replace: true });
      } else if (userRole === "hr") {
        navigate("/hr", { replace: true });
      } else {
        navigate("/employee", { replace: true });
      }
    } else {
      console.warn("[Login] Authentication failed:", result.message);
      setErrorMessage(result.message || "Invalid email or password.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Section */}
      <LoginLeft />

      {/* Right Section - Single Unified Login Form Container */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 md:p-16 bg-slate-50/60">
        <div className="w-full max-w-lg animate-fade-in">
          {/* Back Button */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-700 text-sm font-semibold mb-6 transition-colors"
          >
            <ArrowLeft size={18} />
            Back to landing page
          </Link>

          {/* Form Card Container with Larger Dimensions & Soft Shadow */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 md:p-12 shadow-2xl shadow-slate-200/70">
            {/* Heading */}
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
                Sign In to HRMS
              </h1>
              <p className="text-slate-500 text-sm sm:text-base mt-2 font-medium">
                Enter your account credentials to access your portal
              </p>
            </div>

            {/* Session Expired Banner */}
            {sessionExpired && !errorMessage && (
              <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-sm font-semibold text-amber-800 flex items-center gap-2.5 animate-in fade-in duration-150">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Your session has expired. Please sign in again to continue.</span>
              </div>
            )}

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-sm font-bold text-rose-700 flex items-center gap-2.5 animate-in fade-in duration-150">
                <span className="text-rose-500 font-extrabold text-base">⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Email */}
              <div>
                <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                  Email Address
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="user@fuelit.online"
                  className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl outline-none text-slate-800 text-sm sm:text-base font-medium placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 transition-all bg-slate-50/50"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                  Password
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

                <div className="flex justify-end mt-2">
                  <Link
                    to="/forgot-password"
                    className="text-xs sm:text-sm font-semibold text-sky-600 hover:text-sky-700 transition-colors hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 mt-3 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-2xl text-sm sm:text-base font-bold shadow-lg shadow-blue-200 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In to HRMS"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
