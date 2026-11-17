import { useState } from "react";
import LoginLeft from "../../components/auth/LoginLeft";
import { ArrowLeft, Mail, Loader, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { usePost } from "../../hooks/useApi";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { mutate: sendResetLink, isPending: loading } = usePost("/auth/forgot-password", {
    onSuccess: (response) => {
      if (response?.success) {
        setSubmitted(true);
        setMessage(response.message || "A reset link has been sent to your email.");
      } else {
        setErrorMessage(response?.message || "Something went wrong. Please try again.");
      }
    },
    onError: (err) => {
      console.error("[ForgotPassword] Error:", err);
      const serverMessage = err.response?.data?.message;
      setErrorMessage(serverMessage || "Network error. Please check your backend connection.");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage("");
    setErrorMessage("");
    sendResetLink({ email: email.trim().toLowerCase() });
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
                Forgot Password?
              </h1>
              <p className="text-slate-500 text-sm sm:text-base mt-2 font-medium">
                No worries! Enter your email address below and we'll send you a password reset link.
              </p>
            </div>

            {/* Success State */}
            {submitted ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Check your email</h3>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  {message}
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setEmail("");
                    }}
                    className="text-sm font-bold text-sky-600 hover:text-sky-700 hover:underline cursor-pointer"
                  >
                    Didn't receive the email? Try again
                  </button>
                </div>
              </div>
            ) : (
              /* Request Form */
              <form className="space-y-6" onSubmit={handleSubmit}>
                {errorMessage && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-sm font-bold text-rose-700 flex items-center gap-2.5">
                    <span>⚠️</span>
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="user@fuelit.online"
                      className="w-full px-5 py-3.5 pr-12 border border-slate-200 rounded-2xl outline-none text-slate-800 text-sm sm:text-base font-medium placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 transition-all bg-slate-50/50"
                    />
                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
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
                      Sending Link...
                    </>
                  ) : (
                    "Send Reset Link"
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

export default ForgotPasswordPage;
