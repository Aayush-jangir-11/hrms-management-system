import React, { useEffect, useState } from "react";
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
  FileText,
  Building2,
  Sparkles,
  Menu,
  X,
  ChevronRight,
  TrendingUp,
  UserCheck,
  ArrowUpRight,
  BriefcaseBusiness,
  FolderOpen,
  UserPlus,
  CalendarDays,
  Bell,
  Settings,
  Heart,
  Share2,
  UploadCloud,
  Play,
  Zap,
  Clock3,
} from "lucide-react";
import { getGreeting } from "../utils/greeting";

const LandingPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const features = [
    { icon: UserPlus, title: "Easy Employee Management", description: "Create, manage and organize employee profiles, roles and departments from one simple dashboard.", iconBg: "bg-violet-100", iconColor: "text-violet-600" },
    { icon: CalendarCheck2, title: "Attendance & Leave", description: "Track attendance, working hours, leave requests and approval workflows effortlessly.", iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
    { icon: WalletCards, title: "Payroll Management", description: "Manage salary information, payroll processing and monthly employee payment records.", iconBg: "bg-blue-100", iconColor: "text-blue-600" },
    { icon: BarChart3, title: "Powerful Reports", description: "Generate employee, attendance, department and HR performance reports instantly.", iconBg: "bg-amber-100", iconColor: "text-amber-600" },
    { icon: ShieldCheck, title: "Secure & Private", description: "Protect employee information with role-based access and secure HR management.", iconBg: "bg-pink-100", iconColor: "text-pink-600" },
  ];

  const steps = [
    { number: "1", icon: UserPlus, title: "Add Employees", description: "Create employee profiles and assign departments, roles and permissions." },
    { number: "2", icon: FolderOpen, title: "Organize & Manage", description: "Manage attendance, departments, leave, payroll and employee records." },
    { number: "3", icon: Share2, title: "Access & Analyze", description: "Access workforce information and generate useful HR reports." },
  ];

  const portalData = [
    { icon: ShieldCheck, title: "Admin Portal", description: "Complete control over users, departments, HR management and system settings.", color: "from-violet-500 to-indigo-600", role: "admin" },
    { icon: UserCog, title: "HR Portal", description: "Manage employees, attendance, leave, recruitment and payroll operations.", color: "from-blue-500 to-cyan-500", role: "hr" },
    { icon: Users, title: "Employee Portal", description: "Give employees easy access to their profile, attendance, leave and documents.", color: "from-emerald-500 to-teal-500", role: "employee" },
  ];

  const dashboardStats = [
    { value: "248", label: "Employees", icon: Users, bg: "bg-violet-50", color: "text-violet-600" },
    { value: "231", label: "Present Today", icon: UserCheck, bg: "bg-emerald-50", color: "text-emerald-600" },
    { value: "14", label: "Departments", icon: Building2, bg: "bg-blue-50", color: "text-blue-600" },
    { value: "93%", label: "Attendance", icon: TrendingUp, bg: "bg-amber-50", color: "text-amber-600" },
  ];

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white text-slate-800 selection:bg-violet-200 selection:text-violet-900">
      {/* NAVBAR */}
      <header
        className={`fixed left-0 right-0 top-0 z-50 w-full border-b transition-all duration-500 ${scrolled
          ? "border-slate-200/80 bg-white/90 shadow-lg shadow-slate-200/30 backdrop-blur-2xl"
          : "border-white/30 bg-white/75 backdrop-blur-xl"
          }`}
      >
        <div className="mx-auto flex h-[88px] w-full items-center justify-between px-5 sm:px-8 lg:px-12 xl:px-16">
          <a href="#home" className="group flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-600 to-blue-600 text-white shadow-xl shadow-violet-200 transition duration-300 group-hover:rotate-3 group-hover:scale-105">
              <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 blur-sm transition group-hover:opacity-100" />
              <Building2 size={24} className="relative" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                HR<span className="text-violet-600">Flow</span>
              </h1>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Human Resource System
              </p>
            </div>
          </a>

          <nav className="hidden items-center gap-9 lg:flex">
            <a href="#home" className="group relative py-3 text-sm font-semibold text-violet-600">
              Home
              <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500" />
            </a>
            <Link to="/features" className="group relative py-3 text-sm font-semibold text-slate-500 transition hover:text-violet-600">
              Features
              <span className="absolute bottom-0 left-0 h-0.5 w-0 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-300 group-hover:w-full" />
            </Link>
            <a href="#portals" className="group relative py-3 text-sm font-semibold text-slate-500 transition hover:text-violet-600">
              Portals
              <span className="absolute bottom-0 left-0 h-0.5 w-0 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-300 group-hover:w-full" />
            </a>
            <Link to="/about" className="group relative py-3 text-sm font-semibold text-slate-500 transition hover:text-violet-600">
              About Us
              <span className="absolute bottom-0 left-0 h-0.5 w-0 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-300 group-hover:w-full" />
            </Link>
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <Link to="/login" className="rounded-xl px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-violet-600">
              Login
            </Link>
            <Link to="/login" className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
              Get Started Free
              <ArrowRight
                size={16}
                className="transition group-hover:translate-x-1"
              />
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
              <a href="#home" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-600">
                Home
              </a>
              <Link to="/features" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-violet-600 bg-violet-50">
                Features
              </Link>
              <a href="#portals" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-600">
                Portals
              </a>
              <Link to="/about" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:text-violet-600">
                About Us
              </Link>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="mt-2 text-center rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg">
                Get Started Free
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* HERO */}
        <section
          id="home"
          className="relative min-h-screen w-full overflow-hidden bg-white pt-[120px] lg:pt-[135px]"
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-40 top-20 h-[500px] w-[500px] animate-pulse rounded-full bg-violet-100/70 blur-3xl" />
            <div className="absolute right-[-150px] top-10 h-[550px] w-[550px] rounded-full bg-blue-100/70 blur-3xl" />
            <div className="absolute left-1/2 top-[400px] h-[450px] w-[450px] -translate-x-1/2 rounded-full bg-indigo-50 blur-3xl" />
          </div>

          <div className="relative w-full px-5 sm:px-8 lg:px-12 xl:px-16">
            <div className="grid min-h-[680px] items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] xl:gap-20">
              <div className="w-full max-w-2xl">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-4 py-2 text-xs font-bold text-violet-600 shadow-sm">
                  <Sparkles size={14} />
                  Smart HR Management Platform
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Live
                </div>

                <h1 className="text-4xl font-extrabold leading-[1.04] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl xl:text-7xl">
                  Manage Your People,
                  <span className="mt-2 block bg-gradient-to-r from-violet-500 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
                    The Smarter Way.
                  </span>
                </h1>

                <p className="mt-6 max-w-xl text-[15px] leading-7 text-slate-500 sm:text-base lg:text-lg">
                  Simplify employee management, attendance, leave, payroll and
                  HR operations with one beautiful and powerful platform.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link to="/login" className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-7 py-4 text-sm font-bold text-white shadow-xl shadow-violet-200 transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
                    Get Started Free
                    <ArrowRight
                      size={17}
                      className="transition group-hover:translate-x-1"
                    />
                  </Link>
                  <a href="#portals" className="group flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-7 py-4 text-sm font-bold text-slate-600 shadow-sm transition hover:-translate-y-1 hover:border-violet-200 hover:text-violet-600 hover:shadow-lg">
                    Explore Portals
                    <ChevronRight
                      size={17}
                      className="transition group-hover:translate-x-1"
                    />
                  </a>
                </div>

                <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
                  {[
                    [Zap, "Faster HR", "Automate routine work"],
                    [ShieldCheck, "Secure", "Role-based access"],
                    [Clock3, "24/7 Access", "Always available"],
                  ].map(([Icon, title, desc]) => (
                    <div
                      key={title}
                      className="rounded-2xl border border-slate-100 bg-white/80 p-3 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-lg"
                    >
                      <Icon size={17} className="text-violet-600" />
                      <p className="mt-2 text-xs font-bold text-slate-700">
                        {title}
                      </p>
                      <p className="mt-1 text-[9px] text-slate-400">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* DASHBOARD PREVIEW */}
              <div className="relative w-full">
                <div className="absolute -inset-8 rounded-[50px] bg-gradient-to-r from-violet-200/70 via-blue-100/60 to-indigo-200/70 blur-3xl" />
                <div className="relative rounded-[28px] border border-white bg-white/90 p-2.5 shadow-2xl shadow-indigo-200/50 backdrop-blur-xl transition duration-500 hover:-translate-y-2">
                  <div className="overflow-hidden rounded-[22px] border border-slate-100 bg-slate-50">
                    <div className="flex h-11 items-center gap-2 border-b border-slate-100 bg-white px-4">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                      <div className="ml-5 flex h-6 flex-1 items-center rounded-lg bg-slate-50 px-3">
                        <span className="text-[8px] text-slate-300">
                          hrflow.app/dashboard
                        </span>
                      </div>
                      <Bell size={14} className="text-slate-300" />
                    </div>

                    <div className="flex min-h-[450px]">
                      <div className="hidden w-[170px] border-r border-slate-100 bg-white p-4 sm:block">
                        <div className="mb-7 flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
                            <Building2 size={14} />
                          </div>
                          <span className="text-xs font-bold text-slate-700">
                            HRFlow
                          </span>
                        </div>
                        <div className="space-y-2">
                          {[
                            [BarChart3, "Dashboard"],
                            [Users, "Employees"],
                            [Building2, "Departments"],
                            [CalendarDays, "Attendance"],
                            [FileText, "Leave"],
                            [WalletCards, "Payroll"],
                            [Settings, "Settings"],
                          ].map(([Icon, name], index) => (
                            <div
                              key={name}
                              className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-[10px] ${index === 0 ? "bg-violet-50 font-semibold text-violet-600" : "text-slate-400"}`}
                            >
                              <Icon size={13} />
                              {name}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex-1 p-5 lg:p-6">
                        <div className="mb-6 flex items-center justify-between">
                          <div>
                            <p className="text-base font-bold text-slate-800">
                              {getGreeting()}, Admin 👋
                            </p>
                            <p className="mt-1 text-[10px] text-slate-400">
                              Here's what's happening with your workforce.
                            </p>
                          </div>
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-600">
                            AJ
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                          {dashboardStats.map((item) => {
                            const Icon = item.icon;
                            return (
                              <div
                                key={item.label}
                                className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                              >
                                <div
                                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.bg} ${item.color}`}
                                >
                                  <Icon size={14} />
                                </div>
                                <p className="mt-2 text-lg font-extrabold text-slate-800">
                                  {item.value}
                                </p>
                                <p className="text-[9px] text-slate-400">
                                  {item.label}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PORTALS */}
        <section
          id="portals"
          className="w-full bg-slate-50/50 px-5 py-24 sm:px-8 lg:px-12 xl:px-16"
        >
          <div className="w-full">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-[10px] font-bold tracking-wide text-blue-600">
                ROLE BASED ACCESS
              </span>
              <h2 className="mt-4 text-3xl font-extrabold text-slate-900 sm:text-4xl lg:text-5xl">
                One System.{" "}
                <span className="text-violet-600">Three Powerful Portals.</span>
              </h2>
              <p className="mt-4 text-sm leading-6 text-slate-500">
                Select a portal to experience role-based management.
              </p>
            </div>

            <div className="mt-14 grid w-full gap-6 lg:grid-cols-3">
              {portalData.map((portal) => {
                const Icon = portal.icon;
                return (
                  <div
                    key={portal.title}
                    className="group overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
                  >
                    <div
                      className={`relative overflow-hidden bg-gradient-to-br ${portal.color} p-7`}
                    >
                      <div className="relative flex items-center justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur">
                          <Icon size={23} />
                        </div>
                        <ArrowUpRight
                          size={21}
                          className="text-white/60 transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-white"
                        />
                      </div>
                      <h3 className="relative mt-6 text-xl font-bold text-white">
                        {portal.title}
                      </h3>
                      <p className="relative mt-2 text-sm leading-6 text-white/80">
                        {portal.description}
                      </p>
                    </div>
                    <div className="p-7">
                      {[
                        "Easy to use",
                        "Role-based permissions",
                        "Secure data",
                        "Powerful analytics",
                      ].map((item) => (
                        <div
                          key={item}
                          className="mb-3 flex items-center gap-2 text-sm text-slate-600"
                        >
                          <CheckCircle2
                            size={16}
                            className="text-emerald-500"
                          />{" "}
                          {item}
                        </div>
                      ))}
                      <Link
                        to="/login"
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600"
                      >
                        Access {portal.title} <ArrowRight size={15} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-slate-100 bg-white py-8">
        <div className="mx-auto flex flex-col items-center justify-between gap-4 px-5 text-center sm:flex-row sm:text-left sm:px-8">
          <p className="text-xs text-slate-400">
            © 2026 HRFlow / Fuel It Online. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-slate-500">
            <Link to="/login" className="hover:text-violet-600">Admin Login</Link>
            <Link to="/login" className="hover:text-violet-600">HR Login</Link>
            <Link to="/login" className="hover:text-violet-600">Employee Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;