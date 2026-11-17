import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Users,
  ShieldCheck,
  Building2,
  Sparkles,
  Menu,
  X,
  Target,
  HeartHandshake,
  Award,
  Zap,
  Cpu,
} from "lucide-react";

const AboutPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const stats = [
    { label: "Employees Managed", value: "100,000+", icon: Users, color: "text-violet-600 bg-violet-50" },
    { label: "Active Companies", value: "500+", icon: Building2, color: "text-indigo-600 bg-indigo-50" },
    { label: "System Uptime", value: "99.99%", icon: Zap, color: "text-emerald-600 bg-emerald-50" },
    { label: "HR Satisfaction Rate", value: "4.9 / 5.0", icon: Award, color: "text-amber-600 bg-amber-50" },
  ];

  const values = [
    {
      icon: Target,
      title: "Workforce Empowerment",
      description: "We build tools that simplify HR tasks so leaders can focus on empowering their people, fostering collaboration, and driving business growth.",
      badge: "Core Mission",
      color: "border-violet-200 bg-violet-50/40 text-violet-700",
    },
    {
      icon: Cpu,
      title: "Smart Automation",
      description: "From multi-scope shift policies to instant payroll calculations, our intelligent automation reduces manual workload by up to 80%.",
      badge: "Innovation",
      color: "border-sky-200 bg-sky-50/40 text-sky-700",
    },
    {
      icon: ShieldCheck,
      title: "Enterprise Grade Security",
      description: "Role-based access control, data encryption, and isolated portal environments ensure employee information remains private and compliant.",
      badge: "Trust & Safety",
      color: "border-emerald-200 bg-emerald-50/40 text-emerald-700",
    },
    {
      icon: HeartHandshake,
      title: "People-First Design",
      description: "An intuitive, accessible interface designed specifically for every stakeholder—Admins, HR Managers, and Employees alike.",
      badge: "User Experience",
      color: "border-rose-200 bg-rose-50/40 text-rose-700",
    },
  ];

  const milestones = [
    { year: "Phase 1", title: "Centralized Employee Hub", description: "Launched multi-department organization mapping, role permissions, and digital employee records." },
    { year: "Phase 2", title: "Smart Policy Engine", description: "Pioneered multi-scope shift policy creator supporting Regular, Night, Flexi, and Hybrid work schedules." },
    { year: "Phase 3", title: "Real-time Attendance & Leave", description: "Automated daily clock-ins, grace periods, leave accruals, and multi-level approval workflows." },
    { year: "Phase 4", title: "Integrated Payroll & RBAC", description: "Delivered digital pay slip processing and isolated portal environments for Admin, HR, and Employees." },
  ];

  const teamMembers = [
    { name: "Aayush Jangir", role: "Lead Systems Architect & Product Lead", department: "Engineering & Product", iconBg: "bg-violet-100 text-violet-700" },
    { name: "Priya Singh", role: "Head of HR Operations", department: "People Operations", iconBg: "bg-indigo-100 text-indigo-700" },
    { name: "Vikram Patel", role: "Cloud & Infrastructure Lead", department: "DevOps & Security", iconBg: "bg-emerald-100 text-emerald-700" },
    { name: "Sneha Reddy", role: "Customer Success Director", department: "Client Experience", iconBg: "bg-amber-100 text-amber-700" },
  ];

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
            <Link to="/features" className="py-3 text-sm font-semibold text-slate-500 transition hover:text-violet-600">
              Features
            </Link>
            <Link to="/about" className="relative py-3 text-sm font-bold text-violet-600">
              About Us
              <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500" />
            </Link>
            <a href="/#portals" className="py-3 text-sm font-semibold text-slate-500 transition hover:text-violet-600">
              Portals
            </a>
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
              <Link to="/features" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-600">
                Features
              </Link>
              <Link to="/about" onClick={() => setMenuOpen(false)} className="rounded-xl bg-violet-50 px-4 py-3 text-sm font-bold text-violet-600">
                About Us
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
        <section className="relative overflow-hidden bg-gradient-to-b from-violet-50/60 via-white to-white py-16 lg:py-24">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-40 top-10 h-[500px] w-[500px] rounded-full bg-violet-100/60 blur-3xl" />
            <div className="absolute right-[-120px] top-20 h-[550px] w-[550px] rounded-full bg-blue-100/60 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 xl:px-16 text-center">
            <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-4 py-2 text-xs font-extrabold text-violet-700 shadow-sm">
              <Sparkles size={15} className="text-violet-600" />
              ABOUT HRFLOW & FUEL IT ONLINE
            </div>

            <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-[1.08] text-slate-900 sm:text-5xl lg:text-6xl">
              We Are Building the Future of{" "}
              <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
                Human Resource Technology
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg">
              HRFlow was created with a clear mission: eliminate repetitive paperwork, streamline workforce shift management, and give HR professionals and employees a transparent, beautiful digital workplace.
            </p>

            {/* IMPACT STAT COUNTERS */}
            <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
              {stats.map((stat) => {
                const StatIcon = stat.icon;
                return (
                  <div key={stat.label} className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs hover:shadow-lg transition">
                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${stat.color} mb-3`}>
                      <StatIcon size={24} />
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stat.value}</h3>
                    <p className="text-xs text-slate-500 font-semibold mt-1">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================= MISSION & VALUES ================= */}
        <section className="py-20 bg-slate-50/50 border-t border-slate-100">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 xl:px-16">
            <div className="text-center mb-14">
              <span className="inline-flex rounded-full bg-violet-100 px-4 py-1.5 text-xs font-extrabold text-violet-700">
                WHAT DRIVES US
              </span>
              <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
                Our Core Principles & Values
              </h2>
              <p className="mt-2 text-sm text-slate-500 max-w-2xl mx-auto">
                Designed to deliver reliability, security, and exceptional user experience across every department.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {values.map((val) => {
                const ValIcon = val.icon;
                return (
                  <div
                    key={val.title}
                    className="group rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xs hover:border-violet-300 hover:shadow-xl transition duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-md shadow-violet-200">
                        <ValIcon size={24} />
                      </div>
                      <span className={`rounded-full border px-3.5 py-1 text-xs font-extrabold ${val.color}`}>
                        {val.badge}
                      </span>
                    </div>

                    <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-violet-600 transition">
                      {val.title}
                    </h3>

                    <p className="mt-3 text-sm leading-relaxed text-slate-600">
                      {val.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================= PLATFORM JOURNEY TIMELINE ================= */}
        <section className="py-20 bg-white border-t border-slate-100">
          <div className="mx-auto max-w-5xl px-5 sm:px-8 lg:px-12">
            <div className="text-center mb-14">
              <span className="inline-flex rounded-full bg-blue-50 px-4 py-1.5 text-xs font-extrabold text-blue-700 border border-blue-200">
                PLATFORM EVOLUTION
              </span>
              <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
                Our Development Milestones
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                How HRFlow evolved into a full enterprise HR management system.
              </p>
            </div>

            <div className="space-y-6">
              {milestones.map((item, idx) => (
                <div key={item.title} className="flex flex-col sm:flex-row items-start gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs hover:border-violet-300 transition">
                  <span className="shrink-0 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-extrabold text-white shadow-md">
                    {item.year}
                  </span>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">{item.title}</h3>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= LEADERSHIP TEAM ================= */}
        <section className="py-20 bg-slate-50/50 border-t border-slate-100">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 xl:px-16">
            <div className="text-center mb-14">
              <span className="inline-flex rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-extrabold text-emerald-700 border border-emerald-200">
                MEET THE TEAM
              </span>
              <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
                Built by HR & Engineering Experts
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Dedicated professionals passionate about building modern workforce tools.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {teamMembers.map((member) => (
                <div key={member.name} className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-xs hover:shadow-xl transition duration-300">
                  <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-lg font-extrabold ${member.iconBg} mb-4`}>
                    {member.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">{member.name}</h3>
                  <p className="text-xs font-bold text-violet-600 mt-1">{member.role}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{member.department}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= CTA BANNER ================= */}
        <section className="py-16 bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 text-white">
          <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
            <h2 className="text-3xl font-extrabold sm:text-4xl lg:text-5xl">
              Transform Your HR Management Today
            </h2>
            <p className="mt-4 text-sm text-violet-100 sm:text-base">
              Experience seamless employee records, policy scheduling, and automated payroll operations.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link to="/login" className="rounded-2xl bg-white px-8 py-4 text-sm font-extrabold text-violet-700 shadow-lg hover:bg-violet-50 hover:-translate-y-0.5 transition">
                Get Started Free
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

export default AboutPage;
