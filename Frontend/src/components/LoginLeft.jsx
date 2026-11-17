import React from 'react';

const LoginLeft = () => {
  return (
    <div className="hidden md:flex w-1/2 bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 relative overflow-hidden border-slate-200">
      <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/15 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
      <div className="relative z-10 flex flex-col items-start justify-center p-20 w-full h-full">
        <h1 className="text-5xl flex justify-start font-bold text-white leading-tight tracking-tight mb-6">
          HR Management <br /> System
        </h1>
        <p className="text-lg text-blue-100 max-w-md leading-relaxed">
          Streamline your workforce operation, track attendance, manage payroll, and empower your team securely.
        </p>
      </div>
    </div>
  );
};

export default LoginLeft;
