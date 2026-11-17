import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Users,
  UserCog,
  ShieldCheck,
  BarChart3,
  CalendarCheck2,
  WalletCards,
  Building2,
  Sparkles,
  Menu,
  X,
  ChevronRight,
  TrendingUp,
  UserCheck,
  UserPlus,
  CalendarDays,
  Bell,
  Settings,
  Clock,
  Laptop,
  Moon,
  Sun,
  Layers,
  Globe,
  Lock,
  Download,
  FileCheck,
  Zap,
} from "lucide-react";

const FeaturesPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = [
    { id: "All", label: "All Features", icon: Sparkles },
    { id: "HR", label: "Core HR & Employee", icon: Users },
    { id: "Shifts", label: "Smart Shift Policies", icon: Clock },
    { id: "Attendance", label: "Attendance & Leave", icon: CalendarCheck2 },
    { id: "Payroll", label: "Payroll & Salary", icon: WalletCards },
    { id: "Security", label: "Security & Portals", icon: ShieldCheck },
  ];

  const allFeatures = [
    {
      id: 1,
      category: "HR",
      icon: UserPlus,
      badge: "Employee Operations",
      badgeColor: "bg-violet-50 text-violet-700 border-violet-200",
      title: "Centralized Employee Directory",
      description: "Manage complete employee lifecycles from onboarding to department allocation, roles, document uploads, and contact details.",
      highlights: ["Profile management & role assignment", "Department & team mapping", "Document repository & records", "Emergency contacts & bio details"],
    },
    {
      id: 2,
      category: "Shifts",
      icon: Clock,
      badge: "Policy Engine",
      badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
      title: "Flexible Shift & Policy Creator",
      description: "Design custom working hour policies for Company-Wide, Department-Specific, Team-Specific, or individual employee needs.",
      highlights: ["Regular, Night, Flexi & Hybrid shifts", "Late grace period configuration", "Overtime rule multipliers (1.5x, 2.0x)", "Break durations & half-day thresholds"],
    },
    {
      id: 3,
      category: "Attendance",
      icon: CalendarCheck2,
      badge: "Real-time Tracking",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      title: "Attendance & Work Logs",
      description: "Real-time clock-in/out tracking with automated late marking, shift matching, and attendance regularization requests.",
      highlights: ["Live daily attendance dashboard", "Automated working hours calculation", "Shift pattern adherence check", "Historical attendance audit trail"],
    },
    {
      id: 4,
      category: "Attendance",
      icon: CalendarDays,
      badge: "Leave Workflows",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      title: "Leave Management System",
      description: "Streamlined leave application and multi-level approval pipeline for casual, sick, paid, and custom leave types.",
      highlights: ["Employee leave balance tracking", "Manager approval & rejection notes", "Leave calendar overview", "Automatic monthly leave accrual"],
    },
    {
      id: 5,
      category: "Payroll",
      icon: WalletCards,
      badge: "Financial Engine",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      title: "Automated Payroll & Salary Slips",
      description: "Seamless monthly salary processing incorporating overtime hours, attendance deductions, bonuses, and tax calculations.",
      highlights: ["Automated gross & net pay calculation", "Digital salary slip generation", "Custom allowances & deductions", "Department-wise payroll summary"],
    },
    {
      id: 6,
      category: "Security",
      icon: ShieldCheck,
      badge: "Portal Control",
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
      title: "Three Isolated Role Portals",
      description: "Dedicated interfaces tailored for Admins, HR Managers, and Employees with strict data isolation and permission controls.",
      highlights: ["Admin Portal: Full System Governance", "HR Portal: Workforce & Operations", "Employee Portal: Self-service Hub", "Granular Role-Based Access Control"],
    },
    {
      id: 7,
      category: "HR",
      icon: BarChart3,
      badge: "Intelligence",
      badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
      title: "HR Analytics & Performance Reports",
      description: "Interactive visual reports on headcount distribution, attendance rates, leave trends, and payroll expenditure.",
      highlights: ["Department headcount breakdown", "Monthly attendance trend graphs", "Leave utilization analytics", "Exportable CSV & PDF summaries"],
    },
    {
      id: 8,
      category: "Security",
      icon: Lock,
      badge: "Compliance",
      badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
      title: "Data Privacy & Audit Logs",
      description: "Enterprise-grade encryption protecting sensitive employee records, salary data, and system modification logs.",
      highlights: ["End-to-end data encryption", "User activity audit logging", "Session security & auto-logout", "Role restriction enforcement"],
    },
  ];

  const filteredFeatures = allFeatures.filter(
    (f) => activeCategory === "All" || f.category === activeCategory
  );

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white text-slate-800 selection:bg-violet-200 selection:text-violet-900">
      {/* ================= HEADER / NAVBAR ================= */}
      <header className="fixed left-0 right-0 top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 shadow-md shadow-slate-200/20 backdrop-blur-2xl">
        <div className="mx-auto flex h-[88px] w-full items-center justify-between px-5 sm:px-8 lg:px-12 xl:px-16">
          <Link to="/" className="group flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-600 to-blue-600 text-white shadow-xl shadow-violet-200 transition duration-300 group-hover:rotate-3 group-hover:scale-105">
              <Building2 size={24} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                HR<span className="text-violet-600">Flow</span>
              </h1>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Human Resource System
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-9 lg:flex">
            <Link to="/" className="py-3 text-sm font-semibold text-slate-500 transition hover:text-violet-600">
              Home
            </Link>
            <Link to="/features" className="relative py-3 text-sm font-bold text-violet-600">
              Features
              <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500" />
            </Link>
            <a href="/#portals" className="py-3 text-sm font-semibold text-slate-500 transition hover:text-violet-600">
              Portals
            </a>
            <Link to="/about" className="py-3 text-sm font-semibold text-slate-500 transition hover:text-violet-600">
              About Us
            </Link>
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <Link to="/login" className="rounded-xl px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-violet-600">
              Login
            </Link>
            <Link to="/login" className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
              Get Started Free
              <ArrowRight size={16} className="transition group-hover:translate-x-1" />
            </Link>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-xl p-2.5 text-slate-600 transition hover:bg-violet-50 hover:text-violet-600 lg:hidden"
          >
            {menuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-slate-100 bg-white/95 px-5 py-5 shadow-xl backdrop-blur-xl lg:hidden">
            <div className="flex flex-col gap-2">
              <Link to="/" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-600">
                Home
              </Link>
              <Link to="/features" onClick={() => setMenuOpen(false)} className="rounded-xl bg-violet-50 px-4 py-3 text-sm font-bold text-violet-600">
                Features
              </Link>
              <a href="/#portals" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-600">
                Portals
              </a>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="mt-2 text-center rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg">
                Get Started Free
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="pt-[120px]">
        {/* ================= HERO SECTION ================= */}
        <section className="relative overflow-hidden bg-gradient-to-b from-violet-50/50 via-white to-white py-16 lg:py-24">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-40 top-10 h-[450px] w-[450px] rounded-full bg-violet-100/60 blur-3xl" />
            <div className="absolute right-[-100px] top-20 h-[500px] w-[500px] rounded-full bg-blue-100/60 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 xl:px-16 text-center">
            <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-4 py-2 text-xs font-extrabold text-violet-700 shadow-sm">
              <Sparkles size={15} className="text-violet-600" />
              ENTERPRISE HR PLATFORM FEATURES
            </div>

            <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-[1.08] text-slate-900 sm:text-5xl lg:text-6xl">
              Next-Generation Tools Built for{" "}
              <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
                Workforce Excellence
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Explore our full suite of HR capabilities designed to streamline workforce management, shift scheduling, real-time attendance, automated payroll, and multi-portal operations.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link to="/login" className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-600 px-8 py-4 text-sm font-extrabold text-white shadow-xl shadow-violet-200 hover:-translate-y-0.5 hover:shadow-2xl transition">
                Get Started Free <ArrowRight size={16} />
              </Link>
              <a href="#features-grid" className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-7 py-4 text-sm font-bold text-slate-700 shadow-xs hover:border-violet-300 hover:text-violet-600 transition">
                Browse Feature Catalogue <ChevronRight size={16} />
              </a>
            </div>

            {/* QUICK HIGHLIGHT METRIC PILLS */}
            <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {[
                { title: "Employee Hub", value: "360° Profile Records", icon: Users, color: "bg-violet-50 text-violet-600" },
                { title: "Shift Policy", value: "Multi-Scope Engine", icon: Clock, color: "bg-sky-50 text-sky-600" },
                { title: "Attendance", value: "Real-time Tracking", icon: CalendarCheck2, color: "bg-emerald-50 text-emerald-600" },
                { title: "Payroll", value: "Automated Pay Slips", icon: WalletCards, color: "bg-blue-50 text-blue-600" },
              ].map((pill) => {
                const IconComp = pill.icon;
                return (
                  <div key={pill.title} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs text-left">
                    <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${pill.color} mb-2.5`}>
                      <IconComp size={18} />
                    </div>
                    <p className="text-xs font-extrabold text-slate-800">{pill.title}</p>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">{pill.value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================= CATEGORY FILTER TABS & FEATURE CATALOGUE ================= */}
        <section id="features-grid" className="py-16 bg-slate-50/50 border-t border-slate-100">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 xl:px-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl lg:text-4xl">
                Comprehensive Feature Modules
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Filter and discover features engineered to empower your HR team and employees.
              </p>

              {/* Category Pills */}
              <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
                {categories.map((cat) => {
                  const CatIcon = cat.icon;
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition cursor-pointer ${isActive
                          ? "bg-violet-600 text-white shadow-lg shadow-violet-200"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                        }`}
                    >
                      <CatIcon size={14} />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredFeatures.map((feat) => {
                const FeatIcon = feat.icon;
                return (
                  <div
                    key={feat.id}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xs hover:border-violet-300 hover:shadow-xl transition duration-300 hover:-translate-y-1"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition duration-300">
                          <FeatIcon size={24} />
                        </div>
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-extrabold ${feat.badgeColor}`}>
                          {feat.badge}
                        </span>
                      </div>

                      <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-violet-600 transition">
                        {feat.title}
                      </h3>

                      <p className="mt-2.5 text-xs leading-relaxed text-slate-500">
                        {feat.description}
                      </p>

                      <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                        {feat.highlights.map((item) => (
                          <div key={item} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                            <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-7 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        HRFlow Core Module
                      </span>
                      <Link
                        to="/login"
                        className="inline-flex items-center gap-1 text-xs font-extrabold text-violet-600 hover:text-violet-700 transition"
                      >
                        Try Feature <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================= COMPARISON SECTION ================= */}
        <section className="py-20 bg-white border-t border-slate-100">
          <div className="mx-auto max-w-5xl px-5 sm:px-8 lg:px-12">
            <div className="text-center mb-12">
              <span className="inline-flex rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-extrabold text-emerald-700 border border-emerald-200">
                WHY CHOOSE HRFLOW
              </span>
              <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
                Traditional HR vs HRFlow Platform
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                See how upgrading to HRFlow eliminates administrative bottlenecks.
              </p>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold">
                    <th className="p-4 sm:p-5">HR Feature & Capability</th>
                    <th className="p-4 sm:p-5 text-rose-600 bg-rose-50/50">Traditional HR / Manual</th>
                    <th className="p-4 sm:p-5 text-violet-700 bg-violet-50">HRFlow Platform</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  <tr>
                    <td className="p-4 sm:p-5 font-bold text-slate-800">Shift & Hours Policy</td>
                    <td className="p-4 sm:p-5 text-rose-500">Fixed static hours, hard to customize</td>
                    <td className="p-4 sm:p-5 text-emerald-700 font-bold bg-violet-50/30">Dynamic (Company, Dept, Team, Emp scope)</td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-5 font-bold text-slate-800">Attendance Tracking</td>
                    <td className="p-4 sm:p-5 text-rose-500">Manual registers, prone to errors</td>
                    <td className="p-4 sm:p-5 text-emerald-700 font-bold bg-violet-50/30">Automated check-ins with shift matching</td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-5 font-bold text-slate-800">Leave Approvals</td>
                    <td className="p-4 sm:p-5 text-rose-500">Paper forms, slow email delays</td>
                    <td className="p-4 sm:p-5 text-emerald-700 font-bold bg-violet-50/30">One-click portal approval & auto accruals</td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-5 font-bold text-slate-800">Payroll Calculation</td>
                    <td className="p-4 sm:p-5 text-rose-500">Spreadsheet calculations & manual slips</td>
                    <td className="p-4 sm:p-5 text-emerald-700 font-bold bg-violet-50/30">Automated gross/net pay & instant slip generation</td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-5 font-bold text-slate-800">Portal Security</td>
                    <td className="p-4 sm:p-5 text-rose-500">Shared files with zero access control</td>
                    <td className="p-4 sm:p-5 text-emerald-700 font-bold bg-violet-50/30">3 Isolated Portals (Admin, HR, Employee)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ================= CTA BANNER ================= */}
        <section className="py-16 bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 text-white">
          <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
            <h2 className="text-3xl font-extrabold sm:text-4xl lg:text-5xl">
              Ready to Empower Your Workforce?
            </h2>
            <p className="mt-4 text-sm text-violet-100 sm:text-base">
              Join teams managing their people, policies, attendance, and payroll with HRFlow.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link to="/login" className="rounded-2xl bg-white px-8 py-4 text-sm font-extrabold text-violet-700 shadow-lg hover:bg-violet-50 hover:-translate-y-0.5 transition">
                Access Portals Now
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="w-full border-t border-slate-100 bg-white py-8">
        <div className="mx-auto flex flex-col items-center justify-between gap-4 px-5 text-center sm:flex-row sm:text-left sm:px-8 max-w-7xl">
          <p className="text-xs text-slate-400">
            © 2026 HRFlow / Fuel It Online. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-slate-500">
            <Link to="/login" className="hover:text-violet-600">Admin Portal</Link>
            <Link to="/login" className="hover:text-violet-600">HR Portal</Link>
            <Link to="/login" className="hover:text-violet-600">Employee Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default FeaturesPage;
